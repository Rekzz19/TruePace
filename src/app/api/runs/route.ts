import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weeksAhead = parseInt(searchParams.get("weeksAhead") || "1");
    const weeksBack = parseInt(searchParams.get("weeksBack") || "4");

    // Calculate date ranges
    const now = new Date();
    const currentWeekStart = new Date(now);
    const dayOfWeek = currentWeekStart.getDay();
    // Adjust to Monday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(now.getDate() - mondayOffset); // Start of current week (Monday)
    currentWeekStart.setHours(0, 0, 0, 0);

    const futureWeekEnd = new Date(currentWeekStart);
    futureWeekEnd.setDate(currentWeekStart.getDate() + (weeksAhead + 1) * 7); // End of future week

    const pastWeekStart = new Date(currentWeekStart);
    pastWeekStart.setDate(currentWeekStart.getDate() - weeksBack * 7); // Start of past weeks

    // Fetch training plans and run logs
    const trainingPlans = await prisma.trainingPlan.findMany({
      where: {
        userId: user.id,
        scheduledDate: {
          gte: pastWeekStart,
          lte: futureWeekEnd,
        },
      },
      include: {
        runLogs: {
          orderBy: { loggedAt: 'desc' }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // Group data by weeks
    const weeksData = [];
    
    for (let weekOffset = -weeksBack; weekOffset <= weeksAhead; weekOffset++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Get days for this week
      const weekDays = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + dayOffset);
        currentDay.setHours(0, 0, 0, 0);

        const nextDay = new Date(currentDay);
        nextDay.setDate(currentDay.getDate() + 1);

        // Find training plan for this day
        const plan = trainingPlans.find(p => {
          const planDate = new Date(p.scheduledDate);
          return planDate >= currentDay && planDate < nextDay;
        });

        weekDays.push({
          date: currentDay.toISOString(),
          dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: currentDay.getDate(),
          isToday: currentDay.toDateString() === now.toDateString(),
          trainingPlan: plan ? {
            id: plan.id,
            activityType: plan.activityType,
            targetDistanceKm: plan.targetDistanceKm,
            targetDurationMin: plan.targetDurationMin,
            targetRpe: plan.targetRpe,
            description: plan.description,
            status: plan.status,
            aiReasoning: plan.aiReasoning,
          } : null,
          runLog: plan?.runLogs[0] ? {
            id: plan.runLogs[0].id,
            actualDistanceKm: plan.runLogs[0].actualDistanceKm,
            actualDurationMin: plan.runLogs[0].actualDurationMin,
            actualRpe: plan.runLogs[0].actualRpe,
            painReported: plan.runLogs[0].painReported,
            notes: plan.runLogs[0].notes,
            loggedAt: plan.runLogs[0].loggedAt,
          } : null,
          status: plan?.status || 'SCHEDULED',
        });
      }

      weeksData.push({
        weekOffset,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel: weekOffset === 0 ? "Current Week" : 
                   weekOffset > 0 ? `Week +${weekOffset}` : 
                   `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Ago`,
        days: weekDays,
        summary: {
          totalPlannedRuns: weekDays.filter(d => d.trainingPlan?.activityType === 'RUN').length,
          completedRuns: weekDays.filter(d => d.runLog).length,
          totalDistance: weekDays.reduce((sum, d) => sum + (d.runLog?.actualDistanceKm || 0), 0),
          totalDuration: weekDays.reduce((sum, d) => sum + (d.runLog?.actualDurationMin || 0), 0),
        }
      });
    }

    return NextResponse.json({
      weeks: weeksData,
      currentWeekIndex: weeksBack, // Index of current week in the array
    });

  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
