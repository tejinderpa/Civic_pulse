import { NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';

/** Placeholder for AI priority scoring. */
export async function POST() {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;
  return NextResponse.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED' }, { status: 501 });
}
