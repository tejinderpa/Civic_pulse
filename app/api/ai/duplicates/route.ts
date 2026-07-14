export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/gemini';
import { cosineSimilarity, calculateKeywordOverlap } from '@/lib/ai/similarity';
import { requireUser, isAuthFailure } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  try {
    const { description, lat, lng, category } = await req.json();

    if (!description || lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing required fields', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: candidates, error } = await supabase.rpc('find_nearby_reports', {
      target_lat: lat,
      target_lng: lng,
      target_category: null,
      radius_meters: 500,
    });

    if (error) {
      console.error('Geo-filter error:', error);
      return NextResponse.json({ status: 'none', isDuplicate: false, matches: [] });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ status: 'none', isDuplicate: false, matches: [] });
    }

    try {
      const inputEmbedding = await generateEmbedding(`${category || 'unknown'} issue: ${description}`);

      const matches = candidates
        .map((report: {
          id: string;
          title?: string;
          description?: string;
          location?: string;
          category?: string;
          embedding?: string | number[];
          distance?: number;
        }) => {
          let semanticSimilarity = 0;
          if (report.embedding) {
            try {
              const parsedEmbedding =
                typeof report.embedding === 'string' ? JSON.parse(report.embedding) : report.embedding;
              semanticSimilarity = cosineSimilarity(inputEmbedding, parsedEmbedding);
            } catch (e) {
              console.error('Error parsing embedding:', e);
            }
          }

          const categoryMatch = report.category === category ? 1 : 0;
          const keywordOverlap = calculateKeywordOverlap(
            description,
            report.description || report.title || ''
          );

          const finalScore = semanticSimilarity * 0.6 + categoryMatch * 0.3 + keywordOverlap * 0.1;

          return {
            ...report,
            similarity: finalScore,
            semanticSimilarity,
            keywordOverlap,
          };
        })
        .filter((m: { similarity: number }) => m.similarity >= 0.6)
        .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
        .slice(0, 3);

      let detectionStatus: 'none' | 'suggest' | 'duplicate' = 'none';
      if (matches.some((m: { similarity: number }) => m.similarity > 0.75)) {
        detectionStatus = 'duplicate';
      } else if (matches.some((m: { similarity: number }) => m.similarity >= 0.6)) {
        detectionStatus = 'suggest';
      }

      return NextResponse.json({
        status: detectionStatus,
        isDuplicate: detectionStatus === 'duplicate',
        matches: matches.map((m: {
          id: string;
          title?: string;
          location?: string;
          similarity: number;
          distance?: number;
        }) => ({
          id: m.id,
          title: m.title,
          location: m.location,
          similarity: Math.round(m.similarity * 100),
          distance: Math.round(m.distance || 0),
        })),
      });
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      return NextResponse.json({
        status: 'suggest',
        isDuplicate: false,
        matches: candidates.slice(0, 3).map((c: {
          id: string;
          title?: string;
          location?: string;
          distance?: number;
        }) => ({
          id: c.id,
          title: c.title,
          location: c.location,
          similarity: null,
          distance: Math.round(c.distance || 0),
        })),
      });
    }
  } catch (err) {
    console.error('Duplicates API Error:', err);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 });
  }
}
