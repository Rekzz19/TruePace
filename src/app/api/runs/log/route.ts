import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { runId, actualDistance, actualDuration, effortRating, feedbackNotes, painReported = false } = body;

    if (!runId) {
      return NextResponse.json({ error: "Run ID is required" }, { status: 400 });
    }

    // Verify the training plan belongs to the user
    const trainingPlan = await prisma.trainingPlan.findFirst({
      where: { 
        id: runId,
        userId: user.id 
      }
    });

    if (!trainingPlan) {
      return NextResponse.json({ error: "Training plan not found" }, { status: 404 });
    }

    // Create or update run log
    let runLog;
    const existingLog = await prisma.runLog.findFirst({
      where: { planId: runId }
    });

    if (existingLog) {
      // Update existing log
      runLog = await prisma.runLog.update({
        where: { id: existingLog.id },
        data: {
          actualDistanceKm: actualDistance,
          actualDurationMin: actualDuration,
          actualRpe: effortRating,
          notes: feedbackNotes,
          painReported: painReported,
          loggedAt: new Date()
        }
      });
    } else {
      // Create new log
      runLog = await prisma.runLog.create({
        data: {
          userId: user.id,
          planId: runId,
          actualDistanceKm: actualDistance,
          actualDurationMin: actualDuration,
          actualRpe: effortRating,
          notes: feedbackNotes,
          painReported: painReported,
          loggedAt: new Date()
        }
      });
    }

    // Update training plan status to completed
    await prisma.trainingPlan.update({
      where: { id: runId },
      data: { 
        status: "COMPLETED"
      }
    });

    return NextResponse.json({ 
      success: true, 
      runLog: {
        id: runLog.id,
        actualDistanceKm: runLog.actualDistanceKm,
        actualDurationMin: runLog.actualDurationMin,
        actualRpe: runLog.actualRpe,
        painReported: runLog.painReported,
        notes: runLog.notes,
        loggedAt: runLog.loggedAt
      }
    });

  } catch (error) {
    console.error("Error logging run:", error);
    return NextResponse.json(
      { error: "Failed to log run" },
      { status: 500 }
    );
  }
}
