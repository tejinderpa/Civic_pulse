export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import type { TaskForceRequest } from '@/types/report';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const { name, issueIds }: TaskForceRequest = await req.json();

    if (!name || name.length < 3 || name.length > 80) {
      return NextResponse.json({ error: 'Name must be between 3 and 80 characters', code: 'BAD_REQUEST' }, { status: 400 });
    }
    const ids: string[] = Array.isArray(issueIds) ? issueIds.filter(Boolean) : [];
    if (ids.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 issues can be assigned to a task force', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const actorName = auth.fullName || auth.user.email || 'Admin';

    const { data: taskForce, error: tfError } = await supabase
      .from('task_forces')
      .insert([{ name, status: 'active', created_by: auth.user.id }])
      .select()
      .single();

    if (tfError || !taskForce) {
      console.error('[Task Force API] TF Creation Error:', tfError);
      return NextResponse.json({ error: 'Failed to create task force', code: 'DB_ERROR' }, { status: 500 });
    }

    let statusesUpdated = 0;

    if (ids.length > 0) {
      const taskForceIssues = ids.map((id) => ({
        task_force_id: taskForce.id,
        issue_id: id,
      }));

      const { error: mapError } = await supabase
        .from('task_force_issues')
        .insert(taskForceIssues);

      if (mapError) {
        console.error('[Task Force API] Mapping Error:', mapError);
      }

      const { data: updatedIssues, error: updateError } = await supabase
        .from('reports')
        .update({
          task_force_id: taskForce.id,
          status: 'Under Review',
        })
        .in('id', ids)
        .neq('status', 'Resolved')
        .neq('status', 'Rejected')
        .select('id, status');

      if (updateError) {
        console.error('[Task Force API] Update Issues Error:', updateError);
      } else {
        statusesUpdated = updatedIssues?.length || 0;
      }

      const timelineEvents = ids.map((id) => ({
        issue_id: id,
        action_type: 'task_force_assignment',
        new_value: name,
        user_name: actorName,
        user_id: auth.user.id,
        created_at: new Date().toISOString(),
      }));

      const { error: timelineError } = await supabase
        .from('issue_history')
        .insert(timelineEvents);

      if (timelineError) {
        console.error('[Task Force API] Timeline Error:', timelineError);
      }
    }

    return NextResponse.json({
      taskForceId: taskForce.id,
      name: taskForce.name,
      issuesAssigned: ids.length,
      statusesUpdated,
    });
  } catch (err) {
    console.error('[Task Force API] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred', code: 'INTERNAL' }, { status: 500 });
  }
}
