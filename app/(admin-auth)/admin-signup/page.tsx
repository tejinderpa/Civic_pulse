'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminSignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, accessCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white/[0.07] transition-all';

  if (success) {
    return (
      <div className="min-h-screen flex bg-[#060A0D] text-white font-body">
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
          <div className="relative z-10 my-auto">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight">
              You&apos;re cleared for access.
            </h2>
            <p className="mt-4 text-emerald-50/80 text-lg max-w-md">
              Your authority account is ready. Sign in to start managing civic operations.
            </p>
          </div>
        </aside>

        <main className="flex-1 flex items-center justify-center p-6 relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d2d1c18_1px,transparent_1px),linear-gradient(to_bottom,#0d2d1c18_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-emerald-500/10 blur-[100px] rounded-full" />
          </div>
          <div className="relative z-10 text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Account Created</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Your authority account for{' '}
              <span className="text-emerald-400 font-bold">{email}</span> is ready. Sign in to continue.
            </p>
            <Link
              href="/admin-login"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-bold hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Proceed to Admin Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
                admin_panel_settings
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
              Access code required
            </span>
          </div>
          <h2 className="font-headline text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
            Register as
            <br />
            <span className="text-emerald-200">authority staff.</span>
            <br />
            Lead the response.
          </h2>
          <p className="mt-6 text-emerald-50/80 text-base xl:text-lg leading-relaxed font-medium max-w-md">
            Create a secured operations account to manage civic reports, task forces, and resolution workflows for your city.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: 'key', label: 'Server-verified access code' },
              { icon: 'shield_person', label: 'Admin & staff role assignment' },
              { icon: 'dashboard', label: 'Full operations console access' },
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
          <span>Authorized personnel only</span>
          <span className="w-1 h-1 rounded-full bg-emerald-200/40" />
          <span>Built for civic operations</span>
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
                admin_panel_settings
              </span>
            </div>
            <div>
              <span className="text-xl font-extrabold font-headline tracking-tight text-white block leading-none">CivicPulse</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/60">Authority</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-white tracking-tight">
              Create Admin Account
            </h1>
            <p className="text-white/40 mt-2 font-medium">
              Authority access code required (verified server-side)
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-body flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0">gpp_bad</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="signup-name" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                Full Name
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                  badge
                </span>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Senior Administrator"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                Official Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                  mail
                </span>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gov.in"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                  Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                    lock
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-confirm" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                  Confirm
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                    lock_reset
                  </span>
                  <input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setShowPassword((p) => !p)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                  showPassword ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
              >
                {showPassword && (
                  <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                )}
              </div>
              <span className="text-xs text-white/35 select-none">Show passwords</span>
            </label>

            <div className="space-y-1.5 pt-1">
              <label htmlFor="access-code" className="block text-[11px] font-bold uppercase tracking-wider text-white/35 px-1 font-label">
                Authority Access Code
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-[20px] group-focus-within:text-emerald-400 transition-colors">
                  key
                </span>
                <input
                  id="access-code"
                  type="password"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Your authority access code"
                  className={`${inputClass} font-mono tracking-widest`}
                />
              </div>
              <p className="text-white/20 text-xs ml-1">
                Contact your CivicPulse system administrator if you don&apos;t have this code.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 mt-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 font-headline"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Register as Authority
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-white/35 text-sm font-medium">
              Already have an admin account?{' '}
              <Link href="/admin-login" className="text-emerald-400 font-extrabold hover:underline decoration-2 underline-offset-4">
                Sign In →
              </Link>
            </p>
            <p className="text-white/20 text-xs">
              Not an authority?{' '}
              <Link href="/signup" className="text-white/40 hover:text-white/60 transition-colors font-semibold">
                Citizen Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
