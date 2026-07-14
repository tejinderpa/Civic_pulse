export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  severityFromCommunity,
  communityPriorityBonus,
  inferIssueScope,
} from '@/lib/reports/community-severity';
import { computePriorityScore } from '@/lib/reports/priority';

/**
 * One upvote per user per issue.
 * Source of truth: `votes` unique (user_id, issue_id) + `reports.upvotes` count.
 * Community upvotes can escalate severity for the local area.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  const issueId = params.id;
  const userClient = createClient();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = userClient;
  }

  try {
    const { data: report, error: reportError } = await admin
      .from('reports')
      .select(
        'id, title, description, category, location, severity, priority_score, upvotes, status'
      )
      .eq('id', issueId)
      .maybeSingle();

    if (reportError || !report) {
      // Retry without upvotes if column missing
      const { data: report2, error: err2 } = await admin
        .from('reports')
        .select('id, title, description, category, location, severity, priority_score, status')
        .eq('id', issueId)
        .maybeSingle();
      if (err2 || !report2) {
        return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 });
      }
      return await castVote({
        admin,
        userClient,
        userId: auth.user.id,
        report: { ...report2, upvotes: null },
        issueId,
        hasUpvotesCol: false,
      });
    }

    return await castVote({
      admin,
      userClient,
      userId: auth.user.id,
      report,
      issueId,
      hasUpvotesCol: true,
    });
  } catch (err) {
    console.error('Voting Error:', err);
    return NextResponse.json({ error: 'Failed to record vote', code: 'INTERNAL' }, { status: 500 });
  }
}

async function castVote(opts: {
  admin: ReturnType<typeof createClient>;
  userClient: ReturnType<typeof createClient>;
  userId: string;
  report: Record<string, unknown>;
  issueId: string;
  hasUpvotesCol: boolean;
}) {
  const { admin, userClient, userId, report, issueId, hasUpvotesCol } = opts;

  // --- 1) Enforce one vote per user ---
  const { data: existingVote } = await admin
    .from('votes')
    .select('id')
    .eq('user_id', userId)
    .eq('issue_id', issueId)
    .maybeSingle();

  if (existingVote) {
    const count = await readUpvoteCount(admin, issueId, report, hasUpvotesCol);
    return NextResponse.json(
      {
        success: false,
        error: 'You have already upvoted this issue',
        code: 'ALREADY_VOTED',
        upvotes: count,
        alreadyVoted: true,
      },
      { status: 409 }
    );
  }

  // Insert vote as the user (RLS: own row)
  const { error: voteError } = await userClient.from('votes').insert({
    user_id: userId,
    issue_id: issueId,
  });

  if (voteError) {
    if (voteError.code === '23505') {
      const count = await readUpvoteCount(admin, issueId, report, hasUpvotesCol);
      return NextResponse.json(
        {
          success: false,
          error: 'You have already upvoted this issue',
          code: 'ALREADY_VOTED',
          upvotes: count,
          alreadyVoted: true,
        },
        { status: 409 }
      );
    }
    // votes table missing — fall through with soft counter only
    if (voteError.code !== '42P01' && !/does not exist|relation/i.test(voteError.message || '')) {
      console.warn('[vote] insert failed:', voteError.message);
      return NextResponse.json(
        { error: voteError.message, code: 'DB_ERROR' },
        { status: 500 }
      );
    }
  }

  // --- 2) Count votes (prefer votes table) ---
  let upvotes = await countFromVotesTable(admin, issueId);
  if (upvotes == null) {
    const prev =
      typeof report.upvotes === 'number' && Number.isFinite(report.upvotes)
        ? report.upvotes
        : 0;
    upvotes = prev + 1;
  }

  // --- 3) Community severity from local people ---
  const baseSeverity = String(report.severity || 'Medium');
  const scope = inferIssueScope({
    title: report.title as string,
    description: report.description as string,
    location: report.location as string,
    category: report.category as string,
  });
  const community = severityFromCommunity({
    baseSeverity,
    upvotes,
    scope,
    title: report.title as string,
    description: report.description as string,
    location: report.location as string,
    category: report.category as string,
  });

  const priority_score = Math.min(
    100,
    computePriorityScore({
      severity: community.severity,
      category: report.category as string,
      title: report.title as string,
      description: report.description as string,
      upvotes,
    }) + communityPriorityBonus(upvotes, scope)
  );

  // --- 4) Persist counter + severity ---
  const updates: Record<string, unknown> = {
    severity: community.severity,
    priority_score,
  };
  if (hasUpvotesCol) {
    updates.upvotes = upvotes;
  }

  const { error: updateErr } = await admin.from('reports').update(updates).eq('id', issueId);
  if (updateErr) {
    // Retry without upvotes column
    if (/upvotes/i.test(updateErr.message || '')) {
      await admin
        .from('reports')
        .update({ severity: community.severity, priority_score })
        .eq('id', issueId);
    } else {
      console.warn('[vote] update:', updateErr.message);
    }
  }

  return NextResponse.json({
    success: true,
    upvotes,
    alreadyVoted: false,
    severity: community.severity,
    priority_score,
    scope,
    communityBoost: community.communityBoost,
    reason: community.reason,
  });
}

async function countFromVotesTable(
  admin: ReturnType<typeof createClient>,
  issueId: string
): Promise<number | null> {
  const { count, error } = await admin
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('issue_id', issueId);
  if (error) return null;
  return typeof count === 'number' ? count : null;
}

async function readUpvoteCount(
  admin: ReturnType<typeof createClient>,
  issueId: string,
  report: Record<string, unknown>,
  hasUpvotesCol: boolean
): Promise<number> {
  const fromTable = await countFromVotesTable(admin, issueId);
  if (fromTable != null) return fromTable;
  if (hasUpvotesCol && typeof report.upvotes === 'number') return report.upvotes;
  return 0;
}

/** GET — current count + whether this user already voted */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  const issueId = params.id;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = createClient();
  }

  const fromTable = await countFromVotesTable(admin, issueId);
  const { data: report } = await admin
    .from('reports')
    .select('upvotes')
    .eq('id', issueId)
    .maybeSingle();

  const { data: myVote } = await admin
    .from('votes')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('issue_id', issueId)
    .maybeSingle();

  return NextResponse.json({
    upvotes: fromTable ?? (report as { upvotes?: number } | null)?.upvotes ?? 0,
    alreadyVoted: Boolean(myVote),
  });
}
