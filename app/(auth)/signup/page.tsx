'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
    } else {
      router.push('/login?message=Check your email to confirm your account');
    }
  };

  return (
    <div className="font-body text-on-surface min-h-screen flex items-center justify-center p-6 bg-surface">
      <main className="w-full max-w-[480px] bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-lg border border-outline-variant/10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 signature-gradient rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>pulse_alert</span>
            </div>
            <span className="text-2xl font-extrabold font-headline tracking-tight text-primary">CivicPulse</span>
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">Create your account</h1>
          <p className="text-on-surface-variant mt-2 font-medium font-body">Join the digital common and improve your neighborhood.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-xs font-bold font-body">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ 
              provider: 'google',
              options: {
                redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback`
              }
            })} 
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-all duration-200 group font-body"
          >
            <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="font-semibold text-on-surface">Continue with Google</span>
          </button>
        </div>

        <div className="flex items-center my-8">
          <div className="flex-grow h-px bg-outline-variant/20"></div>
          <span className="px-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">or sign up with email</span>
          <div className="flex-grow h-px bg-outline-variant/20"></div>
        </div>

        <form className="space-y-5" onSubmit={handleSignUp}>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-on-surface-variant px-1 font-label" htmlFor="fullname">Full Name</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">person</span>
              <input 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/50 font-body" 
                id="fullname" 
                name="fullname" 
                placeholder="Jane Doe" 
                type="text" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-on-surface-variant px-1 font-label" htmlFor="email">Email Address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">mail</span>
              <input 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/50 font-body" 
                id="email" 
                name="email" 
                placeholder="jane@example.com" 
                type="email" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-on-surface-variant px-1 font-label" htmlFor="password">Password</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">lock</span>
              <input 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/50 font-body" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                type="password" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-on-surface-variant px-1 font-label" htmlFor="confirm_password">Confirm Password</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">verified_user</span>
              <input 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/50 font-body" 
                id="confirm_password" 
                name="confirm_password" 
                placeholder="••••••••" 
                type="password" 
              />
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-4 px-6 signature-gradient text-on-primary font-bold rounded-lg shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 font-headline" 
            type="submit"
          >
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-on-surface-variant font-medium font-body">
            Already have an account?{" "}
            <Link className="text-primary font-extrabold ml-1 hover:underline decoration-2 underline-offset-4" href="/login">Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
