export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { REPORT_DETAIL_SELECT } from '@/lib/reports/columns';

type HistoryRow = {
  id: string;
  issue_id: string;
  action_type: string;
  old_value?: string | null;
  new_value?: string | null;
  user_name?: string | null;
  created_at: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const issueId = params.id;
  const supabase = createClient();

  try {
    // Confirm issue exists
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`${REPORT_DETAIL_SELECT}`)
      .eq('id', issueId)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const { data: history, error } = await supabase
      .from('issue_history')
      .select('id, issue_id, action_type, old_value, new_value, user_name, created_at')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Timeline fetch error:', error);
    }

    let events: HistoryRow[] = (history as HistoryRow[]) || [];

    // Always surface a submission event so progress page is never empty
    const hasSubmission = events.some(
      (e) => e.action_type === 'submission' || e.action_type === 'created'
    );

    if (!hasSubmission) {
      events = [
        {
          id: `synthetic-submission-${issueId}`,
          issue_id: issueId,
          action_type: 'submission',
          old_value: null,
          new_value: report.status || 'Submitted',
          user_name: 'Reporter',
          created_at: report.created_at || new Date().toISOString(),
        },
        ...events,
      ];
    }

    // If status moved past Submitted and no status_change log, add current status
    const status = (report.status || 'Submitted') as string;
    const statusLower = status.toLowerCase();
    if (
      statusLower !== 'submitted' &&
      statusLower !== 'pending' &&
      !events.some((e) => e.action_type === 'status_change')
    ) {
      events = [
        ...events,
        {
          id: `synthetic-status-${issueId}`,
          issue_id: issueId,
          action_type: 'status_change',
          old_value: 'Submitted',
          new_value: status,
          user_name: 'Authority',
          created_at: report.created_at || new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json(events);
  } catch (err) {
    console.error('Timeline Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to fetch timeline', code: 'INTERNAL' }, { status: 500 });
  }
}
