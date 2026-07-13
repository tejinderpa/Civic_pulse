import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminRole } from '@/lib/auth/roles'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

/** Citizen app routes (require login). */
const CITIZEN_APP = ['/my-reports', '/feed', '/report', '/profile', '/notifications'] as const

/** Admin auth pages (public). */
const ADMIN_AUTH = ['/admin-login', '/admin-signup', '/admin-auth-callback'] as const

function isCitizenAppPath(path: string) {
  return CITIZEN_APP.some((p) => path === p || path.startsWith(`${p}/`))
}

function isAdminAuthPath(path: string) {
  return ADMIN_AUTH.some((p) => path === p || path.startsWith(`${p}/`))
}

/** Authority console: /admin and /admin/* except auth pages. */
function isAdminAppPath(path: string) {
  if (!path.startsWith('/admin')) return false
  return !isAdminAuthPath(path)
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  if (!url || !anonKey) {
    console.error('[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return supabaseResponse
  }

  const supabase = createServerClient(url, anonKey, {
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
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // OAuth / auth callbacks — never block
  if (path.startsWith('/auth/callback') || path.startsWith('/api/auth/callback')) {
    return supabaseResponse
  }

  if (process.env.NODE_ENV === 'production') {
    if (path.startsWith('/test-supabase') || path.startsWith('/api/debug')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // ── Citizen app: must be logged in ────────────────────────
  if (isCitizenAppPath(path) && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // ── Authority console: login + admin role ─────────────────
  if (isAdminAppPath(path)) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin-login'
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }

    // profiles table may not exist — soft-fail means not authorized
    let role: string | null = null
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      role = profile?.role ?? null
    } catch {
      role = null
    }

    if (!isAdminRole(role)) {
      // Citizens who wander into /admin land on citizen feed with a hint
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/feed'
      redirectUrl.searchParams.set('notice', 'admin-only')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ── Citizen auth pages: bounce if already signed in ───────
  if (user && (path === '/login' || path === '/signup')) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    const redirectUrl = request.nextUrl.clone()
    // Never send citizens into /admin via login redirect
    const safe =
      redirect &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//') &&
      !redirect.startsWith('/admin')
        ? redirect
        : '/feed'
    redirectUrl.pathname = safe
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // ── Admin auth pages: bounce admins to console ────────────
  if (user && isAdminAuthPath(path) && path !== '/admin-auth-callback') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (isAdminRole(profile?.role)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/admin'
        return NextResponse.redirect(redirectUrl)
      }
    } catch {
      // ignore — stay on admin login
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
