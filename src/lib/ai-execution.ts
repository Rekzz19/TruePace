import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function executeToolCall(toolCall: any, userId: string) {
  const { toolName, input } = toolCall;

  console.log(`Executing tool: ${toolName} with input:`, input);

  try {
    switch (toolName) {
      case "rescheduleWorkout":
        return await rescheduleWorkoutFunction(input, userId);
      case "adaptTrainingPlan":
        return await adaptTrainingPlanFunction(input, userId);
      case "handleInjuryResponse":
        return await handleInjuryResponseFunction(input, userId);
      case "generateNextWeek":
        return await generateNextWeekFunction(input, userId);
      case "updateWorkoutParameters":
        return await updateWorkoutParametersFunction(input, userId);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    throw error;
  }
}

async function rescheduleWorkoutFunction(args: any, userId: string) {
  const { workoutId, newDate, reason, preserveIntensity } = args;

  // If AI provided a placeholder ID, find the actual workout
  let actualWorkoutId = workoutId;

  if (
    workoutId &&
    (workoutId.includes("today_run") ||
      workoutId.includes("current_run") ||
      workoutId.includes("placeholder"))
  ) {
    // Find today's actual workout
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
      console.log(
        `Found actual workout ID: ${actualWorkoutId} for today's run`,
      );
    } else {
      throw new Error(
        "No run found for today to reschedule. Please specify the exact workout or check your training plan.",
      );
    }
  }

  // Parse the new date - handle relative dates like "Tuesday"
  let parsedDate: Date;

  if (newDate.toLowerCase() === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    parsedDate = tomorrow;
  } else if (newDate.toLowerCase() === "today") {
    parsedDate = new Date();
  } else {
    // Try to parse as a day of the week
    const dayOfWeek = newDate.toLowerCase();
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
      // Find the next occurrence of this day
      const today = new Date();
      const currentDayIndex = today.getDay();
      let daysToAdd = dayIndex - currentDayIndex;

      if (daysToAdd <= 0) {
        daysToAdd += 7; // Go to next week if the day has passed this week
      }

      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      parsedDate = targetDate;
    } else {
      // Try to parse as a regular date string
      parsedDate = new Date(newDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(
          `Invalid date format: ${newDate}. Please use a specific date (YYYY-MM-DD) or day of the week.`,
        );
      }
    }
  }

  // Validate new date doesn't conflict with existing workouts
  const existingWorkout = await prisma.trainingPlan.findFirst({
    where: {
      userId,
      scheduledDate: parsedDate,
      activityType: ActivityType.RUN,
    },
  });

  if (existingWorkout) {
    throw new Error("There is already a run scheduled for this date");
  }

  // Update the workout
  const updated = await prisma.trainingPlan.update({
    where: { id: actualWorkoutId, userId },
    data: {
      scheduledDate: parsedDate,
      aiReasoning: `Rescheduled: ${reason}${preserveIntensity ? " (intensity preserved)" : " (intensity reduced)"}`,
    },
  });

  return {
    success: true,
    updated: {
      id: updated.id,
      newDate: updated.scheduledDate,
      description: updated.description,
    },
  };
}

