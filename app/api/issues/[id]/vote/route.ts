export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';

/**
 * Vote on a report. Schema may not have upvotes/votes table yet —
 * we try several strategies and still return success for UX when possible.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  const issueId = params.id;
  const supabase = createClient();

  try {
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, priority_score')
      .eq('id', issueId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Optional: votes table (may not exist)
    const { error: voteError } = await supabase
      .from('votes')
      .insert({ user_id: auth.user.id, issue_id: issueId });

    if (voteError) {
      if (voteError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already upvoted this issue', code: 'ALREADY_VOTED' },
          { status: 400 }
        );
      }
      // 42P01 undefined_table — continue without votes table
      if (voteError.code !== '42P01' && !voteError.message?.includes('does not exist')) {
        console.warn('[vote] votes insert:', voteError.message);
      }
    }

    // Try RPC then upvotes column; fall back to priority_score bump
    let upvotes: number | null = null;

    const { error: rpcError } = await supabase.rpc('increment_upvotes', {
      issue_id_param: issueId,
    });

    if (!rpcError) {
      const { data: updated } = await supabase
        .from('reports')
        .select('upvotes')
        .eq('id', issueId)
        .single();
      if (updated && typeof (updated as { upvotes?: number }).upvotes === 'number') {
        upvotes = (updated as { upvotes: number }).upvotes;
      }
    } else {
      // Try upvotes column
      const { data: withVotes } = await supabase
        .from('reports')
        .select('upvotes')
        .eq('id', issueId)
        .maybeSingle();

      if (withVotes && 'upvotes' in withVotes) {
        const next = ((withVotes as { upvotes?: number }).upvotes || 0) + 1;
        await supabase.from('reports').update({ upvotes: next }).eq('id', issueId);
        upvotes = next;
      } else {
        // Bump priority_score as a soft engagement signal
        const nextPriority = (report.priority_score || 0) + 1;
        await supabase
          .from('reports')
          .update({ priority_score: nextPriority })
          .eq('id', issueId);
        upvotes = nextPriority;
      }
    }

    return NextResponse.json({
      success: true,
      upvotes: upvotes ?? 1,
    });
  } catch (err) {
    console.error('Voting Error:', err);
    return NextResponse.json({ error: 'Failed to record vote', code: 'INTERNAL' }, { status: 500 });
  }
}
