export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { suggestAssignment } from '@/lib/ai/suggest-assignment';
import { REPORT_DETAIL_SELECT, normalizeReportRow } from '@/lib/reports/columns';

/**
 * Admin-only: AI suggestion for severity/department/TF — authority only approves.
 * Body: { issueId: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const issueId = typeof body.issueId === 'string' ? body.issueId : '';

    if (!issueId) {
      return NextResponse.json(
        { error: 'issueId is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: raw, error } = await supabase
      .from('reports')
      .select(REPORT_DETAIL_SELECT)
      .eq('id', issueId)
      .maybeSingle();

    if (error || !raw) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const report = normalizeReportRow(raw as Record<string, unknown>);

    const { data: taskForces, error: tfErr } = await supabase
      .from('task_forces')
      .select(
        `
        id,
        name,
        status,
        issues:task_force_issues(
          issue:reports(id, status)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (tfErr) {
      console.warn('[suggest-assignment] TF load:', tfErr.message);
    }

    const candidates = (taskForces || []).map((tf: Record<string, unknown>) => {
      const rawIssues = (tf.issues as Array<{ issue?: unknown }> | null) || [];
      const statuses: string[] = [];
      for (const row of rawIssues) {
        const issue = row?.issue;
        if (Array.isArray(issue)) {
          for (const nested of issue) {
            if (nested && typeof nested === 'object' && 'status' in nested) {
              statuses.push(String((nested as { status?: string }).status || ''));
            }
          }
        } else if (issue && typeof issue === 'object' && 'status' in issue) {
          statuses.push(String((issue as { status?: string }).status || ''));
        }
      }
      const total = statuses.length || rawIssues.length;
      const resolved = statuses.filter((s) => s === 'Resolved').length;
      return {
        id: String(tf.id),
        name: String(tf.name || ''),
        status: String(tf.status || 'active'),
        issueCount: total,
        progress: total > 0 ? Math.round((resolved / total) * 100) : 0,
      };
    });

    const suggestion = await suggestAssignment({
      title: report.title as string,
      description: report.description as string,
      category: report.category as string,
      severity: report.severity as string,
      location: report.location as string,
      department: report.department as string | null,
      current_status: report.status as string,
      taskForces: candidates,
    });

    return NextResponse.json({
      issueId,
      ...suggestion,
      task_forces: candidates.filter((t) => t.status === 'active'),
    });
  } catch (err) {
    console.error('[suggest-assignment]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
