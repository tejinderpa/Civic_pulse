import { NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';

export async function GET() {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  const { data, error } = await auth.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
