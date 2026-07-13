import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/analytics-queries';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Short in-memory response cache (per server instance). */
const memCache = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 45_000;

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  const { searchParams } = new URL(request.url);
  const startDate =
    searchParams.get('startDate') ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();
  // Bucket by day range so cache keys stay stable
  const startDay = startDate.slice(0, 10);
  const endDay = endDate.slice(0, 10);
  const cacheKey = `${startDay}_${endDay}`;

  const hit = memCache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.body, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'X-Analytics-Cache': 'HIT',
      },
    });
  }

  try {
    const supabase = createAdminClient();
    const data = await getAnalyticsData(supabase, startDate, endDate);
    memCache.set(cacheKey, { at: Date.now(), body: data });
    // Cap map size
    if (memCache.size > 20) {
      const oldest = Array.from(memCache.entries()).sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) memCache.delete(oldest[0]);
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'X-Analytics-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL' }, { status: 500 });
  }
}
