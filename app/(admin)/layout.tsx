'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

const navItems = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
  { href: '/admin/issues', icon: 'assignment', label: 'Issue Management' },
  { href: '/admin/analytics', icon: 'bar_chart', label: 'Analytics' },
  { href: '/admin/task-forces', icon: 'groups', label: 'Task Forces' },
  { href: '/admin/settings', icon: 'settings', label: 'Settings' },
  { href: '/admin/notifications', icon: 'notifications', label: 'Notifications' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [adminName, setAdminName] = useState('Administrator');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

    const getUnreadCount = async () => {
      const { data } = await supabase.from('notifications').select('id', { count: 'exact' }).eq('is_read', false);
      setUnreadCount(data?.length || 0);
    };
    getUnreadCount();

    const channel = supabase.channel(`layout_notifications_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        getUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const pageTitle = pathname === '/admin' 
    ? 'Authority Dashboard' 
    : pathname.split('/').pop()?.replace('-', ' ') ?? 'Admin';

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)] font-['Manrope'] overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--primary)] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-[#F4A623] opacity-[0.03] blur-[100px] rounded-full"></div>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-emerald-50/80 backdrop-blur-md border-r border-emerald-900/5 shadow-xl shadow-emerald-900/5 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full px-6 py-8">
          {/* Logo Area */}
          <div className="mb-10 px-2">
            <h1 className="text-xl font-bold tracking-tighter text-emerald-950">The Digital Common</h1>
            <p className="text-xs font-medium text-emerald-800/70 tracking-tight uppercase">Civic Admin Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active 
                      ? 'bg-white text-emerald-700 font-bold shadow-sm scale-98 active:scale-95' 
                      : 'text-emerald-800/70 hover:bg-white/50 hover:text-emerald-950'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${active ? '' : 'opacity-70 group-hover:opacity-100'}`} style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {item.icon}
                  </span>
                  <span className="font-plus-jakarta text-sm font-medium tracking-tight flex-1">{item.label}</span>
                  {item.href === '/admin/notifications' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out */}
          <div className="mt-auto pt-6 border-t border-[var(--outline-variant)]">
            <div className="bg-white/40 rounded-2xl p-4 mb-4 border border-[var(--outline-variant)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-container)] text-white flex items-center justify-center font-black text-sm">
                  {adminName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{adminName}</p>
                  <p className="text-[10px] text-[var(--on-surface-variant)] font-medium">Ops Supervisor</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#762f35]/5 text-[#762f35] font-bold text-sm transition-all hover:bg-[#762f35]/10 border border-[#762f35]/10"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`lg:ml-72 min-h-screen flex flex-col transition-all duration-300`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--outline-variant)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-container-low)] text-[var(--on-surface)]"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <span className="material-symbols-outlined">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
              </button>
              <div>
                <h2 className="text-lg font-black tracking-tight font-[var(--font-plus-jakarta)] leading-none text-[var(--on-surface)] uppercase text-[12px] opacity-40 mb-1">District Overview</h2>
                <p className="text-xl font-bold text-[var(--on-surface)]">{pageTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60">System Stable</span>
              </div>
              <button 
                onClick={() => router.push('/admin/notifications')}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white"></span>
                )}
              </button>
              <button 
                onClick={() => router.push('/admin/settings')}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-6 py-8 p-4 lg:p-10 relative z-10 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* NO AUX PANELS - Replaced by discrete pages */}

    </div>
  );
}
