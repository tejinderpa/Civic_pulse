import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const issueId = params.id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Try 'issues' table first, fallback to 'reports'
    let { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (error || !data) {
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', issueId)
        .single();
      
      if (reportError) throw reportError;
      data = reportData;
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Issue Detail Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to fetch issue details' }, { status: 500 });
  }
}
