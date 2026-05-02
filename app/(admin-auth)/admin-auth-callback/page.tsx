'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminAuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Exchange the code for a session (handled automatically by Supabase SSR)
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setErrorMsg('Authentication failed. Please try again.');
        setStatus('error');
        return;
      }

      // Check role: try user_metadata first, then profiles table
      const metaRole = user.user_metadata?.role;
      if (metaRole && ['admin', 'authority_staff'].includes(metaRole)) {
        router.push('/admin');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile && ['admin', 'authority_staff'].includes(profile.role)) {
          router.push('/admin');
          return;
        }
      } catch {
        // profiles table may not exist yet
      }

      // Not authorized — sign out and redirect with error
      await supabase.auth.signOut();
      router.push('/admin-login?error=not-authorized');
    };

    handleCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060A0D]">
      <div className="text-center">
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-white font-bold">Verifying Authority Access</p>
              <p className="text-white/30 text-sm mt-1">Checking your credentials...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-3xl">gpp_bad</span>
            </div>
            <div>
              <p className="text-white font-bold">Access Denied</p>
              <p className="text-white/40 text-sm mt-1 max-w-xs">{errorMsg}</p>
            </div>
            <a
              href="/admin-login"
              className="mt-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-500 transition-colors"
            >
              Back to Admin Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
