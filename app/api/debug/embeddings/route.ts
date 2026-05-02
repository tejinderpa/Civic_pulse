import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ai/gemini';
import { cosineSimilarity, calculateKeywordOverlap } from '@/lib/ai/similarity';

export async function POST(req: NextRequest) {
  const { text1, text2, category1, category2 } = await req.json();

  if (!text1 || !text2) {
    return NextResponse.json({ error: 'Missing text inputs' }, { status: 400 });
  }

  try {
    const emb1 = await generateEmbedding(`${category1 || 'unknown'} issue: ${text1}`);
    const emb2 = await generateEmbedding(`${category2 || 'unknown'} issue: ${text2}`);

    const semanticSimilarity = cosineSimilarity(emb1, emb2);
    
    const categoryMatch = (category1 === category2 && category1 !== undefined) ? 1 : 0;
    const keywordOverlap = calculateKeywordOverlap(text1, text2);
    
    const finalScore = (semanticSimilarity * 0.6) + (categoryMatch * 0.3) + (keywordOverlap * 0.1);

    let status = 'none';
    if (finalScore > 0.75) status = 'duplicate';
    else if (finalScore >= 0.60) status = 'suggest';

    return NextResponse.json({
      text1,
      text2,
      category1,
      category2,
      breakdown: {
        semanticSimilarity: Number(semanticSimilarity.toFixed(3)),
        categoryMatch,
        keywordOverlap: Number(keywordOverlap.toFixed(3)),
      },
      finalScore: Number(finalScore.toFixed(3)),
      status,
      length1: emb1.length,
      length2: emb2.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
  }
}
