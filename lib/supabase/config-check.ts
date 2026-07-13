/**
 * Client-safe helpers to explain Supabase connectivity problems.
 */
export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    hasAnonKey: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ),
  };
}

export function isLikelyNetworkAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /failed to fetch|networkerror|load failed|err_name_not_resolved|name_not_resolved/i.test(
    msg
  );
}
