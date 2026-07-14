export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Assign a report to an existing task force and/or update status/department.
 * Body: { issueId, taskForceId?, status?, department?, note? }
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const body = await req.json();
    const issueId = body.issueId as string | undefined;
    const taskForceId = (body.taskForceId as string | null | undefined) || null;
    const status = body.status as string | undefined;
    const department = body.department as string | undefined;
    const note = (body.note as string | undefined)?.trim() || '';

    if (!issueId) {
      return NextResponse.json({ error: 'issueId is required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const actorName = auth.fullName || auth.user.email || 'Admin';

    const { data: existing, error: fetchErr } = await supabase
      .from('reports')
      .select('id, status, department, task_force_id, title')
      .eq('id', issueId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const history: Array<{
      issue_id: string;
      action_type: string;
      old_value: string | null;
      new_value: string | null;
      user_name: string;
      user_id: string;
    }> = [];

    // Assign / reassign task force
    if (taskForceId !== undefined && taskForceId !== existing.task_force_id) {
      if (taskForceId) {
        const { data: tf, error: tfErr } = await supabase
          .from('task_forces')
          .select('id, name, status')
          .eq('id', taskForceId)
          .maybeSingle();

        if (tfErr || !tf) {
          return NextResponse.json({ error: 'Task force not found', code: 'NOT_FOUND' }, { status: 404 });
        }

        // Link in junction table (ignore unique conflict)
        await supabase.from('task_force_issues').upsert(
          { task_force_id: taskForceId, issue_id: issueId },
          { onConflict: 'task_force_id,issue_id', ignoreDuplicates: true }
        );

        updates.task_force_id = taskForceId;
        history.push({
          issue_id: issueId,
          action_type: 'task_force_assignment',
          old_value: existing.task_force_id,
          new_value: tf.name,
          user_name: actorName,
          user_id: auth.user.id,
        });

        // Nudge Submitted → Under Review when first assigned
        if (!status && existing.status === 'Submitted') {
          updates.status = 'Under Review';
          history.push({
            issue_id: issueId,
            action_type: 'status_change',
            old_value: existing.status,
            new_value: 'Under Review',
            user_name: actorName,
            user_id: auth.user.id,
          });
        }
      } else {
        updates.task_force_id = null;
        history.push({
          issue_id: issueId,
          action_type: 'task_force_unassign',
          old_value: existing.task_force_id,
          new_value: null,
          user_name: actorName,
          user_id: auth.user.id,
        });
      }
    }

    if (status && status !== existing.status) {
      if (status === 'Rejected' && !note) {
        return NextResponse.json(
          { error: 'A note is required when rejecting an issue', code: 'BAD_REQUEST' },
          { status: 400 }
        );
      }
      updates.status = status;
      history.push({
        issue_id: issueId,
        action_type: 'status_change',
        old_value: existing.status,
        new_value: status,
        user_name: actorName,
        user_id: auth.user.id,
      });
      if (note) {
        history.push({
          issue_id: issueId,
          action_type: 'note',
          old_value: null,
          new_value: note,
          user_name: actorName,
          user_id: auth.user.id,
        });
      }
    }

    if (department !== undefined && department !== (existing.department || '')) {
      updates.department = department || null;
      history.push({
        issue_id: issueId,
        action_type: 'department_assignment',
        old_value: existing.department,
        new_value: department || null,
        user_name: actorName,
        user_id: auth.user.id,
      });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        ok: true,
        issue: existing,
        message: 'No changes',
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', issueId)
      .select('id, status, department, task_force_id, title')
      .single();

    if (updateErr) {
      console.error('[Assign API] update error:', updateErr);
      return NextResponse.json({ error: updateErr.message, code: 'DB_ERROR' }, { status: 500 });
    }

    if (history.length > 0) {
      const { error: histErr } = await supabase.from('issue_history').insert(history);
      if (histErr) console.warn('[Assign API] history insert failed:', histErr.message);
    }

    return NextResponse.json({ ok: true, issue: updated });
  } catch (err) {
    console.error('[Assign API] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 });
  }
}
