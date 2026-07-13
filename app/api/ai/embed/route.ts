import { NextRequest, NextResponse } from 'next/server';
import { EMBEDDING_DIMENSIONS, generateEmbedding } from '@/lib/ai/gemini';
import { requireUser, isAuthFailure } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.length === 0) {
      return NextResponse.json({ error: 'Text is required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    if (text.length > 8000) {
      return NextResponse.json({ error: 'Text too long', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const embedding = await generateEmbedding(text);

    if (!embedding.length || embedding.length !== EMBEDDING_DIMENSIONS) {
      console.error('Embedding length mismatch after fit:', embedding.length);
      return NextResponse.json({ error: 'Failed to generate embedding', code: 'INTERNAL' }, { status: 500 });
    }

    return NextResponse.json({ embedding, dimensions: EMBEDDING_DIMENSIONS });
  } catch (err) {
    console.error('Embedding API Error:', err);
    return NextResponse.json({ error: 'Failed to generate embedding', code: 'INTERNAL' }, { status: 500 });
  }
}
