'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setIsSubmitting(false);
    } else {
      router.push('/my-reports');
      router.refresh();
    }

  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-on-surface bg-surface">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-lg border border-outline-variant/10">
        <header className="text-center mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 signature-gradient rounded-xl flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-white text-3xl">account_balance</span>
            </div>
            <h1 className="text-2xl font-headline font-extrabold text-primary tracking-tight">CivicPulse</h1>
            <p className="text-sm font-medium text-on-surface-variant/80 tracking-wide font-body">Report it. Track it. Fix it.</p>
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-headline font-bold text-on-surface">Welcome back</h2>
            <p className="text-on-surface-variant mt-1 text-sm font-body">Join the common movement for a better city.</p>
          </div>
        </header>

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
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg font-semibold text-on-surface border border-outline-variant/20 font-body"
          >
            <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="relative my-8">
          <div aria-hidden="true" className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/30"></div>
          </div>
          <div className="relative flex justify-center text-sm uppercase tracking-widest font-bold">
            <span className="bg-surface-container-lowest px-4 text-on-surface-variant/60 text-[10px] font-label">or continue with email</span>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 font-label" htmlFor="email">Email Address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">mail</span>
              <input 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 outline-none font-body" 
                id="email" 
                name="email" 
                placeholder="jane@example.com" 
                type="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 font-label" htmlFor="password">Password</label>
              <Link className="text-xs font-bold text-primary hover:text-primary-container transition-colors" href="#">Forgot password?</Link>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">lock</span>
              <input 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-surface-container-low border-transparent rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 outline-none font-body" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                type="password"
              />
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-4 px-6 signature-gradient text-white rounded-lg font-bold text-base hover:opacity-95 active:scale-[0.98] transition-all shadow-md mt-4 disabled:opacity-50 font-headline" 
            type="submit"
          >
            {isSubmitting ? 'Logging in...' : 'Login to CivicPulse'}
          </button>
        </form>

        <footer className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant font-body">
            {"Don't have an account? "}
            <Link className="font-bold text-primary hover:underline decoration-primary/30 underline-offset-4 transition-all" href="/signup">Sign Up</Link>
          </p>
        </footer>
      </main>

      <div className="fixed bottom-8 text-xs text-on-surface-variant/50 font-medium text-center font-body hidden md:block">
        <div className="flex items-center gap-4">
          <Link className="hover:text-on-surface" href="#">Privacy Policy</Link>
          <span>•</span>
          <Link className="hover:text-on-surface" href="#">Terms of Service</Link>
          <span>•</span>
          <Link className="hover:text-on-surface" href="#">Need help?</Link>
        </div>
      </div>
    </div>
  );
}
