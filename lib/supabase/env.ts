/**
 * Public Supabase config for browser + server.
 *
 * IMPORTANT: Next.js only inlines env vars that are accessed as
 * process.env.NEXT_PUBLIC_* string literals (not process.env[name]).
 */

export function getSupabaseUrl(): string {
  // Direct property access required for client bundle inlining
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return String(url).trim().replace(/\/$/, '');
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    '';
  return String(key).trim();
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      [
        'Supabase URL / API key missing in the browser bundle.',
        'Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY,',
        'then delete the .next folder and run: npm run dev',
        `Debug: url=${url ? 'ok' : 'MISSING'} key=${anonKey ? 'ok' : 'MISSING'}`,
      ].join(' ')
    );
  }

  return { url, anonKey };
}
