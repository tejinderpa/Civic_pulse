import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch task forces with their related issues count
    const { data: taskForces, error } = await supabase
      .from('task_forces')
      .select(`
        *,
        issues:task_force_issues(
          issue:reports(
            id,
            title,
            severity,
            status
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Task Forces API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data for UI
    const formattedTaskForces = taskForces.map((tf: any) => ({
      id: tf.id,
      name: tf.name,
      status: tf.status,
      createdAt: tf.created_at,
      issueCount: tf.issues?.length || 0,
      recentIssues: tf.issues?.slice(0, 3).map((i: any) => i.issue.title) || [],
      priority: tf.issues?.some((i: any) => i.issue.severity === 'Critical') ? 'Critical' : 'High'
    }));

    return NextResponse.json(formattedTaskForces);
  } catch (err: any) {
    console.error('[Task Forces API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
