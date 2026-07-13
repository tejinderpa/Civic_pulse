import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { isAdminRole } from './roles';

export type AdminAuthSuccess = {
  user: User;
  supabase: SupabaseClient;
  role: string;
  fullName: string | null;
};

export type AdminAuthFailure = {
  error: NextResponse;
};

/**
 * Require authenticated admin based on profiles.role only (never user_metadata).
 */
export async function requireAdmin(): Promise<AdminAuthSuccess | AdminAuthFailure> {
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !isAdminRole(profile.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 }),
    };
  }

  return {
    user,
    supabase,
    role: profile.role,
    fullName: profile.full_name ?? null,
  };
}

export function isAdminFailure(result: AdminAuthSuccess | AdminAuthFailure): result is AdminAuthFailure {
  return 'error' in result;
}
