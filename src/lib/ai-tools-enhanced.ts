import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export const updateWorkoutParameters = {
  description:
    "Intelligently adjust workout parameters based on user feedback and context",
  inputSchema: z.object({
    workoutId: z.string().describe("The ID of the workout to modify"),
    userFeedback: z
      .string()
      .describe(
        "User's feedback about how they feel or what they want to change",
      ),
    adjustmentIntent: z
      .enum(["decrease", "increase", "maintain"])
      .describe("Whether to decrease, increase, or maintain intensity"),
    context: z
      .string()
      .optional()
      .describe("Additional context about the user's situation"),
    targetDate: z
      .string()
      .optional()
      .describe("New date if rescheduling is needed"),
  }),
};

export async function updateWorkoutParametersFunction(
  args: any,
  userId: string,
) {
  const { workoutId, userFeedback, adjustmentIntent, context, targetDate } =
    args;

  // Find the actual workout if placeholder ID provided
  let actualWorkoutId = workoutId;

  if (
    workoutId &&
    (workoutId.includes("today_run") ||
      workoutId.includes("current_run") ||
      workoutId.includes("placeholder"))
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const todayWorkout = await prisma.trainingPlan.findFirst({
      where: {
        userId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        activityType: ActivityType.RUN,
      },
      orderBy: { scheduledDate: "asc" },
    });

    if (todayWorkout) {
      actualWorkoutId = todayWorkout.id;
    } else {
      throw new Error("No workout found for today");
    }
  }

  // Get the current workout
  const workout = await prisma.trainingPlan.findUnique({
    where: { id: actualWorkoutId, userId },
  });

  if (!workout) {
    throw new Error("Workout not found");
  }

  // AI-driven analysis of user feedback and intent
  const feedback = userFeedback.toLowerCase();
  const fullContext = `${userFeedback} ${context || ""}`.toLowerCase();

  // Intelligent parameter adjustment logic
  let updateData: any = {};
  let reasoning = [];

  // Analyze intensity adjustment needs
  let intensityMultiplier = 1.0;
  let rpeAdjustment = 0;
  let durationMultiplier = 1.0;
  let intensityPrefix = "";

  if (adjustmentIntent === "decrease") {
    // Smart analysis of decrease reasons
    if (
      feedback.includes("cold") ||
      feedback.includes("sick") ||
      feedback.includes("flu") ||
      feedback.includes("unwell")
    ) {
      intensityMultiplier = 0.5; // Major reduction for illness
      rpeAdjustment = -3;
      durationMultiplier = 0.6;
      intensityPrefix = "Recovery";
      reasoning.push(
        "Illness detected: major intensity reduction for recovery",
      );
    } else if (
      feedback.includes("injury") ||
      feedback.includes("pain") ||
      feedback.includes("hurt") ||
      feedback.includes("sore")
    ) {
      intensityMultiplier = 0.4; // Very conservative for injury
      rpeAdjustment = -4;
      durationMultiplier = 0.5;
      intensityPrefix = "Rehab";
      reasoning.push("Injury concern: very conservative adjustment for safety");
    } else if (
      feedback.includes("tired") ||
      feedback.includes("fatigue") ||
      feedback.includes("exhausted") ||
      feedback.includes("drained")
    ) {
      intensityMultiplier = 0.7; // Moderate reduction for fatigue
      rpeAdjustment = -2;
      durationMultiplier = 0.8;
      intensityPrefix = "Easy";
      reasoning.push("Fatigue detected: moderate intensity reduction");
    } else if (
      feedback.includes("busy") ||
      feedback.includes("time") ||
      feedback.includes("short") ||
      feedback.includes("quick")
    ) {
      intensityMultiplier = 0.9; // Maintain intensity, reduce duration
      rpeAdjustment = 0;
      durationMultiplier = 0.6;
      intensityPrefix = "Quick";
      reasoning.push(
        "Time constraint: maintaining intensity with shorter duration",
      );
    } else if (
      feedback.includes("stress") ||
      feedback.includes("overwhelmed") ||
      feedback.includes("mental")
    ) {
      intensityMultiplier = 0.8;
      rpeAdjustment = -1;
      durationMultiplier = 0.7;
      intensityPrefix = "Light";
      reasoning.push("Mental stress: reducing overall load");
    } else {
      // Default moderate reduction
      intensityMultiplier = 0.75;
      rpeAdjustment = -1;
      durationMultiplier = 0.8;
      intensityPrefix = "Easy";
      reasoning.push("General decrease: moderate intensity reduction");
    }
  } else if (adjustmentIntent === "increase") {
    // Smart analysis of increase reasons
    if (
      feedback.includes("good") ||
      feedback.includes("great") ||
      feedback.includes("strong") ||
      feedback.includes("energetic")
    ) {
      intensityMultiplier = 1.2;
      rpeAdjustment = 1;
      durationMultiplier = 1.1;
      intensityPrefix = "Progressive";
      reasoning.push("Feeling strong: progressive overload applied");
    } else if (
      feedback.includes("race") ||
      feedback.includes("competition") ||
      feedback.includes("event")
    ) {
      intensityMultiplier = 1.3;
      rpeAdjustment = 2;
      durationMultiplier = 1.0; // Keep duration, increase intensity
      intensityPrefix = "Peak";
      reasoning.push("Race preparation: peak intensity applied");
    } else if (
      feedback.includes("behind") ||
      feedback.includes("catch") ||
      feedback.includes("makeup")
    ) {
      intensityMultiplier = 1.15;
      rpeAdjustment = 1;
      durationMultiplier = 1.2;
      intensityPrefix = "Catch-up";
      reasoning.push("Making up for missed workouts: balanced increase");
    } else {
      // Default moderate increase
      intensityMultiplier = 1.1;
      rpeAdjustment = 1;
      durationMultiplier = 1.1;
      intensityPrefix = "Challenging";
      reasoning.push("General increase: moderate intensity boost");
    }
  }

  // Apply intelligent workout modifications
  let modifiedDescription = workout.description || "";

  if (workout.description) {
    // Workout type-specific adjustments
    if (workout.description.toLowerCase().includes("interval")) {
      if (workout.targetDistanceKm) {
        const newDistance = Math.max(
          2,
          Math.round(workout.targetDistanceKm * intensityMultiplier),
        );
        updateData.targetDistanceKm = newDistance;
        modifiedDescription = modifiedDescription.replace(
          /(\d+km)/,
          `${newDistance}km`,
        );
      }
      if (workout.targetDurationMin) {
        const newDuration = Math.round(
          workout.targetDurationMin * durationMultiplier,
        );
        updateData.targetDurationMin = newDuration;
      }
      if (workout.targetRpe) {
        const newRpe = Math.max(
          1,
          Math.min(10, workout.targetRpe + rpeAdjustment),
        );
        updateData.targetRpe = newRpe;
      }
      // Update description with intensity prefix
      modifiedDescription = modifiedDescription
        .replace(/Goal Pace/, `${intensityPrefix} Pace`)
        .replace(/10K Goal Pace Intervals/, `${intensityPrefix} Intervals`)
        .replace(/Easy Intervals/, `${intensityPrefix} Intervals`);
    } else if (workout.description.toLowerCase().includes("tempo")) {
      if (workout.targetDistanceKm) {
        const newDistance = Math.max(
          3,
          Math.round(workout.targetDistanceKm * intensityMultiplier),
        );
        updateData.targetDistanceKm = newDistance;
        modifiedDescription = modifiedDescription.replace(
          /(\d+km)/,
          `${newDistance}km`,
        );
      }
      if (workout.targetRpe) {
        const newRpe = Math.max(
          3,
          Math.min(10, workout.targetRpe + rpeAdjustment),
        );
        updateData.targetRpe = newRpe;
      }
      modifiedDescription = modifiedDescription
        .replace(/Tempo/, `${intensityPrefix} Tempo`)
        .replace(/Easy Tempo/, `${intensityPrefix} Tempo`);
    } else if (workout.description.toLowerCase().includes("long")) {
      if (workout.targetDistanceKm) {
        const newDistance = Math.max(
          5,
          Math.round(workout.targetDistanceKm * intensityMultiplier),
        );
        updateData.targetDistanceKm = newDistance;
        modifiedDescription = modifiedDescription.replace(
          /(\d+km)/,
          `${newDistance}km`,
        );
      }
      if (workout.targetRpe) {
        const newRpe = Math.max(
          2,
          Math.min(8, workout.targetRpe + rpeAdjustment),
        );
        updateData.targetRpe = newRpe;
      }
      modifiedDescription = modifiedDescription
        .replace(/Long/, `${intensityPrefix} Long`)
        .replace(/Easy Long/, `${intensityPrefix} Long`);
    } else {
      // Regular runs
      if (workout.targetDistanceKm) {
        const newDistance = Math.max(
          2,
          Math.round(workout.targetDistanceKm * intensityMultiplier),
        );
        updateData.targetDistanceKm = newDistance;
        modifiedDescription = modifiedDescription.replace(
          /(\d+km)/,
          `${newDistance}km`,
        );
      }
      if (workout.targetRpe) {
        const newRpe = Math.max(
          2,
          Math.min(9, workout.targetRpe + rpeAdjustment),
        );
        updateData.targetRpe = newRpe;
      }
    }

    updateData.description = modifiedDescription;
  }

  // Handle rescheduling if targetDate provided
  if (targetDate) {
    let parsedDate: Date;

    if (targetDate.toLowerCase() === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      parsedDate = tomorrow;
    } else if (targetDate.toLowerCase() === "today") {
      parsedDate = new Date();
    } else {
      const dayOfWeek = targetDate.toLowerCase();
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayIndex = daysOfWeek.indexOf(dayOfWeek);

      if (dayIndex !== -1) {
        const today = new Date();
        const currentDayIndex = today.getDay();
        let daysToAdd = dayIndex - currentDayIndex;

        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }

        const targetDateObj = new Date(today);
        targetDateObj.setDate(today.getDate() + daysToAdd);
        parsedDate = targetDateObj;
      } else {
        parsedDate = new Date(targetDate);
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid date format: ${targetDate}`);
        }
      }
    }

    updateData.scheduledDate = parsedDate;
    reasoning.push(`Rescheduled to ${targetDate}`);
  }

  // Add AI reasoning
  updateData.aiReasoning = `AI-adjusted based on: ${userFeedback}. ${reasoning.join(". ")}. Intent: ${adjustmentIntent}`;

  // Apply updates
  const updated = await prisma.trainingPlan.update({
    where: { id: actualWorkoutId, userId },
    data: updateData,
  });

  return {
    success: true,
    updated: {
      id: updated.id,
      description: updated.description,
      targetDistanceKm: updated.targetDistanceKm,
      targetRpe: updated.targetRpe,
      targetDurationMin: updated.targetDurationMin,
      scheduledDate: updated.scheduledDate,
    },
    reasoning: reasoning,
    adjustments: {
      intensityMultiplier,
      rpeAdjustment,
      durationMultiplier,
      intensityPrefix,
    },
  };
}
