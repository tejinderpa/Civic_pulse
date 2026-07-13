'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithGoogle } from '@/lib/auth/google';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (!err) return;
    if (err === 'not-authorized') {
      setError('You are not authorized to access the admin panel.');
    } else if (err === 'auth-failed') {
      setError('Authentication failed. Please try again.');
    } else {
      setError(decodeURIComponent(err));
    }
  }, [searchParams]);

  const verifyAndRedirect = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile && ['admin', 'authority_staff'].includes(profile.role)) {
      const redirect = searchParams.get('redirect') || '/admin';
      const safe =
        redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/admin';
      router.push(safe);
      router.refresh();
      return true;
    }

    return false;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError(loginError?.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
      return;
    }

    const authorized = await verifyAndRedirect(data.user.id);

    if (!authorized) {
      await supabase.auth.signOut();
      setError('You are not authorized to access the admin panel. Contact your administrator if this is an error.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error: oauthError } = await signInWithGoogle(supabase, { next: '/admin' });

    if (oauthError) {
      setError(oauthError);
      setGoogleLoading(false);
    }
  };

  const inputClass =
    'w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white/[0.07] transition-all';

  return (
    <div className="min-h-screen flex bg-[#060A0D] text-white font-body">
      {/* ── Left visual panel ───────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white">
        <Image
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1600"
          alt="Green canopy and community pathways"
          fill
          priority
          className="object-cover"
          sizes="52vw"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#003d25]/92 via-[#005131]/78 to-[#1a6b45]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#002111]/90 via-transparent to-[#005131]/40" />

        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-400/25 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[360px] h-[360px] rounded-full bg-lime-300/15 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[280px] h-[280px] rounded-full bg-primary-container/40 blur-[80px] pointer-events-none" />

        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg shadow-black/10 group-hover:bg-white/25 transition-colors">
              <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
            </div>
            <div>
              <p className="font-headline font-extrabold text-xl tracking-tight leading-none">CivicPulse</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/70 mt-1">
                Authority Console
              </p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-50/90">
              Authorized personnel only
            </span>
          </div>
          <h2 className="font-headline text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
            Manage issues.
            <br />
            <span className="text-emerald-200">Dispatch teams.</span>
            <br />
            Serve the city.
          </h2>
          <p className="mt-6 text-emerald-50/80 text-base xl:text-lg leading-relaxed font-medium max-w-md">
            Sign in to the operations console to prioritize reports, assign task forces, and track resolution across your jurisdiction.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: 'priority_high', label: 'Triage high-priority civic reports' },
              { icon: 'groups', label: 'Assign & coordinate task forces' },
              { icon: 'analytics', label: 'Monitor resolution analytics live' },
            ].map((item) => (
              <li key={item.icon} className="flex items-center gap-3 text-emerald-50/90">
                <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
                  <span className="material-symbols-outlined text-[20px] text-emerald-200">{item.icon}</span>
                </span>
                <span className="font-semibold text-sm xl:text-base">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-emerald-100/50 text-xs font-medium">
          <span>Role-gated access</span>
          <span className="w-1 h-1 rounded-full bg-emerald-200/40" />
          <span>All sessions logged</span>
        </div>
      </aside>

      {/* ── Right form panel ────────────────────────────── */}
      <main className="flex-1 flex flex-col relative min-h-screen overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d2d1c18_1px,transparent_1px),linear-gradient(to_bottom,#0d2d1c18_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-emerald-900/20 blur-[90px]" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 xl:px-16 py-10 max-w-xl w-full mx-auto">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
            </div>
            <div>
              <span className="text-xl font-extrabold font-headline tracking-tight text-white block leading-none">CivicPulse</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/60">Authority</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-white tracking-tight">
              Authority Sign In
            </h1>
            <p className="text-white/40 mt-2 font-medium">
              Admin & authority staff only
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-body flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0">gpp_bad</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          <div className="flex items-center my-7">
            <div className="flex-grow h-px bg-white/10" />
            <span className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 font-label">
              or sign in with email
            </span>
            <div className="flex-grow h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                  mail
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gov.in"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/25 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setRememberMe((r) => !r)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                    rememberMe
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-white/20 bg-white/5 group-hover:border-white/40'
                  }`}
                >
                  {rememberMe && (
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/40 font-medium select-none">Remember me</span>
              </label>
              <Link href="#" className="text-xs text-emerald-400/70 hover:text-emerald-400 font-bold transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full py-4 mt-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 font-headline"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Access...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Access Control Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-white/35 text-sm font-medium">
              Not an authority?{' '}
              <Link href="/login" className="text-emerald-400 font-extrabold hover:underline decoration-2 underline-offset-4">
                Citizen Login →
              </Link>
            </p>
            <p className="text-white/20 text-xs">
              Need an admin account?{' '}
              <Link href="/admin-signup" className="text-white/40 hover:text-white/60 transition-colors font-semibold">
                Register with access code
              </Link>
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-white/15">
            <span className="material-symbols-outlined text-sm">security</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Secured access · All sessions logged</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060A0D] text-white/50">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
