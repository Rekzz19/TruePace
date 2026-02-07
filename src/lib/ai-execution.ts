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
  // Additional options supported from AI input:
  // - workoutIds: string[] to reschedule multiple runs
  // - shiftDays: number to shift selected runs by N days
  // - resolveStrategy: 'error' | 'shift_conflict_forward' (default: 'shift_conflict_forward')
  const {
    workoutIds,
    shiftDays,
    resolveStrategy = "shift_conflict_forward",
  } = args;

  // If AI provided a placeholder ID, find the actual workout
  let actualWorkoutId = workoutId;
  let targetWorkout = null;

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
      targetWorkout = todayWorkout;
      console.log(
        `Found actual workout ID: ${actualWorkoutId} for today's run`,
      );
    } else {
      throw new Error(
        "No run found for today to reschedule. Please specify the exact workout or check your training plan.",
      );
    }
  } else if (workoutId && workoutId.includes("_workout")) {
    // Handle day-specific workouts (tuesday_workout, wednesday_workout, today_workout, tomorrow_workout, etc.)
    const dayOfWeekRaw = workoutId.split("_")[0];
    const dayOfWeek = String(dayOfWeekRaw).toLowerCase();

    let targetDate: Date;

    if (dayOfWeek === "today") {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    } else if (dayOfWeek === "tomorrow") {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(0, 0, 0, 0);
    } else if (dayOfWeek === "yesterday") {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      // Assume a weekday name
      try {
        targetDate = getNextOccurrenceOfDay(dayOfWeek);
      } catch (err) {
        throw new Error(
          `Unrecognized workout identifier: ${workoutId}. Use explicit date (YYYY-MM-DD) or a weekday name.`,
        );
      }
    }

    targetWorkout = await prisma.trainingPlan.findFirst({
      where: {
        userId,
        scheduledDate: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
        activityType: ActivityType.RUN,
      },
      orderBy: { scheduledDate: "asc" },
    });

    if (targetWorkout) {
      actualWorkoutId = targetWorkout.id;
      console.log(
        `Found actual workout ID: ${actualWorkoutId} for ${dayOfWeek}'s run`,
      );
    } else {
      throw new Error(
        `No run found for ${dayOfWeek} to reschedule. Please check your training plan.`,
      );
    }
  } else if (workoutId) {
    // Direct ID provided - try exact match first
    targetWorkout = await prisma.trainingPlan.findFirst({
      where: {
        id: workoutId,
        userId,
      },
    });

    if (targetWorkout) {
      actualWorkoutId = targetWorkout.id;
    } else {
      // If exact ID fails, try to find by description pattern matching over a wider window
      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date();
      rangeEnd.setDate(rangeEnd.getDate() + 14);
      rangeEnd.setHours(23, 59, 59, 999);

      const allWorkouts = await prisma.trainingPlan.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
      });

      // Try to parse date-based AI IDs like '2026-02-09_RUN_Easy Aerobic Run'
      let matchingWorkout: any = null;
      const dateMatch = workoutId.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        const candidates = allWorkouts.filter(
          (w) => w.scheduledDate.toISOString().split("T")[0] === dateStr,
        );
        if (candidates.length > 0) {
          // Extract description part from the AI-provided id (after the second underscore)
          const descPart = workoutId
            .split("_")
            .slice(2)
            .join(" ")
            .replace(/_/g, " ")
            .toLowerCase()
            .trim();

          matchingWorkout =
            candidates.find(
              (c) => (c.description || "").toLowerCase() === descPart,
            ) ||
            candidates.find((c) =>
              (c.description || "").toLowerCase().includes(descPart),
            ) ||
            candidates[0];
        }
      }

      // Fallback: token-match across descriptions
      if (!matchingWorkout) {
        const norm = workoutId.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
        const tokens = norm.split(/\s+/).filter(Boolean);

        let bestScore = 0;
        for (const w of allWorkouts) {
          const desc = (w.description || "").toLowerCase();
          let score = 0;
          for (const t of tokens) {
            if (t.length < 3) continue;
            if (desc.includes(t)) score++;
          }
          if (score > bestScore) {
            bestScore = score;
            matchingWorkout = w;
          }
        }
      }

      if (matchingWorkout) {
        actualWorkoutId = matchingWorkout.id;
        console.log(
          `Found matching workout: ${matchingWorkout.description} (ID: ${matchingWorkout.id})`,
        );
      } else {
        throw new Error(
          `Workout with ID ${workoutId} not found. Please check your training plan. Available workouts:\n` +
            allWorkouts
              .slice(0, 10)
              .map(
                (w) =>
                  `  - ${w.description} (${w.scheduledDate.toISOString().split("T")[0]})`,
              )
              .join("\n"),
        );
      }
    }
  } else {
    throw new Error(
      "No workout specified for rescheduling. Please specify which workout to move.",
    );
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
          `Invalid date format: ${newDate}. Please use a specific date (YYYY-MM-DD) or day of week.`,
        );
      }
    }
  }

  // If multiple workoutIds provided, perform batch shift by shiftDays
  const operations: any[] = [];

  if (Array.isArray(workoutIds) && typeof shiftDays === "number") {
    // Normalize shiftDays
    const sd = Math.round(shiftDays);
    for (const id of workoutIds) {
      const w = await prisma.trainingPlan.findFirst({ where: { id, userId } });
      if (!w) continue;
      const newDt = new Date(w.scheduledDate);
      newDt.setDate(newDt.getDate() + sd);

      // Find next free date if conflict exists
      let tries = 0;
      while (tries < 30) {
        const conflict = await prisma.trainingPlan.findFirst({
          where: {
            userId,
            scheduledDate: newDt,
            activityType: ActivityType.RUN,
          },
        });
        if (!conflict || conflict.id === w.id) break;
        newDt.setDate(newDt.getDate() + 1);
        tries++;
      }

      operations.push(
        prisma.trainingPlan.update({
          where: { id: w.id },
          data: {
            scheduledDate: newDt,
            aiReasoning: `AI batch-shift by ${sd} days: ${reason || "user request"}`,
          },
        }),
      );
    }

    if (operations.length > 0) await prisma.$transaction(operations);

    return { success: true, modified: operations.length };
  }

  // Validate new date doesn't conflict with existing workouts
  const existingWorkout = await prisma.trainingPlan.findFirst({
    where: {
      userId,
      scheduledDate: parsedDate,
      activityType: ActivityType.RUN,
    },
  });

  if (existingWorkout && existingWorkout.id !== actualWorkoutId) {
    if (resolveStrategy === "error") {
      throw new Error("There is already a run scheduled for this date");
    }

    // Default: shift conflicting run(s) forward to make room, preserving order
    if (resolveStrategy === "shift_conflict_forward") {
      // We'll move the conflicting workout and any subsequent conflicting runs forward by 1 day
      const toShift: any[] = [];
      let cursorDate = new Date(parsedDate);

      // Collect runs starting at parsedDate and onwards up to 30 days or until gap found
      for (let i = 0; i < 30; i++) {
        const found = await prisma.trainingPlan.findFirst({
          where: {
            userId,
            scheduledDate: cursorDate,
            activityType: ActivityType.RUN,
          },
        });
        if (found) {
          toShift.push(found);
          cursorDate.setDate(cursorDate.getDate() + 1);
        } else {
          break; // gap found
        }
      }

      // Build operations: shift each found run by +1 day, taking care of cascading conflicts
      for (const run of toShift) {
        let newDt = new Date(run.scheduledDate);
        newDt.setDate(newDt.getDate() + 1);

        // Avoid conflicts by pushing forward
        let tries = 0;
        while (tries < 30) {
          const conflict = await prisma.trainingPlan.findFirst({
            where: {
              userId,
              scheduledDate: newDt,
              activityType: ActivityType.RUN,
            },
          });
          if (!conflict) break;
          newDt.setDate(newDt.getDate() + 1);
          tries++;
        }

        operations.push(
          prisma.trainingPlan.update({
            where: { id: run.id },
            data: {
              scheduledDate: newDt,
              aiReasoning: `AI-resolved conflict: shifted due to reschedule of ${actualWorkoutId}`,
            },
          }),
        );
      }
    }
  }

  // Update the requested workout to parsedDate
  operations.push(
    prisma.trainingPlan.update({
      where: { id: actualWorkoutId, userId },
      data: {
        scheduledDate: parsedDate,
        aiReasoning: `Rescheduled: ${reason}${preserveIntensity ? " (intensity preserved)" : ""}`,
      },
    }),
  );

  if (operations.length > 0) await prisma.$transaction(operations);

  // Return list of modified workouts for confirmation
  const modified = await prisma.trainingPlan.findMany({
    where: { userId, aiReasoning: { contains: "Rescheduled:" } },
    orderBy: { scheduledDate: "asc" },
    take: 30,
  });

  return {
    success: true,
    modifiedCount: operations.length,
    modified,
  };
}

