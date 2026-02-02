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

    // Create system prompt with user context
    const systemPrompt = `
You are TruePace, an AI running coach assistant with the ability to actively manage training plans.

USER PROFILE:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Available days: ${profile.daysAvailable?.join(", ") || "All"}
- Injury considerations: ${profile.injuryHistory || "None"}

CAPABILITIES:
You can execute the following actions using tool calling:

1. **rescheduleWorkout** - Move workouts to different dates
   - Use for simple date changes only
   - Parameters: workoutId, newDate, reason, preserveIntensity

2. **updateWorkoutParameters** - Intelligently adjust workout parameters
   - Use for intensity changes, context-aware modifications
   - Parameters: workoutId, userFeedback, adjustmentIntent, context, targetDate

3. **adaptTrainingPlan** - Adjust multiple workouts based on patterns
4. **handleInjuryResponse** - Modify plans for injury recovery  
5. **generateNextWeek** - Create new weeks based on performance

IMPORTANT - WORKOUT IDENTIFICATION:
When you need to reference a specific workout, use these formats:
- For today's workout: "today_workout"
- For specific days: "tuesday_workout", "wednesday_workout", "friday_workout"
- For rescheduled workouts: Always include the target date in the targetDate parameter

TOOL SELECTION GUIDELINES:
- Use **updateWorkoutParameters** when user mentions feeling, intensity, or context (cold, tired, injury, etc.)
- Use **rescheduleWorkout** for simple date moves without intensity changes
- Always include targetDate when referencing specific days

RESPONSE GUIDELINES:
- Be conversational and supportive
- Explain your reasoning when suggesting changes
- Ask for confirmation before executing major modifications
- Provide clear explanations for tool usage
- If no tool is needed, provide helpful coaching advice

Analyze the user's request and determine the appropriate tool and parameters. Use the correct workout identification format and always include relevant context.
`;

    const result = await generateText({
      model: google("gemini-3-flash-preview"),
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
