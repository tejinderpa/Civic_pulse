import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User, SupabaseClient } from '@supabase/supabase-js';

export type AuthSuccess = {
  user: User;
  supabase: SupabaseClient;
};

export type AuthFailure = {
  error: NextResponse;
};

/**
 * Require an authenticated session. Uses the cookie-bound anon client.
 */
export async function requireUser(): Promise<AuthSuccess | AuthFailure> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }

  return { user, supabase };
}

export function isAuthFailure(result: AuthSuccess | AuthFailure): result is AuthFailure {
  return 'error' in result;
}