// Helper function to get next occurrence of a specific day
function getNextOccurrenceOfDay(dayOfWeek: string): Date {
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayIndex = daysOfWeek.indexOf(dayOfWeek.toLowerCase());

  if (dayIndex === -1) {
    throw new Error(`Invalid day: ${dayOfWeek}`);
  }

  const today = new Date();
  const currentDayIndex = today.getDay();
  let daysToAdd = dayIndex - currentDayIndex;

  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate;
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
  const {
    injuryType,
    affectedArea,
    severity,
    action,
    downtimeDays,
    recommendedPlan,
    recommendations,
  } = args;

  // Prefer AI-provided explicit plan when available (minimal determinism)
  // recommendedPlan: [{ planId, action: 'REST'|'CROSS_TRAIN'|'RESCHEDULE', newDate?, note? }]
  const operations: any[] = [];

  if (
    recommendedPlan &&
    Array.isArray(recommendedPlan) &&
    recommendedPlan.length > 0
  ) {
    for (const item of recommendedPlan) {
      if (item.planId) {
        // Map action to fields
        if (item.action === "RESCHEDULE" && item.newDate) {
          const parsed = new Date(item.newDate);
          operations.push(
            prisma.trainingPlan.update({
              where: { id: item.planId },
              data: {
                scheduledDate: parsed,
                aiReasoning: item.note || "AI reschedule",
              },
            }),
          );
        } else if (item.action === "REST") {
          operations.push(
            prisma.trainingPlan.update({
              where: { id: item.planId },
              data: {
                activityType: ActivityType.REST,
                targetDistanceKm: null,
                targetDurationMin: null,
                aiReasoning: item.note || "AI set to rest",
              },
            }),
          );
        } else if (item.action === "CROSS_TRAIN") {
          operations.push(
            prisma.trainingPlan.update({
              where: { id: item.planId },
              data: {
                activityType: ActivityType.CROSS_TRAIN,
                targetDurationMin: item.duration || 30,
                aiReasoning: item.note || "AI set to cross-train",
              },
            }),
          );
        }
      }
    }
  } else {
    // If no explicit plan, use AI-provided downtimeDays or recommendations if present
    let days = null;
    if (typeof downtimeDays === "number" && downtimeDays > 0)
      days = downtimeDays;
    else if (recommendations && recommendations.downtimeDays)
      days = recommendations.downtimeDays;

    // If AI did not provide explicit days, infer conservatively from severity (fallback only)
    if (days === null) {
      if (severity === "severe") days = 14;
      else if (severity === "moderate") days = 7;
      else days = 3; // mild or unknown
    }

    // Convert upcoming runs within downtime window to rest/cross-train based on recommended action
    const startDate = new Date();
    const downtimeEnd = new Date(startDate);
    downtimeEnd.setDate(startDate.getDate() + days - 1);

    const runsToAdjust = await prisma.trainingPlan.findMany({
      where: {
        userId,
        scheduledDate: { gte: startDate, lte: downtimeEnd },
        activityType: ActivityType.RUN,
      },
      orderBy: { scheduledDate: "asc" },
    });

    for (const run of runsToAdjust) {
      let newActivityType: ActivityType = ActivityType.REST;
      if (action === "cross_train" && severity !== "severe")
        newActivityType = ActivityType.CROSS_TRAIN;

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

    // Shift scheduled runs which fall within the downtime window forward by 'days'
    const runsToShift = await prisma.trainingPlan.findMany({
      where: {
        userId,
        scheduledDate: { gte: startDate, lte: downtimeEnd },
        activityType: ActivityType.RUN,
      },
      orderBy: { scheduledDate: "asc" },
    });

    for (const run of runsToShift) {
      let newDate = new Date(run.scheduledDate);
      newDate.setDate(newDate.getDate() + days);

      // Avoid conflicts
      let tries = 0;
      while (tries < 30) {
        const conflict = await prisma.trainingPlan.findFirst({
          where: {
            userId,
            scheduledDate: newDate,
            activityType: ActivityType.RUN,
          },
        });
        if (!conflict) break;
        newDate.setDate(newDate.getDate() + 1);
        tries++;
      }

      operations.push(
        prisma.trainingPlan.update({
          where: { id: run.id },
          data: {
            scheduledDate: newDate,
            aiReasoning: `Rescheduled due to reported injury (downtime ${days} days)`,
          },
        }),
      );
    }
  }

  if (operations.length > 0) await prisma.$transaction(operations);

  return {
    success: true,
    modifiedWorkouts: operations.length,
    injuryType,
    severity,
    action,
    appliedDays: downtimeDays ?? null,
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
