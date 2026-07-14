export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';
import { buildReportPriorityMeta } from '@/lib/reports/priority';
import { normalizeCategory } from '@/lib/gemini/classify';

/**
 * Classify a draft report: category, severity, department, priority.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title : '';
    const description = typeof body.description === 'string' ? body.description : '';
    const categoryHint =
      typeof body.category === 'string' && body.category.trim()
        ? body.category
        : normalizeCategory(`${title} ${description}`);
    const severityHint = typeof body.severity === 'string' ? body.severity : null;

    const meta = buildReportPriorityMeta({
      title,
      description,
      category: categoryHint,
      severity: severityHint,
    });

    return NextResponse.json({
      category: meta.category,
      severity: meta.severity,
      department: meta.department,
      priority_score: meta.priority_score,
      ai_score: meta.priority_score,
    });
  } catch (err) {
    console.error('classify error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
