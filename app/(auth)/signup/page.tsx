'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithGoogle } from '@/lib/auth/google';
import { getSiteOrigin } from '@/lib/auth/site-url';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error: oauthError } = await signInWithGoogle(supabase, { next: '/feed' });
    if (oauthError) {
      setError(oauthError);
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT')) {
        setError(
          'Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local from your Supabase project settings.'
        );
        setIsSubmitting(false);
        return;
      }

      const origin = getSiteOrigin();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message || 'Sign up failed';
        if (/failed to fetch|network|load failed/i.test(msg)) {
          setError(
            `Cannot reach Supabase (${supabaseUrl}). The project URL may be wrong, paused, or deleted. Copy the Project URL from Supabase → Project Settings → API into NEXT_PUBLIC_SUPABASE_URL, then restart npm run dev.`
          );
        } else {
          setError(msg);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('An account with this email already exists. Please log in instead.');
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        router.push('/feed');
        router.refresh();
        return;
      }

      setSuccess(
        'Account created! Check your email for a confirmation link, then sign in. (Check spam if you do not see it.)'
      );
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '(missing)';
      setError(
        `Network error reaching Supabase at ${supabaseUrl}. ERR_NAME_NOT_RESOLVED means this hostname does not exist — open Supabase Dashboard → Project Settings → API and paste the correct Project URL into .env.local as NEXT_PUBLIC_SUPABASE_URL, then restart the dev server.`
      );
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-12 pr-4 py-3.5 bg-surface-container-low/80 border border-outline-variant/25 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all outline-none text-on-surface placeholder:text-on-surface-variant/45 font-body text-sm';

  return (
    <div className="min-h-screen flex bg-surface text-on-surface font-body">
      {/* ── Left visual panel ───────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white">
        {/* Base photo */}
        <Image
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1600"
          alt="Green canopy and community pathways"
          fill
          priority
          className="object-cover"
          sizes="52vw"
        />

        {/* Greenish overlays + ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d25]/92 via-[#005131]/78 to-[#1a6b45]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#002111]/90 via-transparent to-[#005131]/40" />

        {/* Soft green ambient shadows / orbs */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-400/25 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[360px] h-[360px] rounded-full bg-lime-300/15 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[280px] h-[280px] rounded-full bg-primary-container/40 blur-[80px] pointer-events-none" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg shadow-black/10 group-hover:bg-white/25 transition-colors">
              <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                pulse_alert
              </span>
            </div>
            <div>
              <p className="font-headline font-extrabold text-xl tracking-tight leading-none">CivicPulse</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/70 mt-1">
                The Digital Common
              </p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-50/90">
              Join your community
            </span>
          </div>
          <h2 className="font-headline text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
            Report issues.
            <br />
            <span className="text-emerald-200">Track progress.</span>
            <br />
            Shape your city.
          </h2>
          <p className="mt-6 text-emerald-50/80 text-base xl:text-lg leading-relaxed font-medium max-w-md">
            Thousands of neighbors use CivicPulse to flag potholes, waste, water, and power problems — and get them fixed faster with AI-assisted routing.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: 'photo_camera', label: 'Snap & report in under a minute' },
              { icon: 'hub', label: 'AI detects duplicates automatically' },
              { icon: 'map', label: 'Follow live map status near you' },
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
          <span>Secure auth via Supabase</span>
          <span className="w-1 h-1 rounded-full bg-emerald-200/40" />
          <span>Built for civic impact</span>
        </div>
      </aside>

      {/* ── Right form panel ────────────────────────────── */}
      <main className="flex-1 flex flex-col relative min-h-screen overflow-y-auto">
        {/* Soft green ambient on form side */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-primary-container/10 blur-[90px]" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 xl:px-16 py-10 max-w-xl w-full mx-auto">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="w-10 h-10 signature-gradient rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                pulse_alert
              </span>
            </div>
            <span className="text-xl font-extrabold font-headline tracking-tight text-primary">CivicPulse</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-on-surface tracking-tight">
              Create your account
            </h1>
            <p className="text-on-surface-variant mt-2 font-medium">
              Join the digital common and improve your neighborhood.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs font-bold font-body flex items-start gap-2 border border-error/10">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-5 rounded-2xl bg-primary/8 text-primary text-sm font-medium font-body border border-primary/15 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl shrink-0">mark_email_read</span>
                <div>
                  <p className="font-bold mb-1">You&apos;re almost in</p>
                  <p className="text-primary/80 leading-relaxed">{success}</p>
                  <Link href="/login" className="inline-flex items-center gap-1 mt-3 font-bold underline underline-offset-2">
                    Go to Login
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-outline-variant/40 rounded-2xl hover:bg-surface-container-low hover:border-outline-variant/60 hover:shadow-md transition-all duration-200 font-body disabled:opacity-50 shadow-sm"
              >
                {googleLoading ? (
                  <span className="w-5 h-5 border-2 border-outline/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span className="font-bold text-on-surface text-sm">
                  {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                </span>
              </button>

              <div className="flex items-center my-7">
                <div className="flex-grow h-px bg-outline-variant/30" />
                <span className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 font-label">
                  or sign up with email
                </span>
                <div className="flex-grow h-px bg-outline-variant/30" />
              </div>

              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1 font-label" htmlFor="fullname">
                    Full Name
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors text-[20px]">
                      person
                    </span>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                      id="fullname"
                      name="fullname"
                      placeholder="Jane Doe"
                      type="text"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1 font-label" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors text-[20px]">
                      mail
                    </span>
                    <input
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      id="email"
                      name="email"
                      placeholder="jane@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1 font-label" htmlFor="password">
                      Password
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors text-[20px]">
                        lock
                      </span>
                      <input
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-12`}
                        id="password"
                        name="password"
                        placeholder="Min. 6 chars"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60 hover:text-primary transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1 font-label" htmlFor="confirm_password">
                      Confirm
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors text-[20px]">
                        verified_user
                      </span>
                      <input
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        id="confirm_password"
                        name="confirm_password"
                        placeholder="Repeat password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={isSubmitting || googleLoading}
                  className="w-full mt-2 py-4 px-6 signature-gradient text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 font-headline flex items-center justify-center gap-2"
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-on-surface-variant font-medium text-sm">
            Already have an account?{' '}
            <Link
              className="text-primary font-extrabold hover:underline decoration-2 underline-offset-4"
              href="/login"
            >
              Login
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] text-outline/70 leading-relaxed max-w-sm mx-auto">
            By signing up you agree to use CivicPulse in good faith to report real civic issues in your community.
          </p>
        </div>
      </main>
    </div>
  );
}
