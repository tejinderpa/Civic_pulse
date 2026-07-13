import { NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { REPORT_LIST_SELECT, normalizeReportRow } from '@/lib/reports/columns';
import {
  buildAdminNotifications,
  type ReportForNotif,
} from '@/lib/admin/notifications';

export const dynamic = 'force-dynamic';

/**
 * Admin operations inbox.
 * Built from live reports (notifications table is optional / may not exist).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const supabase = createAdminClient();

    const { data: reports, error } = await supabase
      .from('reports')
      .select(REPORT_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[admin notifications]', error);
      return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 });
    }

    const rows = (reports || []).map((r) =>
      normalizeReportRow(r as Record<string, unknown>)
    ) as unknown as ReportForNotif[];

    // Task force names
    const tfIds = [
      ...new Set(rows.map((r) => r.task_force_id).filter(Boolean) as string[]),
    ];
    const taskForceNames: Record<string, string> = {};
    if (tfIds.length > 0) {
      const { data: tfs } = await supabase
        .from('task_forces')
        .select('id, name')
        .in('id', tfIds);
      (tfs || []).forEach((t: { id: string; name: string }) => {
        taskForceNames[t.id] = t.name;
      });
    }

    // Empty read set — client merges local read state
    const items = buildAdminNotifications(rows, new Set(), taskForceNames);

    const open = rows.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s !== 'resolved' && s !== 'rejected' && s !== 'closed';
    }).length;
    const critical = rows.filter((r) => r.severity === 'Critical' || r.severity === 'High').length;
    const unassigned = rows.filter((r) => {
      const s = (r.status || '').toLowerCase();
      const openish = s !== 'resolved' && s !== 'rejected';
      return openish && !r.task_force_id;
    }).length;
    const withTf = rows.filter((r) => !!r.task_force_id).length;

    return NextResponse.json({
      items,
      reports: rows,
      taskForceNames,
      stats: {
        total: rows.length,
        open,
        critical,
        unassigned,
        withTaskForce: withTf,
      },
    });
  } catch (err) {
    console.error('[admin notifications] unexpected', err);
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL' }, { status: 500 });
  }
}
