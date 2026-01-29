import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GEMINI_API_KEY } from '@/lib/gemini';

type ChatRequestBody = {
  userId: string;
  message: string;
  conversationHistory?: Array<{role: string, content: string}>;
};

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: Request) {
    try {
        const body = (await req.json() as ChatRequestBody);

        if (!body.userId || !body.message) {
            return NextResponse.json(
                {error: "User ID and message are required"},
                {status: 400}
            );
        }

        // Fetch user profile for context
        const profile = await prisma.profile.findUnique({
            where: { id: body.userId }
        });

        // Create system prompt with user context
        const systemPrompt = `
        You are TruePace, an AI running coach assistant. 
        User profile:
        - Goal: ${profile?.goal}
        - Experience: ${profile?.experienceLevel}
        - Available days: ${profile?.daysAvailable?.join(', ')}
        - Injury considerations: ${profile?.injuryHistory || 'None'}
        
        Provide personalized running advice, answer questions about training, 
        and help adjust their running plan based on their feedback.
        Keep responses concise and actionable.
        `;

        // Start chat with system prompt
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "I'm your TruePace running coach. How can I help you today?" }] },
                ...(body.conversationHistory?.map(msg => ({
                  role: msg.role,
                  parts: [{ text: msg.content }]
                })) || [])
            ]
        });

        const result = await chat.sendMessage(body.message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });

    } catch (error) {
        console.log("Chat error", error);
        return NextResponse.json(
            { error: "Failed to generate response" }, 
            { status: 500 }
        );
    }
}