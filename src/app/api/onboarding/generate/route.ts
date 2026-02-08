import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Opik } from "opik";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Use standard Flash model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const opik = new Opik();

export async function POST(req: Request) {
  const trace = opik.trace({ name: "onboarding_generation" });

  try {
    const { userId } = await req.json();

    // 1. Fetch User Logic
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Construct the "Coach" Prompt
    // We explicitly ask for relative days (Day 1, Day 2) so we can map dates easily
    const prompt = `
      You are an elite running coach. Create a 14-day training plan (2 weeks) for this runner.
      
      RUNNER PROFILE:
      - Goal: ${profile.goal}
      - Level: ${profile.experienceLevel}
      - Available Days: ${profile.daysAvailable?.join(", ") || "All"}
      - Injury History: ${profile.injuryHistory || "None"}

      OUTPUT REQUIREMENTS:
      Return a JSON array of 14 objects. Each object must follow this schema:
      {
        "dayOffset": number (0 for today, 1 for tomorrow, etc.),
        "activityType": "RUN" | "REST" | "CROSS_TRAIN",
        "distance": number (in km, 0 if rest),
        "duration": number (in minutes, 0 if rest),
        "description": string (short title e.g. "Easy Run"),
        "reasoning": string (why this run today?)
      }
    `;

    const span = trace.span({
      name: "gemini-2.5-flash-onboarding",
      type: "llm",
      input: { prompt },
    });

    // 3. Call Gemini with JSON Enforcement
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    span.update({
      output: { text: responseText },
    });
    span.end();

    // 4. Parse the AI Response
    const planData = JSON.parse(responseText);

    // 5. Calculate real dates and Save to Database
    const today = new Date();

    // Create an array of Prisma operations
    const dbOperations = planData.map((day: any) => {
      // Calculate the specific calendar date
      const runDate = new Date(today);
      runDate.setDate(today.getDate() + day.dayOffset);

      return prisma.trainingPlan.create({
        data: {
          userId: userId,
          scheduledDate: runDate,
          activityType: day.activityType,
          targetDistanceKm: day.distance,
          targetDurationMin: day.duration,
          description: day.description,
          aiReasoning: day.reasoning,
          status: "SCHEDULED",
        },
      });
    });

    // Run all database inserts in a transaction (All or Nothing)
    await prisma.$transaction(dbOperations);

    trace.end();
    await opik.flush();

    return NextResponse.json({ success: true, count: dbOperations.length });
  } catch (error) {
    trace.update({
      tags: ["error"],
      metadata: { error_details: JSON.stringify(error) },
    });
    trace.end();
    await opik.flush();
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 },
    );
  }
}
