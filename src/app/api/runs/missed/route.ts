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
    const { runId, reason = "User marked as missed" } = body;

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

    // Create a missed run log
    const runLog = await prisma.runLog.create({
      data: {
        userId: user.id,
        planId: runId,
        actualDistanceKm: 0,
        actualDurationMin: 0,
        actualRpe: null,
        notes: reason,
        painReported: false,
        loggedAt: new Date()
      }
    });

    // Update training plan status to skipped
    await prisma.trainingPlan.update({
      where: { id: runId },
      data: { 
        status: "SKIPPED",
        aiReasoning: `Marked as missed: ${reason}`
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
    console.error("Error marking run as missed:", error);
    return NextResponse.json(
      { error: "Failed to mark run as missed" },
      { status: 500 }
    );
  }
}
