import { prisma } from "@/lib/prisma";
import { executeToolCall } from "@/lib/ai-execution";

export async function isLastWeekOfPlan(userId: string): Promise<boolean> {
  // Get user's training plans
  const trainingPlans = await prisma.trainingPlan.findMany({
    where: { userId },
    orderBy: { scheduledDate: "desc" },
    take: 14, // Check last 2 weeks
  });

  if (trainingPlans.length === 0) return false;

  // Get the latest plan date
  const latestPlan = trainingPlans[0];
  const today = new Date();
  const daysUntilEnd = Math.ceil(
    (latestPlan.scheduledDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  // Consider it "last week" if we're within 7 days of the last planned workout
  return daysUntilEnd <= 7;
}

export async function triggerNextWeekGeneration(userId: string): Promise<void> {
  try {
    // Get comprehensive performance analysis
    const performanceAnalysis = await analyzeUserPerformance(userId);

    // Use AI to generate next week with holistic data
    const { generateText } = await import("ai");
    const { google } = await import("@ai-sdk/google");

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      console.error("User profile not found for next week generation");
      return;
    }

    const systemPrompt = `
You are TruePace AI coach. Generate next 2 weeks of training based on comprehensive performance analysis.

USER PROFILE:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Available days: ${profile.daysAvailable?.join(", ") || "All"}

PERFORMANCE ANALYSIS:
${JSON.stringify(performanceAnalysis, null, 2)}

Generate a JSON array of 14 objects (next 2 weeks) with this schema:
{
  "dayOffset": number (0 for day after last plan, 1 for tomorrow, etc.),
  "activityType": "RUN" | "REST" | "CROSS_TRAIN",
  "distance": number (in km, 0 if rest),
  "duration": number (in minutes, 0 if rest),
  "description": string (workout description),
  "reasoning": string (why this workout based on performance data)
}

Consider:
- Completion rate trends
- Average RPE and effort patterns
- Injury reports
- Progress toward goal
- Recovery needs
Be progressive but realistic.
    `;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            "Generate next 2 weeks of training based on the performance analysis provided.",
        },
      ],
      maxRetries: 0,
    });

    const planData = JSON.parse(result.text);

    // Calculate start date (day after last workout)
    const lastWorkout = await prisma.trainingPlan.findFirst({
      where: { userId },
      orderBy: { scheduledDate: "desc" },
    });

    if (!lastWorkout) {
      console.error("No existing workouts found for next week generation");
      return;
    }

    const startDate = new Date(lastWorkout.scheduledDate);
    startDate.setDate(startDate.getDate() + 1);

    // Create database operations
    const dbOperations = planData.map((day: any) => {
      const workoutDate = new Date(startDate);
      workoutDate.setDate(startDate.getDate() + day.dayOffset);

      return prisma.trainingPlan.create({
        data: {
          userId,
          scheduledDate: workoutDate,
          activityType: day.activityType,
          targetDistanceKm: day.distance || null,
          targetDurationMin: day.duration || null,
          description: day.description,
          aiReasoning: `Auto-generated: ${day.reasoning}`,
          status: "SCHEDULED",
        },
      });
    });

    // Execute all operations
    if (dbOperations.length > 0) {
      await prisma.$transaction(dbOperations);
      console.log(`Generated ${dbOperations.length} workouts for next 2 weeks`);
    }
  } catch (error) {
    console.error("Error in auto next week generation:", error);
  }
}

export async function analyzeUserPerformance(userId: string) {
  // Get last 8 weeks of data for holistic analysis
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const trainingPlans = await prisma.trainingPlan.findMany({
    where: {
      userId,
      scheduledDate: { gte: eightWeeksAgo },
    },
    include: {
      runLogs: true,
    },
    orderBy: { scheduledDate: "asc" },
  });

  // Calculate comprehensive metrics
  const totalRuns = trainingPlans.filter(
    (p) => p.activityType === "RUN",
  ).length;
  const completedRuns = trainingPlans.filter(
    (p) => p.activityType === "RUN" && p.runLogs.length > 0,
  ).length;

  const completionRate = totalRuns > 0 ? completedRuns / totalRuns : 0;

  // Calculate average RPE from completed runs
  const completedRunLogs = trainingPlans
    .filter((p) => p.runLogs.length > 0)
    .flatMap((p) => p.runLogs);

  const averageRpe =
    completedRunLogs.length > 0
      ? completedRunLogs.reduce((sum, log) => sum + (log.actualRpe || 0), 0) /
        completedRunLogs.length
      : 0;

  // Injury analysis
  const injuryReports = completedRunLogs.filter(
    (log) => log.painReported,
  ).length;
  const injuryRate =
    completedRunLogs.length > 0 ? injuryReports / completedRunLogs.length : 0;

  // Distance progression
  const weeklyDistances: number[] = [];
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekDistance = trainingPlans
      .filter((p) => {
        const planDate = new Date(p.scheduledDate);
        return (
          planDate >= weekStart &&
          planDate <= weekEnd &&
          p.activityType === "RUN" &&
          p.runLogs.length > 0
        );
      })
      .reduce((sum, p) => sum + (p.runLogs[0]?.actualDistanceKm || 0), 0);

    weeklyDistances.unshift(weekDistance);
  }

  // Trend analysis
  const recentWeeks = weeklyDistances.slice(0, 4);
  const olderWeeks = weeklyDistances.slice(4, 8);
  const recentAvg = recentWeeks.reduce((a, b) => a + b, 0) / recentWeeks.length;
  const olderAvg =
    olderWeeks.length > 0
      ? olderWeeks.reduce((a, b) => a + b, 0) / olderWeeks.length
      : recentAvg;
  const distanceTrend = recentAvg - olderAvg;

  // Consistency analysis (standard deviation of weekly distances)
  const meanDistance =
    weeklyDistances.reduce((a, b) => a + b, 0) / weeklyDistances.length;
  const variance =
    weeklyDistances.reduce((sum, d) => sum + Math.pow(d - meanDistance, 2), 0) /
    weeklyDistances.length;
  const consistency = Math.sqrt(variance);

  return {
    completionRate,
    averageRpe,
    injuryReports,
    injuryRate,
    weeklyDistances,
    distanceTrend,
    consistency,
    recentAvg,
    totalRuns,
    completedRuns,
    analysisPeriod: "8 weeks",
    dataQuality:
      trainingPlans.length >= 20
        ? "good"
        : trainingPlans.length >= 10
          ? "fair"
          : "limited",
  };
}

