import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { executeToolCall } from "@/lib/ai-execution";

export async function POST(req: NextRequest) {
  try {
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
    const { notificationId, downtimeDays } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId required" },
        { status: 400 },
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== user.id) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    // Only handle injury notifications for now
    const payload = notification.payload;

    // Ensure payload is an object before spreading — Prisma Json can be non-object
    const normalizedPayload =
      typeof payload === "object" && payload !== null ? payload : {};

    // Merge downtimeDays into payload for the tool
    const toolInput = {
      ...normalizedPayload,
      downtimeDays: typeof downtimeDays === "number" ? downtimeDays : null,
    };

    try {
      const result = await executeToolCall(
        { toolName: "handleInjuryResponse", input: toolInput },
        user.id,
      );

      // Record the response on the original notification
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          responded: true,
          read: true,
          response: result as any,
        },
      });

      // Create a confirmation notification summarizing what was applied
      const summaryText = (() => {
        try {
          const r: any = result;
          return (
            r?.summary ??
            r?.message ??
            r?.description ??
            r?.appliedDays ??
            (typeof result === "string"
              ? result
              : JSON.stringify(result || {}).slice(0, 400))
          );
        } catch {
          return typeof result === "string"
            ? result
            : JSON.stringify(result || {}).slice(0, 400);
        }
      })();

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Schedule updated",
          body: `The AI applied an injury response to your schedule: ${summaryText}`,
          type: "confirmation",
          payload: result as any,
          // Confirmation notifications are informational; mark them read so they
          // don't re-trigger urgent UI states that require user action.
          read: true,
          responded: true,
        },
      });

      return NextResponse.json({ success: true, result });
    } catch (err) {
      console.error("Error executing injury response tool:", err);
      return NextResponse.json(
        { error: "Failed to apply response" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in notification respond:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
