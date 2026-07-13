import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { REPORT_LIST_SELECT, normalizeReportRow } from '@/lib/reports/columns';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const supabase = createAdminClient();
    const id = params.id;

    const { data: tf, error } = await supabase
      .from('task_forces')
      .select('id, name, status, created_at, created_by, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !tf) {
      return NextResponse.json({ error: 'Task force not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Prefer junction table; also include reports with task_force_id set
    const { data: links } = await supabase
      .from('task_force_issues')
      .select('issue_id')
      .eq('task_force_id', id);

    const linkedIds = (links || []).map((l) => l.issue_id).filter(Boolean);

    let issuesQuery = supabase.from('reports').select(REPORT_LIST_SELECT);
    if (linkedIds.length > 0) {
      issuesQuery = issuesQuery.or(`task_force_id.eq.${id},id.in.(${linkedIds.join(',')})`);
    } else {
      issuesQuery = issuesQuery.eq('task_force_id', id);
    }

    const { data: rawIssues, error: issuesErr } = await issuesQuery.order('created_at', {
      ascending: false,
    });

    if (issuesErr) {
      console.error('[TF detail] issues:', issuesErr);
    }

    const issues = (rawIssues || []).map((row) =>
      normalizeReportRow(row as Record<string, unknown>)
    );

    const total = issues.length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const underReview = issues.filter((i) => i.status === 'Under Review').length;
    const submitted = issues.filter((i) => i.status === 'Submitted').length;
    const progress = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Recent history across assigned issues
    let recentActivity: Array<Record<string, unknown>> = [];
    if (issues.length > 0) {
      const ids = issues.map((i) => String(i.id));
      const { data: hist } = await supabase
        .from('issue_history')
        .select('id, issue_id, action_type, old_value, new_value, user_name, created_at')
        .in('issue_id', ids)
        .order('created_at', { ascending: false })
        .limit(20);
      recentActivity = hist || [];
    }

    return NextResponse.json({
      id: tf.id,
      name: tf.name,
      status: tf.status,
      createdAt: tf.created_at,
      issueCount: total,
      progress,
      stats: { total, resolved, inProgress, underReview, submitted },
      issues,
      recentActivity,
    });
  } catch (err) {
    console.error('[TF detail] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 });
  }
}
