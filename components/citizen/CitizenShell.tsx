'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  memo,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { loadReadIds } from '@/lib/citizen/notifications';

const NAV = [
  { href: '/feed', icon: 'grid_view', label: 'Community Feed' },
  { href: '/my-reports', icon: 'assignment', label: 'My Reports' },
  { href: '/notifications', icon: 'notifications', label: 'Alerts' },
  { href: '/profile', icon: 'person', label: 'Profile' },
] as const;

const MOBILE_NAV = [
  { href: '/feed', icon: 'grid_view', label: 'Feed' },
  { href: '/my-reports', icon: 'assignment', label: 'Reports' },
  { href: '/report', icon: 'add_circle', label: 'Report', primary: true },
  { href: '/notifications', icon: 'notifications', label: 'Alerts' },
  { href: '/profile', icon: 'person', label: 'Profile' },
] as const;

type CachedUser = {
  id: string;
  displayName: string;
  initials: string;
  email?: string;
};

const USER_CACHE_KEY = 'civicpulse_citizen_user_v1';

function readUserCache(): CachedUser | null {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedUser) : null;
  } catch {
    return null;
  }
}

function writeUserCache(u: CachedUser) {
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

const pageMeta: Record<string, { title: string; crumb: string }> = {
  '/feed': { title: 'Community Feed', crumb: 'Overview' },
  '/my-reports': { title: 'My Reports', crumb: 'Tracking' },
  '/report': { title: 'New Report', crumb: 'Submit' },
  '/notifications': { title: 'Alerts', crumb: 'Inbox' },
  '/profile': { title: 'Profile', crumb: 'Account' },
};

const NavLink = memo(function NavLink({
  href,
  icon,
  label,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
        active
          ? 'bg-white/10 text-white font-semibold shadow-sm ring-1 ring-white/10'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 font-medium'
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${active ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300'}`}
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className="flex-1 tracking-tight">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white min-w-[1.25rem] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
});

export default function CitizenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<CachedUser | null>(() =>
    typeof window !== 'undefined' ? readUserCache() : null
  );
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const routes = ['/feed', '/my-reports', '/report', '/notifications', '/profile'];
    routes.forEach((r) => {
      try {
        router.prefetch(r);
      } catch {
        /* ignore */
      }
    });
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser || cancelled) return;

        const metaName = (authUser.user_metadata?.full_name as string | undefined) || '';
        const displayName = metaName || authUser.email?.split('@')[0] || 'Citizen';
        const cached: CachedUser = {
          id: authUser.id,
          displayName,
          initials: displayName.charAt(0).toUpperCase(),
          email: authUser.email,
        };
        writeUserCache(cached);
        if (!cancelled) setUser(cached);

        // Warm shared reports cache in background (SWR for all pages)
        try {
          const { ensureReportsSynced } = await import('@/lib/cache/reports-sync');
          const { reportsCache } = await import('@/lib/cache/reports-cache');
          void ensureReportsSynced(supabase);
          const mine = reportsCache.getMine(authUser.id).slice(0, 30);
          if (cancelled) return;
          const read = loadReadIds();
          let count = 0;
          for (const r of mine) {
            if (!read.has(`created-${r.id}`)) count += 1;
            const s = (r.status || '').toLowerCase();
            if (s && s !== 'submitted' && s !== 'pending') {
              const sid = `status-${r.id}-${r.status}`;
              if (!read.has(sid)) count += 1;
            }
          }
          if (!read.has('system-welcome')) count += 1;
          setUnread(count);
        } catch {
          if (!cancelled) setUnread(0);
        }
      } catch (e) {
        console.warn('[CitizenShell] profile load soft-fail', e);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    try {
      sessionStorage.removeItem(USER_CACHE_KEY);
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
    router.push('/');
  }, [supabase, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    startTransition(() => {
      router.push(`/feed?q=${encodeURIComponent(search.trim())}`);
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/feed' && pathname.startsWith(href));

  const meta =
    pageMeta[pathname] ||
    Object.entries(pageMeta).find(([k]) => pathname.startsWith(k) && k !== '/feed')?.[1] || {
      title: 'CivicPulse',
      crumb: 'Citizen',
    };

  const SidebarBody = (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="mb-8 px-2">
        <Link href="/feed" prefetch className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
            <span
              className="material-symbols-outlined text-emerald-300 text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pulse_alert
            </span>
          </div>
          <div>
            <p className="font-headline text-base font-bold tracking-tight text-white leading-none">
              CivicPulse
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Citizen workspace
            </p>
          </div>
        </Link>
      </div>

      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
        Menu
      </p>
      <nav className="flex-1 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
            badge={item.href === '/notifications' ? unread : undefined}
            onNavigate={() => setSidebarOpen(false)}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/5 pt-5">
        <Link
          href="/report"
          prefetch
          onClick={() => setSidebarOpen(false)}
          className="dash-btn-primary w-full"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Report
        </Link>

        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-bold text-emerald-200">
              {user?.initials || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.displayName || 'Citizen'}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user?.email || 'Signed in'}</p>
            </div>
          </div>
        </div>

        <Link
          href="/admin-login"
          prefetch
          className="block text-center text-[11px] font-semibold text-slate-500 hover:text-emerald-300 transition-colors"
        >
          Authority portal →
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen app-canvas text-on-surface">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] bg-[var(--sidebar-bg)] md:flex flex-col border-r border-black/20">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--sidebar-bg)] flex flex-col transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {SidebarBody}
      </aside>

      {/* Main */}
      <div className="md:ml-[260px] min-h-screen flex flex-col pb-20 md:pb-0 relative z-[1]">
        <header className="citizen-topbar sticky top-0 z-30">
          <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 py-3 md:px-8">
            {/* Left: menu + page title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="md:hidden citizen-icon-btn flex h-10 w-10 items-center justify-center rounded-xl"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    eco
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/70">
                    {meta.crumb}
                  </p>
                  <h1 className="truncate text-base sm:text-lg font-bold font-headline text-[#0D2D1C] leading-tight">
                    {meta.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Center: search */}
            <form
              onSubmit={handleSearch}
              className="citizen-search hidden sm:flex items-center gap-2 rounded-xl px-3.5 h-11 w-full max-w-md"
            >
              <span className="material-symbols-outlined text-primary/50 text-[20px]">search</span>
              <input
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 text-[#0D2D1C]"
                placeholder="Search reports, places…"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-primary"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </form>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/report"
                prefetch
                className="hidden lg:inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white signature-gradient shadow-md shadow-emerald-900/15 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New report
              </Link>
              <Link
                href="/notifications"
                prefetch
                className="citizen-icon-btn relative flex h-10 w-10 items-center justify-center rounded-xl"
                aria-label="Alerts"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Link>
              <Link
                href="/profile"
                prefetch
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-900/20 ring-2 ring-white/80 hover:brightness-110 transition-all"
                aria-label="Profile"
              >
                {user?.initials || 'C'}
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0">{children}</div>
      </div>

      {/* Mobile bottom nav — citizen only */}
      <nav className="citizen-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-50 px-2 safe-area-pb">
        <div className="flex items-center justify-around py-1.5 max-w-lg mx-auto">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            if ('primary' in item && item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className="-mt-6 flex flex-col items-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full signature-gradient text-white shadow-xl shadow-emerald-900/30 ring-4 ring-[#e8f5ee]">
                    <span className="material-symbols-outlined text-2xl">add</span>
                  </span>
                  <span className="mt-1 text-[10px] font-black text-primary tracking-wide">
                    Report
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex min-w-[58px] flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-500 hover:text-primary/80 hover:bg-primary/5'
                }`}
              >
                <span className="relative">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {item.href === '/notifications' && unread > 0 && (
                    <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </span>
                <span className={`text-[10px] ${active ? 'font-black' : 'font-bold'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
