import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Citizen protected routes ──────────────────────────────
  const citizenProtected = ['/my-reports', '/feed', '/report', '/profile', '/notifications']
  if (!user && citizenProtected.some(p => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // ── Admin protected routes ────────────────────────────────
  const adminPublicPaths = ['/admin-login', '/admin-signup', '/admin-auth-callback']
  const isAdminProtected = path.startsWith('/admin') && !adminPublicPaths.some(p => path.startsWith(p))

  if (isAdminProtected) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }

    // Check role from profiles table OR from user_metadata
    const metaRole = user.user_metadata?.role;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isDatabaseAdmin = profile && ['admin', 'authority_staff'].includes(profile.role);
    const isMetaAdmin = ['admin', 'authority_staff'].includes(metaRole);

    if (!isDatabaseAdmin && !isMetaAdmin) {
      console.error('[middleware] User not admin in DB or Meta.', { profile, metaRole, error });
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      url.searchParams.set('error', 'not-authorized')
      return NextResponse.redirect(url)
    }
  }

  // ── Redirect logged-in users away from citizen auth pages ─
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  // ── Redirect logged-in admins away from admin auth pages ──
  if (user && (path === '/admin-login' || path === '/admin-signup')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile && ['admin', 'authority_staff'].includes(profile.role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    } catch {
      // ignore — profiles table may not exist yet
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
