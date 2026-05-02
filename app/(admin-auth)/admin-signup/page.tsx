'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const ADMIN_ACCESS_CODE = 'CP-ADMIN-2026';

export default function AdminSignUpPage() {
  const supabase = createClient();
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

    if (accessCode.trim() !== ADMIN_ACCESS_CODE) {
      setError('Invalid authority access code. Contact your system administrator.');
      setIsSubmitting(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060A0D] p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              mark_email_read
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Check Your Email</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            A confirmation link was sent to{' '}
            <span className="text-emerald-400 font-bold">{email}</span>.
            Click it to activate your authority account.
          </p>
          <Link
            href="/admin-login"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-500 hover:to-emerald-600 transition-all"
          >
            <span className="material-symbols-outlined text-base">login</span>
            Proceed to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060A0D] p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d2d1c18_1px,transparent_1px),linear-gradient(to_bottom,#0d2d1c18_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-2xl shadow-emerald-500/30 mb-5">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Authority Registration</h1>
          <p className="text-emerald-400/50 text-xs font-bold uppercase tracking-[0.25em] mt-2">CivicPulse · Authorized Personnel Only</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.035] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
          <div className="mb-7">
            <h2 className="text-xl font-black text-white">Create Admin Account</h2>
            <p className="text-white/35 text-sm mt-1">Authority access code required</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-start gap-3">
              <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">gpp_bad</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                Full Name
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">badge</span>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Senior Administrator"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                Official Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">mail</span>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gov.in"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                  Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">lock</span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-confirm" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                  Confirm
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">lock_reset</span>
                  <input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setShowPassword(p => !p)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${showPassword ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-white/5 hover:border-white/40'}`}
              >
                {showPassword && (
                  <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                )}
              </div>
              <span className="text-xs text-white/35 select-none">Show passwords</span>
            </label>

            {/* Access Code */}
            <div className="space-y-2 pt-1">
              <label htmlFor="access-code" className="block text-xs font-bold uppercase tracking-widest text-white/35">
                Authority Access Code
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-xl group-focus-within:text-emerald-400 transition-colors">key</span>
                <input
                  id="access-code"
                  type="password"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Your authority access code"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 transition-all font-mono tracking-widest"
                />
              </div>
              <p className="text-white/20 text-xs ml-1">
                Contact your CivicPulse system administrator if you don't have this code.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 mt-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
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
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-white/25 text-xs">
            Already have an admin account?{' '}
            <Link href="/admin-login" className="text-emerald-400/70 font-bold hover:text-emerald-400 transition-colors">
              Sign In →
            </Link>
          </p>
          <p className="text-white/15 text-xs">
            Not an authority?{' '}
            <Link href="/signup" className="text-white/30 hover:text-white/50 transition-colors">
              Citizen Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-white/15">
          <span className="material-symbols-outlined text-sm">security</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Secured access · All sessions logged</span>
        </div>
      </main>
    </div>
  );
}
