import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GEMINI_API_KEY } from '@/lib/gemini';

const apiKey = GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

type GeminiRequestBody = {
  prompt: string;
  userId: string;
};

type GeminiResponseBody = {
  text: string;
};

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        const body = (await req.json() as GeminiRequestBody);

        if (!body.prompt) {
            return NextResponse.json(
                {error: "Prompt is required"},
                {status: 400}
            );
        }
        // Fetch user profile from database
        const profile = await prisma.profile.findUnique({
            where: { id: body.userId }
        });
        if (!profile) {
            return NextResponse.json(
                {error: "User profile not found"},
                {status: 404}
            );
        }

        // Create personalized prompt based on user data
        const personalizedPrompt = `
        Create a running routine for this week based on this user profile:
        - Name: ${profile.displayName}
        - Goal: ${profile.goal}
        - Experience Level: ${profile.experienceLevel}
        - Available Days: ${profile.daysAvailable?.join(', ')}
        - Age: ${profile.age}
        - Weight: ${profile.weight}kg
        - Height: ${profile.height}cm
        - Injury History: ${profile.injuryHistory || 'None'}
        
        ${body.prompt || 'Generate a comprehensive running plan for the week.'}
        
        Please structure the response as JSON with daily plans including:
        - day of week
        - type of run (easy, tempo, long run, etc.)
        - distance in km
        - pace guidance
        - any notes about injury considerations
        `;
        const model = genAI.getGenerativeModel({ 
            model : "gemini-2.5-flash",
        });
        
        const result  = await model.generateContent(body.prompt);

        const text = result.response.text(); //gets response -

        const response : GeminiResponseBody =  { text }; 
        
        return NextResponse.json({response});
    } catch (error){
        console.log("Gemini error", error);

        return NextResponse.json(
            { error: "Failed to generate content" }, 
            { status: 500 }
        );
    }

}
