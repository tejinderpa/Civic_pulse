import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const supabase = createAdminClient();

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
      return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 });
    }

    const formattedTaskForces = (taskForces || []).map((tf: {
      id: string;
      name: string;
      status: string;
      created_at: string;
      issues?: Array<{ issue?: { title?: string; severity?: string; status?: string } | null }>;
    }) => {
      const linked = tf.issues || [];
      const resolved = linked.filter((i) => i.issue?.status === 'Resolved').length;
      const total = linked.length;
      const progress = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        id: tf.id,
        name: tf.name,
        status: tf.status,
        createdAt: tf.created_at,
        issueCount: total,
        progress,
        recentIssues: linked.slice(0, 3).map((i) => i.issue?.title).filter(Boolean),
        priority: linked.some((i) => i.issue?.severity === 'Critical') ? 'Critical' : 'High',
      };
    });

    return NextResponse.json(formattedTaskForces);
  } catch (err) {
    console.error('[Task Forces API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 });
  }
}
