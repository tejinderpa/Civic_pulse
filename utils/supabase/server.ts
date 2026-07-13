/** @deprecated Prefer `@/lib/supabase/server` — cookieStore arg is ignored (handled internally). */
import { createClient as createServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createClient(_cookieStore?: unknown) {
  return createServerClient();
}
