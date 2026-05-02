import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { generateEmbedding } from '@/lib/ai/gemini';
import { cosineSimilarity, calculateKeywordOverlap } from '@/lib/ai/similarity';

export async function POST(req: NextRequest) {
  try {
    const { description, lat, lng, category } = await req.json();

    // Validate inputs
    if (!description || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // PHASE 1: Geo-filter (reduce dataset)
    const { data: candidates, error } = await supabase.rpc('find_nearby_reports', {
      target_lat: lat,
      target_lng: lng,
      target_category: null, // Removed strict DB category filter so we can soft-penalize later
      radius_meters: 500
    });

    if (error) {
      console.error('Geo-filter error:', error);
      // If the RPC fails (e.g. pgvector not set up yet), return no duplicates
      return NextResponse.json({ isDuplicate: false, matches: [] });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ isDuplicate: false, matches: [] });
    }

    // PHASE 2: Multi-Factor Semantic similarity
    try {
      const inputEmbedding = await generateEmbedding(`${category || 'unknown'} issue: ${description}`);
      
      const matches = candidates
        .map((report: any) => {
          let semanticSimilarity = 0;
          if (report.embedding) {
            try {
              let parsedEmbedding = typeof report.embedding === 'string' 
                ? JSON.parse(report.embedding) 
                : report.embedding;
              semanticSimilarity = cosineSimilarity(inputEmbedding, parsedEmbedding);
            } catch (e) {
              console.error('Error parsing embedding:', e);
            }
          }

          const categoryMatch = (report.category === category) ? 1 : 0;
          const keywordOverlap = calculateKeywordOverlap(description, report.description || report.title || '');
          
          const finalScore = (semanticSimilarity * 0.6) + (categoryMatch * 0.3) + (keywordOverlap * 0.1);

          return {
            ...report,
            similarity: finalScore,
            semanticSimilarity,
            keywordOverlap
          };
        })
        .filter((m: any) => m.similarity >= 0.60) // Threshold for "suggest"
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 3); // Top 3

      let detectionStatus = 'none';
      if (matches.some((m: any) => m.similarity > 0.75)) {
        detectionStatus = 'duplicate';
      } else if (matches.some((m: any) => m.similarity >= 0.60)) {
        detectionStatus = 'suggest';
      }

      return NextResponse.json({
        status: detectionStatus,
        isDuplicate: detectionStatus === 'duplicate',
        matches: matches.map((m: any) => ({
          id: m.id,
          title: m.title,
          location: m.location,
          similarity: Math.round(m.similarity * 100),
          distance: Math.round(m.distance)
        }))
      });
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      // Fallback: return geo matches without similarity
      return NextResponse.json({
        isDuplicate: false,
        matches: candidates.slice(0, 3).map((c: any) => ({
          id: c.id,
          title: c.title,
          location: c.location,
          similarity: null,
          distance: Math.round(c.distance)
        }))
      });
    }
  } catch (err: any) {
    console.error('Duplicates API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
