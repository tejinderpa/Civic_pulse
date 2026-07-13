'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      setEmail(user.email || '');
      const metaName = (user.user_metadata?.full_name as string) || '';

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!cancelled) {
        setName(profile?.full_name || metaName || '');
        setRole(profile?.role || 'admin');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setMessage({ type: 'err', text: 'Name must be at least 2 characters.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (authErr) throw authErr;

      // Best-effort profiles table update
      await supabase.from('profiles').update({ full_name: trimmed }).eq('id', user.id);

      setMessage({ type: 'ok', text: 'Profile saved.' });
    } catch (e) {
      setMessage({
        type: 'err',
        text: e instanceof Error ? e.message : 'Could not save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-9 h-9 rounded-full border-4 border-slate-100 border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-400 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D2D1C] font-[var(--font-plus-jakarta)]">
          Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Your account. Nothing more.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg font-black">
            {(name || email || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{name || 'Administrator'}</p>
            <p className="text-xs font-semibold text-slate-400 capitalize">{role}</p>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setMessage(null);
            }}
            placeholder="Your name"
            className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {message && (
          <p
            className={`text-sm font-semibold rounded-xl px-3 py-2 ${
              message.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-[#0D2D1C] text-white text-sm font-bold hover:opacity-95 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
          Session
        </p>
        <button
          type="button"
          onClick={signOut}
          className="w-full h-11 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 inline-flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign out
        </button>
      </div>
    </div>
  );
}
