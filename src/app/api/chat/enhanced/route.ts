import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { triggerNextWeekGeneration, isLastWeekOfPlan } from "@/lib/ai-automation";

export async function POST(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Check for plan completion and auto-generate if needed
    const shouldGenerate = await isLastWeekOfPlan(user.id);
    if (shouldGenerate) {
      console.log("Auto-triggering next week generation from chat");
      await triggerNextWeekGeneration(user.id);
    }

    // Forward to AI agent for processing
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        userId: user.id,
      }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in enhanced chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
