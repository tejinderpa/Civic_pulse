import { NextResponse } from 'next/server';
import { REPORT_DETAIL_SELECT, normalizeReportRow } from '@/lib/reports/columns';
import { requireUser, isAuthFailure, isAdminRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const issueId = params.id;
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('reports')
      .select(REPORT_DETAIL_SELECT)
      .eq('id', issueId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(normalizeReportRow(data as Record<string, unknown>));
  } catch (err) {
    console.error('Issue Detail Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to fetch issue details', code: 'INTERNAL' }, { status: 500 });
  }
}

/**
 * Delete a report. Owner or admin/authority staff only.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  const issueId = params.id;
  if (!issueId) {
    return NextResponse.json({ error: 'Issue id required', code: 'BAD_REQUEST' }, { status: 400 });
  }

  try {
    const { data: report, error: fetchError } = await auth.supabase
      .from('reports')
      .select('id, user_id, image_url')
      .eq('id', issueId)
      .maybeSingle();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const { data: profile } = await auth.supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle();

    const isOwner = report.user_id === auth.user.id;
    const isAdmin = isAdminRole(profile?.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not allowed to delete this issue', code: 'FORBIDDEN' }, { status: 403 });
    }

    // Best-effort: remove storage image if it lives in our bucket
    if (report.image_url && typeof report.image_url === 'string') {
      try {
        const marker = '/civicpulse-assets/';
        const idx = report.image_url.indexOf(marker);
        if (idx !== -1) {
          const path = report.image_url.slice(idx + marker.length).split('?')[0];
          if (path) {
            await auth.supabase.storage.from('civicpulse-assets').remove([decodeURIComponent(path)]);
          }
        }
      } catch (storageErr) {
        console.warn('Image cleanup failed (continuing delete):', storageErr);
      }
    }

    const { error: deleteError } = await auth.supabase
      .from('reports')
      .delete()
      .eq('id', issueId);

    if (deleteError) {
      console.error('Delete report error:', deleteError);
      // Common when RLS policy missing
      if (/policy|permission|denied|rls/i.test(deleteError.message)) {
        return NextResponse.json(
          {
            error:
              'Delete is not permitted by the database yet. Run migration 20260713020000_citizen_delete_and_history.sql in Supabase.',
            code: 'RLS_BLOCKED',
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: deleteError.message, code: 'DB_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: issueId });
  } catch (err) {
    console.error('Issue delete error:', err);
    return NextResponse.json({ error: 'Failed to delete issue', code: 'INTERNAL' }, { status: 500 });
  }
}
