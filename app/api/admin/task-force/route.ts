import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TaskForceRequest } from '@/types/issue';

export async function POST(req: Request) {
  try {
    const { name, issueIds }: TaskForceRequest = await req.json();

    // Validation
    if (!name || name.length < 3 || name.length > 80) {
      return NextResponse.json({ error: 'Name must be between 3 and 80 characters' }, { status: 400 });
    }
    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json({ error: 'At least one issue must be selected' }, { status: 400 });
    }
    if (issueIds.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 issues can be assigned to a task force' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Create Task Force
    const { data: taskForce, error: tfError } = await supabase
      .from('task_forces')
      .insert([{ name, status: 'active' }])
      .select()
      .single();

    if (tfError || !taskForce) {
      console.error('[Task Force API] TF Creation Error:', tfError);
      return NextResponse.json({ error: 'Failed to create task force' }, { status: 500 });
    }

    // 2. Map Issues to Task Force
    const taskForceIssues = issueIds.map(id => ({
      task_force_id: taskForce.id,
      issue_id: id
    }));

    const { error: mapError } = await supabase
      .from('task_force_issues')
      .insert(taskForceIssues);

    if (mapError) {
      console.error('[Task Force API] Mapping Error:', mapError);
      // We'll continue to try updating issues even if mapping fails (or handle cleanup)
    }

    // 3. Update Issues Status & Task Force ID
    const { data: updatedIssues, error: updateError } = await supabase
      .from('reports')
      .update({ 
        task_force_id: taskForce.id,
        status: 'Under Review' // Simplified status update logic as requested
      })
      .in('id', issueIds)
      .neq('status', 'Resolved') // Don't downgrade resolved issues
      .neq('status', 'Rejected')
      .select('id, status');

    if (updateError) {
      console.error('[Task Force API] Update Issues Error:', updateError);
    }

    // 4. Insert Timeline Events
    const timelineEvents = issueIds.map(id => ({
      issue_id: id,
      action_type: 'task_force_assignment',
      new_value: name,
      user_name: 'System Admin', // In a real app, use authenticated user name
      created_at: new Date().toISOString()
    }));

    const { error: timelineError } = await supabase
      .from('issue_history')
      .insert(timelineEvents);

    if (timelineError) {
      console.error('[Task Force API] Timeline Error:', timelineError);
    }

    return NextResponse.json({
      taskForceId: taskForce.id,
      name: taskForce.name,
      issuesAssigned: issueIds.length,
      statusesUpdated: updatedIssues?.length || 0
    });

  } catch (err) {
    console.error('[Task Force API] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
