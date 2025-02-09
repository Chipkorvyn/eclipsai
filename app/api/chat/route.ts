import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant answering only about Switzerland's mandatory health insurance. 
You must answer in short and concise statements. 
Refuse any question not about Swiss mandatory insurance. Answer concisely, max 100 words.`;

export async function POST(req: NextRequest) {
  try {
    const { userQuestion } = await req.json();

    if (!userQuestion || typeof userQuestion !== 'string') {
      return NextResponse.json(
        { answer: 'Please ask a valid Swiss health insurance question.' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuestion }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content || '';
    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/chat route:', error);
    return NextResponse.json({ answer: 'Error occurred. Please try again later.' }, { status: 500 });
  }
}
