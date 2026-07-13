import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server OAuth callback (fallback). Prefer /auth/callback client page for PKCE.
 * Supports: /api/auth/callback?code=...&next=/feed
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If no code, send browser to client callback (handles hash errors + sessionStorage next)
  if (!code && !errorParam) {
    return NextResponse.redirect(`${origin}/auth/callback${request.nextUrl.search}`);
  }

  if (errorParam) {
    const msg = encodeURIComponent(errorDescription || errorParam || 'OAuth failed');
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  let next = searchParams.get('next') ?? '/feed';
  // Fix double-encoded paths like %2Ffeed or %252Ffeed
  try {
    next = decodeURIComponent(next);
  } catch {
    /* keep */
  }
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/feed';
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const { getSupabasePublicConfig } = await import('@/lib/supabase/env');
  const { url: supabaseUrl, anonKey } = getSupabasePublicConfig();

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.redirect(`${origin}${next}`);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession:', error.message);
    // Fall through to client page which often succeeds with PKCE verifier
    return NextResponse.redirect(
      `${origin}/auth/callback?code=${encodeURIComponent(code!)}&next=${encodeURIComponent(next)}`
    );
  }

  return response;
}
