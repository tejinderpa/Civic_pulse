'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { loadAdminReadIds } from '@/lib/admin/notifications';

const navItems = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
  { href: '/admin/issues', icon: 'assignment', label: 'Issue Management' },
  { href: '/admin/analytics', icon: 'bar_chart', label: 'Analytics' },
  { href: '/admin/task-forces', icon: 'groups', label: 'Task Forces' },
  { href: '/admin/notifications', icon: 'notifications', label: 'Notifications' },
  { href: '/admin/settings', icon: 'settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [adminName, setAdminName] = useState('Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setAdminEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setAdminName(profile.full_name);
      }
    };
    getProfile();

    // Ops inbox unread from shared cache (instant) + background sync
    const getUnreadCount = async () => {
      try {
        const { ensureReportsSynced } = await import('@/lib/cache/reports-sync');
        const { reportsCache } = await import('@/lib/cache/reports-cache');
        await ensureReportsSynced(supabase);
        const read = loadAdminReadIds();
        const unread = reportsCache
          .getAll()
          .slice(0, 100)
          .filter((r) => !read.has(`report-${r.id}`)).length;
        setUnreadCount(unread);
      } catch {
        setUnreadCount(0);
      }
    };
    getUnreadCount();

    const channel = supabase
      .channel('admin_layout_reports_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        getUnreadCount();
      })
      .subscribe();

    const refreshBadge = () => getUnreadCount();
    window.addEventListener('focus', refreshBadge);
    window.addEventListener('civicpulse-admin-notif-read', refreshBadge);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'civicpulse_admin_notif_read_v1') refreshBadge();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', refreshBadge);
      window.removeEventListener('civicpulse-admin-notif-read', refreshBadge);
      window.removeEventListener('storage', onStorage);
    };
  }, [supabase, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const pageTitles: Record<string, { title: string; crumb: string }> = {
    '/admin': { title: 'Operations Dashboard', crumb: 'Overview' },
    '/admin/issues': { title: 'Issue Management', crumb: 'Operations' },
    '/admin/analytics': { title: 'Analytics', crumb: 'Insights' },
    '/admin/task-forces': { title: 'Task Forces', crumb: 'Dispatch' },
    '/admin/settings': { title: 'Settings', crumb: 'System' },
    '/admin/notifications': { title: 'Notifications', crumb: 'Inbox' },
  };
  const page = pageTitles[pathname] || { title: 'Admin', crumb: 'Authority' };

  const SidebarBody = (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="mb-8 px-2">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
            <span
              className="material-symbols-outlined text-emerald-300 text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <div>
            <p className="font-headline text-base font-bold tracking-tight text-white leading-none">
              CivicPulse
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Authority console
            </p>
          </div>
        </Link>
        <Link
          href="/feed"
          className="mt-4 inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-slate-500 hover:text-emerald-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Citizen app
        </Link>
      </div>

      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
        Operations
      </p>
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? 'bg-white/10 text-white font-semibold shadow-sm ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 font-medium'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  active ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300'
                }`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="flex-1 tracking-tight">{item.label}</span>
              {item.href === '/admin/notifications' && unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white min-w-[1.25rem] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/5 pt-5">
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-bold text-emerald-200">
              {adminName[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{adminName}</p>
              <p className="truncate text-[11px] text-slate-500">
                {adminEmail || 'Ops supervisor'}
              </p>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen app-canvas text-on-surface overflow-x-hidden">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] bg-[var(--sidebar-bg)] lg:flex flex-col border-r border-black/20">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--sidebar-bg)] flex flex-col transition-transform duration-300 lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {SidebarBody}
      </aside>

      <div className="lg:ml-[260px] min-h-screen flex flex-col relative z-[1]">
        <header className="authority-topbar sticky top-0 z-30">
          <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden authority-icon-btn flex h-10 w-10 items-center justify-center rounded-xl"
                onClick={() => setIsSidebarOpen(true)}
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
                    shield
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/70">
                    {page.crumb}
                  </p>
                  <h2 className="truncate text-base sm:text-lg font-bold font-headline text-[#0D2D1C] leading-tight">
                    {page.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="authority-live-pill hidden sm:flex items-center gap-2 rounded-xl px-3 h-10">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-primary/80">
                  Live ops
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push('/admin/notifications')}
                className="authority-icon-btn relative flex h-10 w-10 items-center justify-center rounded-xl"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/settings')}
                className="authority-icon-btn flex h-10 w-10 items-center justify-center rounded-xl"
                aria-label="Settings"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
              <div
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-900/20 ring-2 ring-white/80"
                title={adminName}
              >
                {adminName[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 lg:px-8 lg:py-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