async function adaptTrainingPlanFunction(args: any, userId: string) {
  const { adjustmentType, reason, duration, targetWorkouts } = args;
  const operations = [];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + duration);

  // Get affected workouts
  const workouts = await prisma.trainingPlan.findMany({
    where: {
      userId,
      scheduledDate: { gte: startDate, lte: endDate },
      activityType: ActivityType.RUN,
      ...(targetWorkouts &&
        targetWorkouts.length > 0 && {
          id: { in: targetWorkouts },
        }),
    },
    orderBy: { scheduledDate: "asc" },
  });

  for (const workout of workouts) {
    let updateData: any = {
      aiReasoning: `Adapted: ${reason}`,
    };

    switch (adjustmentType) {
      case "reduce_intensity":
        if (workout.targetDistanceKm) {
          updateData.targetDistanceKm = workout.targetDistanceKm * 0.8;
        }
        if (workout.targetDurationMin) {
          updateData.targetDurationMin = workout.targetDurationMin * 0.9;
        }
        break;

      case "add_rest":
        // Convert some runs to rest days
        if (Math.random() > 0.7) {
          // Convert ~30% of runs to rest
          updateData.activityType = ActivityType.REST;
          updateData.targetDistanceKm = null;
          updateData.targetDurationMin = null;
        }
        break;

      case "increase_intensity":
        if (workout.targetDistanceKm) {
          updateData.targetDistanceKm = workout.targetDistanceKm * 1.1;
        }
        break;

      case "extend_plan":
        // This would be handled separately by generateNextWeek
        continue;
    }

    operations.push(
      prisma.trainingPlan.update({
        where: { id: workout.id },
        data: updateData,
      }),
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return {
    success: true,
    modifiedWorkouts: operations.length,
    adjustmentType,
    duration,
  };
}

async function handleInjuryResponseFunction(args: any, userId: string) {
  const { injuryType, affectedArea, severity, action } = args;

  // Safety-critical: always reduce training load
  const operations = [];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7); // 1 week minimum rest

  // Convert next 3 runs to rest/cross-train based on severity
  const upcomingRuns = await prisma.trainingPlan.findMany({
    where: {
      userId,
      scheduledDate: { gte: startDate, lte: endDate },
      activityType: ActivityType.RUN,
    },
    orderBy: { scheduledDate: "asc" },
    take: 3,
  });

  for (const run of upcomingRuns) {
    let newActivityType: ActivityType = ActivityType.REST;

    if (action === "cross_train" && severity !== "severe") {
      newActivityType = ActivityType.CROSS_TRAIN;
    }

    operations.push(
      prisma.trainingPlan.update({
        where: { id: run.id },
        data: {
          activityType: newActivityType,
          targetDistanceKm:
            newActivityType === ActivityType.REST
              ? null
              : (run.targetDistanceKm || 5) * 0.5,
          targetDurationMin:
            newActivityType === ActivityType.REST
              ? null
              : (run.targetDurationMin || 30) * 0.7,
          aiReasoning: `Injury response: ${injuryType} - ${affectedArea} (${severity})`,
        },
      }),
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return {
    success: true,
    modifiedWorkouts: operations.length,
    injuryType,
    severity,
    action,
  };
}

async function generateNextWeekFunction(args: any, userId: string) {
  const { performanceAnalysis, maintainProgression } = args;

  // Get user profile for context
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  if (!profile) {
    throw new Error("User profile not found");
  }

  // Calculate start date for next week
  const lastWorkout = await prisma.trainingPlan.findFirst({
    where: { userId },
    orderBy: { scheduledDate: "desc" },
  });

  if (!lastWorkout) {
    throw new Error("No existing workouts found");
  }

  const startDate = new Date(lastWorkout.scheduledDate);
  startDate.setDate(startDate.getDate() + 1); // Start from day after last workout

  // Generate 2 weeks of workouts (14 days)
  const dbOperations = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const workoutDate = new Date(startDate);
    workoutDate.setDate(startDate.getDate() + dayOffset);

    // Simple pattern generation based on performance
    const dayOfWeek = workoutDate.getDay();

    // Adjust intensity based on performance
    let intensityMultiplier = 1;
    if (performanceAnalysis.completionRate < 0.7) {
      intensityMultiplier = 0.8; // Reduce if low completion
    } else if (performanceAnalysis.averageRpe > 7) {
      intensityMultiplier = 0.9; // Reduce if high effort
    } else if (
      performanceAnalysis.completionRate > 0.9 &&
      performanceAnalysis.averageRpe < 5
    ) {
      intensityMultiplier = 1.1; // Increase if doing well
    }

    // Create workout pattern (simplified)
    if (dayOfWeek % 3 === 0) {
      // Every 3rd day is a run
      const baseDistance =
        profile.goal === "TARGET_5K"
          ? 5
          : profile.goal === "TARGET_10K"
            ? 8
            : 3;

      dbOperations.push(
        prisma.trainingPlan.create({
          data: {
            userId,
            scheduledDate: workoutDate,
            activityType: ActivityType.RUN,
            targetDistanceKm: baseDistance * intensityMultiplier,
            targetDurationMin: 30 * intensityMultiplier,
            description: maintainProgression
              ? "Progression Run"
              : "Maintenance Run",
            aiReasoning: `Generated based on ${performanceAnalysis.completionRate * 100}% completion rate`,
            status: "SCHEDULED",
          },
        }),
      );
    } else if (dayOfWeek % 5 === 0) {
      // Every 5th day is cross-train
      dbOperations.push(
        prisma.trainingPlan.create({
          data: {
            userId,
            scheduledDate: workoutDate,
            activityType: ActivityType.CROSS_TRAIN,
            targetDurationMin: 45,
            description: "Cross Training",
            aiReasoning: "Active recovery day",
            status: "SCHEDULED",
          },
        }),
      );
    } else {
      // Rest day
      dbOperations.push(
        prisma.trainingPlan.create({
          data: {
            userId,
            scheduledDate: workoutDate,
            activityType: ActivityType.REST,
            description: "Rest Day",
            aiReasoning: "Recovery day",
            status: "SCHEDULED",
          },
        }),
      );
    }
  }

  if (dbOperations.length > 0) {
    await prisma.$transaction(dbOperations);
  }

  return {
    success: true,
    generatedWorkouts: dbOperations.length,
    performanceAnalysis,
    maintainProgression,
  };
}

async function updateWorkoutParametersFunction(args: any, userId: string) {
  const { workoutId, userFeedback, adjustmentIntent, context, targetDate } =
    args;

  // Find the actual workout if placeholder ID provided
  let actualWorkoutId = workoutId;

  if (
    workoutId &&
    (workoutId.includes("today_run") ||
      workoutId.includes("current_run") ||
      workoutId.includes("placeholder") ||
      workoutId.includes("tuesday_run") ||
      workoutId.includes("monday_run") ||
      workoutId.includes("wednesday_run") ||
      workoutId.includes("thursday_run") ||
      workoutId.includes("friday_run") ||
      workoutId.includes("saturday_run") ||
      workoutId.includes("sunday_run") ||
      workoutId.includes("tuesday_workout") ||
      workoutId.includes("monday_workout") ||
      workoutId.includes("wednesday_workout") ||
      workoutId.includes("thursday_workout") ||
      workoutId.includes("friday_workout") ||
      workoutId.includes("saturday_workout") ||
      workoutId.includes("sunday_workout") ||
      workoutId.includes("workout"))
  ) {
    // If targetDate is provided, find workout on that date
    let searchDate: Date;

    if (targetDate) {
      // Parse the target date
      if (targetDate.toLowerCase() === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        searchDate = tomorrow;
      } else if (targetDate.toLowerCase() === "today") {
        searchDate = new Date();
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
          searchDate = targetDateObj;
        } else {
          searchDate = new Date(targetDate);
        }
      }
    } else {
      // Default to today if no target date
      searchDate = new Date();
    }

    // Search for workout on the target date
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const targetWorkout = await prisma.trainingPlan.findFirst({
      where: {
        userId,
        scheduledDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        activityType: ActivityType.RUN,
      },
      orderBy: { scheduledDate: "asc" },
    });

    if (targetWorkout) {
      actualWorkoutId = targetWorkout.id;
      console.log(
        `Found actual workout ID: ${actualWorkoutId} for ${targetDate} workout`,
      );
    } else {
      throw new Error(
        `No workout found for ${targetDate || "today"}. Please specify the exact workout or check your training plan.`,
      );
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
