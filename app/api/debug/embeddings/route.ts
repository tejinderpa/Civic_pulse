import { NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';

/**
 * Debug embeddings endpoint — admin-only and disabled in production.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  return NextResponse.json({
    message: 'Debug embeddings endpoint is gated. Use local tooling instead.',
  });
}

export async function POST() {
  return GET();
}