export async function triggerInjuryResponse(
  userId: string,
  injuryDetails: any,
): Promise<void> {
  try {
    // Use AI to determine appropriate injury response
    const { generateText } = await import("ai");
    const { google } = await import("@ai-sdk/google");

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      console.error("User profile not found for injury response");
      return;
    }

    const systemPrompt = `
You are TruePace AI coach analyzing a reported injury/pain from run logging.

USER PROFILE:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Injury History: ${profile.injuryHistory || "None"}

INJURY DETAILS:
${JSON.stringify(injuryDetails, null, 2)}

Analyze this injury/pain report and determine appropriate response. Return JSON with:
{
  "injuryType": "acute_pain" | "chronic_discomfort" | "fatigue" | "overtraining",
  "affectedArea": string,
  "severity": "mild" | "moderate" | "severe",
  "action": "rest_only" | "cross_train" | "medical_attention" | "reduce_intensity",
  "reasoning": string (why this response is appropriate)
}

Be conservative and prioritize safety.
    `;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            "Analyze this injury report and recommend appropriate training adjustments.",
        },
      ],
      maxRetries: 0,
    });

    const injuryAnalysis = JSON.parse(result.text);

    // Execute the injury response using existing tool
    await executeToolCall(
      {
        toolName: "handleInjuryResponse",
        input: injuryAnalysis,
      },
      userId,
    );

    console.log("Auto-triggered injury response:", injuryAnalysis);
  } catch (error) {
    console.error("Error in auto injury response:", error);
  }
}

export async function analyzeInjuryReport(userId: string, injuryDetails: any) {
  try {
    const { generateText } = await import("ai");
    const { google } = await import("@ai-sdk/google");

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new Error("User profile not found for injury analysis");
    }

    const systemPrompt = `
You are TruePace AI coach analyzing a reported injury/pain from run logging.

USER PROFILE:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Injury History: ${profile.injuryHistory || "None"}

INJURY DETAILS:
${JSON.stringify(injuryDetails, null, 2)}

Analyze this injury/pain report and determine appropriate response. Return JSON with:
{
  "injuryType": "acute_pain" | "chronic_discomfort" | "fatigue" | "overtraining",
  "affectedArea": string,
  "severity": "mild" | "moderate" | "severe",
  "action": "rest_only" | "cross_train" | "medical_attention" | "reduce_intensity",
  "reasoning": string (why this response is appropriate)
}

Be conservative and prioritize safety.
    `;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            "Analyze this injury report and recommend appropriate training adjustments.",
        },
      ],
      maxRetries: 0,
    });

    // Model outputs can be wrapped in markdown code fences or extra text.
    const raw = result.text;
    // Try to extract a JSON code block first (```json ... ```)
    const codeFenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    let parsed: any = null;

    try {
      if (codeFenceMatch && codeFenceMatch[1]) {
        parsed = JSON.parse(codeFenceMatch[1].trim());
      } else {
        // Fallback: find the first JSON object-like substring
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonSub = raw.substring(firstBrace, lastBrace + 1);
          parsed = JSON.parse(jsonSub);
        } else {
          // As last resort, try direct parse (may throw)
          parsed = JSON.parse(raw);
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse model JSON output:", parseErr);
      console.error("Model raw output:", raw);
      throw new Error("AI returned invalid JSON for injury analysis");
    }

    return parsed;
  } catch (error) {
    console.error("Error in injury analysis:", error);
    throw error;
  }
}
