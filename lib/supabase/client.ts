'use client';

import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser Supabase client.
 * Reads NEXT_PUBLIC_* via string-literal access so Next can inline them.
 */
export function createClient() {
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  // Must be string literals — do not refactor into process.env[name]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured in this build. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, delete the .next folder, and restart npm run dev.'
    );
  }

  const client = createBrowserClient(url, anonKey);

  if (typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
}
