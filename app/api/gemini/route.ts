import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // We use the fast flash model for instant responses
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
    
    // The Prompt that makes it act like a smart assistant
    const prompt = `You are a helpful IT/Facilities support AI. A user is submitting a ticket with this description: "${description}". 
    Provide exactly 2 or 3 quick, short, bullet-point troubleshooting steps they can try immediately to fix the issue themselves while waiting for tech support. Keep it brief, friendly, and practical.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ suggestion: responseText });
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}