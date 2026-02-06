import { generateText } from "ai";
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
    const systemPrompt = `
You are TruePace, an AI running coach assistant with advanced autonomous capabilities.

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

    const result = await generateText({
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
    });

    // Execute any tool calls that were generated
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        console.log("AI requested tool call:", toolCall);
        try {
          const toolResult = await executeToolCall(toolCall, userId);
          console.log("Tool execution result:", toolResult);
        } catch (error) {
          console.error("Tool execution error:", error);
          throw error;
        }
      }
    }

    return NextResponse.json({
      response: result.text,
      toolCalls: result.toolCalls, // Include tool calls for transparency
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
