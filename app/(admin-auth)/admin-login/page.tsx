'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
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

  // Show error from query param (e.g. from admin-auth-callback)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'not-authorized') {
      setError('You are not authorized to access the admin panel.');
    } else if (err === 'auth-failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const verifyAndRedirect = async (userId: string) => {
    // First attempt: check user_metadata (set at signup time)
    const { data: { user } } = await supabase.auth.getUser();
    const metaRole = user?.user_metadata?.role;

    if (metaRole && ['admin', 'authority_staff'].includes(metaRole)) {
      const redirect = searchParams.get('redirect') || '/admin';
      router.push(redirect);
      router.refresh();
      return true;
    }

    // Second attempt: check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile && ['admin', 'authority_staff'].includes(profile.role)) {
      const redirect = searchParams.get('redirect') || '/admin';
      router.push(redirect);
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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/admin-auth-callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // On success, browser is redirected to Google — no further action here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060A0D] p-6 relative overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d2d1c18_1px,transparent_1px),linear-gradient(to_bottom,#0d2d1c18_1px,transparent_1px)] bg-[size:40px_40px]" />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-[460px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-2xl shadow-emerald-500/30 mb-5">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Authority Control Panel</h1>
          <p className="text-emerald-400/50 text-xs font-bold uppercase tracking-[0.25em] mt-2">CivicPulse · Authorized Access Only</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.035] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
          <div className="mb-7">
            <h2 className="text-xl font-black text-white">Sign In</h2>
            <p className="text-white/35 text-sm mt-1">Admin & authority staff only</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-start gap-3">
              <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">gpp_bad</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 mb-6"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/25 text-[10px] font-bold uppercase tracking-widest">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">
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
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">
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
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-12 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(r => !r)}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full py-4 mt-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
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
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-white/25 text-xs">
            Not an authority?{' '}
            <Link href="/login" className="text-emerald-400/70 font-bold hover:text-emerald-400 transition-colors">
              Citizen Login →
            </Link>
          </p>
          <p className="text-white/15 text-xs">
            Need an admin account?{' '}
            <Link href="/admin-signup" className="text-white/30 hover:text-white/50 transition-colors">
              Register with access code
            </Link>
          </p>
        </div>

        {/* Security notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/15">
          <span className="material-symbols-outlined text-sm">security</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Secured access · All sessions logged</span>
        </div>
      </main>
    </div>
  );
}
