import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Goal } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Destructuring the data
    const { 
      userId,
      name,
      nickname,
      age,
      weight,
      height, 
      goal,          // "TARGET_5K", "TARGET_10K", or "STAY_ACTIVE"
      experience, 
      daysAvailable, // e.g. ["MON", "WED", "SAT"]
      isInjured, 
      injuryHistory 
    } = body;

    // Validation to make sure
    if (!userId || !goal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Saving profile for:", name, "with goal:", goal); // for debugging

    // Saving to db
    // We use 'upsert' so if they submit twice, it just updates instead of crashing
    const profile = await prisma.profile.upsert({
      where: { id: userId },
      update: {
        displayName: name,
        nickName: nickname,
        experienceLevel: experience,
        goal: goal as Goal, // Force TS to trust this is a valid Enum value
        daysAvailable: daysAvailable, 
        injuryHistory: isInjured ? injuryHistory : null,
        
        age: age ? Number(age) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
      },
      create: {
        id: userId,
        displayName: name,
        nickName: nickname,
        experienceLevel: experience,
        goal: goal as Goal,
        daysAvailable: daysAvailable,
        injuryHistory: isInjured ? injuryHistory : null,

        age: age ? Number(age) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
      },
    });

    return NextResponse.json({ success: true, data: profile }, { status: 200 });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}