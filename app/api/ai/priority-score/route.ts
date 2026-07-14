export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';
import { buildReportPriorityMeta } from '@/lib/reports/priority';

/**
 * Score a draft report for priority / severity / department.
 * Used by the citizen report wizard before final submit.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title : '';
    const description = typeof body.description === 'string' ? body.description : '';
    const category = typeof body.category === 'string' ? body.category : 'Other';
    const severity = typeof body.severity === 'string' ? body.severity : null;
    const upvotes = typeof body.upvotes === 'number' ? body.upvotes : 0;

    if (!description && !title) {
      return NextResponse.json(
        { error: 'title or description required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const meta = buildReportPriorityMeta({
      title,
      description,
      category,
      severity,
      upvotes,
    });

    return NextResponse.json({
      severity: meta.severity,
      priority_score: meta.priority_score,
      ai_score: meta.priority_score,
      department: meta.department,
      category: meta.category,
      rationale:
        meta.severity === 'Critical'
          ? 'Critical keywords or high risk indicators detected — escalate immediately.'
          : meta.severity === 'High'
            ? 'Elevated risk signals — prioritize for near-term field response.'
            : meta.severity === 'Low'
              ? 'Lower urgency — schedule with routine maintenance.'
              : 'Standard civic priority — review and assign as capacity allows.',
    });
  } catch (err) {
    console.error('priority-score error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
