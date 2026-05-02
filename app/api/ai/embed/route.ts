import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const embedding = await generateEmbedding(text);
    return NextResponse.json({ embedding });

  } catch (err: any) {
    console.error('Embedding API Error:', err);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
