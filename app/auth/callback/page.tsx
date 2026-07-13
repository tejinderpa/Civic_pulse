'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AUTH_NEXT_KEY } from '@/lib/auth/google';
import { safeNextPath } from '@/lib/auth/site-url';
import Link from 'next/link';

/**
 * Client-side OAuth callback.
 * Exchanges ?code= for a session in the browser so the PKCE code_verifier cookie is available.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient();
        const url = new URL(window.location.href);

        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const error =
          url.searchParams.get('error') ||
          url.searchParams.get('error_description') ||
          hash.get('error') ||
          hash.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(decodeURIComponent(error.replace(/\+/g, ' ')));
          return;
        }

        const code = url.searchParams.get('code');
        let next = '/feed';
        try {
          next = safeNextPath(sessionStorage.getItem(AUTH_NEXT_KEY), '/feed');
          sessionStorage.removeItem(AUTH_NEXT_KEY);
        } catch {
          /* ignore */
        }

        const nextParam = url.searchParams.get('next');
        if (nextParam) next = safeNextPath(nextParam, next);

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[auth/callback]', exchangeError);
            setStatus('error');
            setMessage(exchangeError.message);
            return;
          }
          router.replace(next);
          router.refresh();
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace(next);
          router.refresh();
          return;
        }

        setStatus('error');
        setMessage(
          'No auth code received. Add http://localhost:3000/auth/callback to Supabase Redirect URLs.'
        );
      } catch (err) {
        console.error('[auth/callback]', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Sign-in failed');
      }
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full text-center bg-white rounded-3xl border border-outline-variant/30 shadow-xl p-10">
        {status === 'working' ? (
          <>
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl signature-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <h1 className="font-headline font-extrabold text-xl text-primary mb-2">Signing you in</h1>
            <p className="text-on-surface-variant text-sm font-body">{message}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-3xl">error</span>
            </div>
            <h1 className="font-headline font-extrabold text-xl text-on-surface mb-2">Sign-in failed</h1>
            <p className="text-on-surface-variant text-sm font-body mb-6 break-words">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="px-5 py-3 rounded-xl signature-gradient text-white font-bold text-sm"
              >
                Back to login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-3 rounded-xl border border-outline-variant font-bold text-sm text-primary"
              >
                Sign up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
