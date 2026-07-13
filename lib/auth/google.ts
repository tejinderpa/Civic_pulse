'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSiteOrigin, safeNextPath } from './site-url';

export const AUTH_NEXT_KEY = 'civicpulse_auth_next';

/**
 * Start Google OAuth (PKCE).
 *
 * redirectTo must be a clean path with NO query string so it matches
 * Supabase allowlist exactly: http://localhost:3000/auth/callback
 * Post-login path is stored in sessionStorage instead.
 */
export async function signInWithGoogle(
  supabase: SupabaseClient,
  options?: { next?: string }
): Promise<{ error: string | null }> {
  const origin = getSiteOrigin();
  const next = safeNextPath(options?.next, '/feed');

  try {
    sessionStorage.setItem(AUTH_NEXT_KEY, next);
  } catch {
    /* private mode */
  }

  // Clean URL only — do NOT append ?next= (causes double-encoding / allowlist mismatch)
  const redirectTo = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return {
      error:
        error.message ||
        'Google sign-in failed. In Supabase: enable Google provider, paste Client ID/Secret, and add Redirect URL http://localhost:3000/auth/callback',
    };
  }

  if (data?.url && typeof window !== 'undefined') {
    window.location.assign(data.url);
    return { error: null };
  }

  return {
    error:
      'No OAuth URL returned. Check Supabase Google provider is enabled and redirect URL is allowlisted.',
  };
}
