import { generateText } from "ai";
import { OpikExporter } from "opik-vercel";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  rescheduleWorkout,
  adaptTrainingPlan,
  handleInjuryResponse,
  generateNextWeek,
  updateWorkoutParameters,
} from "@/lib/ai-tools";
import { executeToolCall } from "@/lib/ai-execution";
import { GEMINI_API_KEY } from "@/lib/gemini";
import { Opik } from "opik";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, userId } = body;

    if (!userId || !messages) {
      return NextResponse.json(
        { error: "User ID and messages are required" },
        { status: 400 },
      );
    }

    // Fetch user profile for context
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch current workout data for AI context
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const currentWorkouts = await prisma.trainingPlan.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: today,
          lt: nextWeek,
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    // Format workout data for AI
    const workoutContext = currentWorkouts.map((workout) => ({
      date: workout.scheduledDate.toISOString().split("T")[0],
      dayName: workout.scheduledDate.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      activityType: workout.activityType,
      description: workout.description,
      targetDistance: workout.targetDistanceKm,
      targetDuration: workout.targetDurationMin,
      targetRpe: workout.targetRpe,
      status: workout.status,
    }));

    // Enhanced system prompt with autonomous behavior awareness
    const todayIso = today.toISOString().split("T")[0];
    const todayLong = today.toLocaleDateString("en-US", { weekday: "long" });

    const systemPrompt = `
You are TruePace, an AI running coach assistant with advanced autonomous capabilities.

CURRENT DATE: ${todayIso} (${todayLong})

DATE INTERPRETATION RULES:
- Interpret "today" as ${todayIso}.
- Interpret "tomorrow" as the day after ${todayIso}.
- When the user says a weekday (e.g., "Saturday"), interpret it as the next occurrence of that weekday on or after ${todayIso}, unless they explicitly say "next <weekday>" which should mean the following week's weekday.
- When the user uses phrases like "move tomorrow's run to today", map those relative phrases using CURRENT DATE before emitting tool calls.
- Always return dates in ISO format YYYY-MM-DD in tool call parameters.
  - If uncertain about which date the user means, ask a clarifying question instead of guessing.

  STRUCTURED REFERENCES:
  - When referring to a specific workout in a tool call, include a structured reference whenever possible.
  - Preferred fields: "planId" (the exact DB id) and "humanLabel" (a readable label like "Sat 2026-02-07 Tempo Run").
  - If you do not know the "planId", include a clear "humanLabel" and a date; the server will attempt fuzzy matching.
  - Always prefer "planId" when known; "workoutId" may be used as a fallback for backward compatibility.

CONFIRMATION RULES:
  - Before emitting any tool call that will modify user data (reschedule, update, adapt, handleInjuryResponse, generateNextWeek), ask the user a direct confirmation question in plain language describing the intended change (include ISO dates and workout titles where possible).
  - Do NOT assume implicit confirmation. The agent should only emit a tool call with "input.confirmed = true" when the user has explicitly confirmed the action.
  - If uncertain, ask a clarifying question instead of emitting a tool call.

USER PROFILE:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Available days: ${profile.daysAvailable?.join(", ") || "All"}
- Injury considerations: ${profile.injuryHistory || "None"}

CURRENT TRAINING PLAN (Next 7 days):
${workoutContext
  .map(
    (w) => `
  - ${w.dayName} (${w.date}): ${w.activityType} - ${w.description || "No description"}
    Target: ${w.targetDistance || "N/A"}km, ${w.targetDuration || "N/A"}min, RPE: ${
      w.targetRpe || "N/A"
    }
    Status: ${w.status}
  `,
  )
  .join("")}

AUTONOMOUS CAPABILITIES:
You can execute the following actions using tool calling:

1. **rescheduleWorkout** - Move workouts to different dates
2. **updateWorkoutParameters** - Intelligently adjust workout parameters
3. **adaptTrainingPlan** - Adjust multiple workouts based on patterns
4. **handleInjuryResponse** - Modify plans for injury recovery
5. **generateNextWeek** - Create new weeks based on performance

AUTONOMOUS BEHAVIOR:
- Proactively analyze user context and needs
- Automatically suggest adjustments when patterns indicate issues
- Generate next training week when approaching plan completion
- Respond to injury reports with conservative, safety-first approach
- Consider holistic performance data (completion rates, RPE trends, injury patterns)
- Be conversational but take initiative when beneficial

WORKOUT IDENTIFICATION:
- For today's workout: "today_workout"
- For specific days: "tuesday_workout", "wednesday_workout", etc.
- For rescheduled workouts: Always include target date in the targetDate parameter

TOOL SELECTION GUIDELINES:
- Use **updateWorkoutParameters** when user mentions feeling, intensity, or context
- Use **rescheduleWorkout** for simple date moves without intensity changes
- Use **handleInjuryResponse** for any pain, injury, or discomfort reports
- Use **generateNextWeek** when user asks about future training or plan is ending
- Use **adaptTrainingPlan** for systematic adjustments across multiple workouts

RESPONSE GUIDELINES:
- Be proactive and suggest improvements before user asks
- Explain reasoning for all recommendations
- Prioritize safety and injury prevention
- Ask for confirmation before major modifications
- Provide clear explanations for tool usage
- If no tool is needed, provide helpful coaching advice

Analyze user's request, determine appropriate tools, and take initiative when beneficial.
`;

    const requestId = randomUUID();
    const telemetrySettings = OpikExporter.getSettings({
      name: "agent-chat-interaction",
      metadata: {
        userId: userId,
        intent: "general_chat_or_tool_use",
        requestId,
      },
    });

    console.log("agent chat generateText - telemetrySettings:", {
      userId,
      requestId,
      telemetrySample: telemetrySettings,
    });

    const opik = new Opik({ apiKey: process.env.OPIK_API_KEY });

    const trace = opik.trace({
      name: "agent-chat-interaction",
      metadata: { userId, requestId },
    });
    const span = trace.span({
      name: "generateText",
      type: "llm",
      input: { recentMessages: messages.slice(-3) },
      metadata: { requestId, userId },
    });

    let result: any;
    try {
      result = await generateText({
        model: google("gemini-2.5-flash"),
        system: systemPrompt,
        messages: messages.map((msg: any) => ({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.content,
        })),
        tools: {
          rescheduleWorkout,
          adaptTrainingPlan,
          handleInjuryResponse,
          generateNextWeek,
          updateWorkoutParameters,
        },
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(30000),
        experimental_telemetry: telemetrySettings,
      });

      span.update({
        output: {
          text:
            typeof result.text === "string"
              ? result.text.slice(0, 10000)
              : result.text,
        },
      });
      span.end();
      trace.end();

      try {
        console.log("flushing opik for agent chat", { requestId });
        await opik.flush();
        console.log("opik flushed for agent chat", { requestId });
      } catch (flushErr) {
        console.error("opik flush failed for agent chat", {
          requestId,
          flushErr,
        });
      }

      console.log("agent chat generateText result:", {
        textPreview:
          typeof result.text === "string"
            ? result.text.slice(0, 200)
            : undefined,
        toolCalls: result.toolCalls ? result.toolCalls.length : 0,
      });
    } catch (err) {
      span.update({ tags: ["error"], metadata: { error: String(err) } });
      span.end();
      trace.end();
      try {
        await opik.flush();
      } catch (flushErr) {
        console.error("opik flush failed after error", { requestId, flushErr });
      }
      console.error("generateText failed", { requestId, err });
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 },
      );
    }

    // Handle any tool calls that were generated
    if (result.toolCalls && result.toolCalls.length > 0) {
      // If any tool call is not explicitly confirmed by the user (input.confirmed !== true)
      let unconfirmed = result.toolCalls.filter(
        (tc: any) => !(tc.input && tc.input.confirmed === true),
      );

      // Heuristic: if the most recent user message is an explicit affirmative ("yes", "confirm", "do it", etc.),
      // treat that as confirmation and set input.confirmed = true for all tool calls.
      try {
        const lastUserMessage = (messages || [])
          .slice()
          .reverse()
          .find((m: any) => m.role === "user");

        if (lastUserMessage && typeof lastUserMessage.content === "string") {
          const affirmative =
            /\b(?:yes|yep|yeah|y|confirm|confirmed|do it|go ahead|apply|please do it|ok|okay|sure)\b/i;
          if (affirmative.test(lastUserMessage.content)) {
            console.log(
              "Detected user confirmation in chat; auto-confirming tool calls.",
            );
            for (const tc of result.toolCalls) {
              (tc as any).input = (tc as any).input || {};
              (tc as any).input.confirmed = true;
            }
            // Recompute unconfirmed
            unconfirmed = result.toolCalls.filter(
              (tc: any) => !(tc.input && tc.input.confirmed === true),
            );
          }
        }
      } catch (err) {
        console.warn("Confirmation heuristic failed:", err);
      }

      if (unconfirmed.length > 0) {
        // Do not execute; prompt the client/UI to ask the user to confirm.
        console.log(
          "Tool calls require user confirmation, returning without execution.",
        );
        return NextResponse.json({
          response: result.text,
          toolCalls: result.toolCalls,
          requiresConfirmation: true,
        });
      }

      // All tool calls are confirmed: execute them and collect results
      const toolResults: any[] = [];
      for (const toolCall of result.toolCalls) {
        console.log("AI requested tool call:", toolCall);
        try {
          const toolResult = await executeToolCall(toolCall, userId);
          console.log("Tool execution result:", toolResult);
          toolResults.push({ toolCall, toolResult });
        } catch (error) {
          console.error("Tool execution error:", error);
          // Return error details to client instead of throwing to allow graceful UI handling
          return NextResponse.json(
            {
              error: "Tool execution failed",
              details: String(error),
              toolCall,
            },
            { status: 500 },
          );
        }
      }

      // Ask the assistant to summarize actions taken for the user
      try {
        const summaryPrompt = `You just executed the following tool calls and their results. Produce a concise, user-facing summary of what was changed, why, and any next steps the user should know about. Return plain text suitable to show in the UI.\n\nTool results: ${JSON.stringify(toolResults, null, 2)}`;

        const summary = await generateText({
          model: google("gemini-2.5-flash"),
          system: "You are TruePace, summarizing recent actions for the user.",
          messages: [{ role: "user", content: summaryPrompt }],
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(15000),
        });

        return NextResponse.json({
          response: result.text,
          toolCalls: result.toolCalls,
          toolResults,
          summary: summary.text,
        });
      } catch (err) {
        console.error("Failed to generate summary:", err);
        return NextResponse.json({
          response: result.text,
          toolCalls: result.toolCalls,
          toolResults,
        });
      }
    }

    return NextResponse.json({ response: result.text });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
