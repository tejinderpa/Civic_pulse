export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';
import { classifyReport } from '@/lib/ai/classify-report';

/**
 * Score a draft report (same classifier as /api/ai/classify).
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title : '';
    const description = typeof body.description === 'string' ? body.description : '';
    const category = typeof body.category === 'string' ? body.category : null;
    const severity = typeof body.severity === 'string' ? body.severity : null;
    const location = typeof body.location === 'string' ? body.location : null;

    if (!description && !title) {
      return NextResponse.json(
        { error: 'title or description required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const result = await classifyReport({
      title,
      description,
      category,
      severity,
      location,
    });

    return NextResponse.json({
      severity: result.severity,
      priority_score: result.priority_score,
      ai_score: result.priority_score,
      department: result.department,
      category: result.category,
      rationale: result.rationale,
      confidence: result.confidence,
      source: result.source,
    });
  } catch (err) {
    console.error('priority-score error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
