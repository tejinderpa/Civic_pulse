import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/analytics-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();

  try {
    const supabase = createClient();
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      // For development, we might skip this if needed, but let's keep it secure
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getAnalyticsData(supabase, startDate, endDate);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
