'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isSettingsPage = pathname === '/profile';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className={`bg-surface text-on-surface min-h-screen flex ${isSettingsPage ? 'flex-col' : ''}`}>
      {/* SideNavBar Anchor */}
      {!isSettingsPage && (
        <aside className="fixed left-0 top-0 flex flex-col p-6 h-screen w-64 border-r border-outline-variant/30 bg-surface-container-low z-50 hidden md:flex shadow-sm">
          <div className="mb-10 px-4">
            <div className="text-2xl font-bold tracking-tighter text-primary font-headline">CivicPulse</div>
            <div className="text-[10px] font-extrabold text-[#1A6B45]/60 tracking-[0.2em] font-label">THE DIGITAL COMMON</div>
          </div>
          <nav className="flex-1 space-y-2">
            <Link
              href="/feed"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/feed'
                  ? 'text-[#1A6B45] bg-white font-bold shadow-sm'
                  : 'text-emerald-800/60 hover:bg-white/50 font-medium'
              }`}
            >
              <span className="material-symbols-outlined" style={pathname === '/feed' ? { fontVariationSettings: "'FILL' 1" } : {}}>group</span>
              <span className="font-headline text-sm tracking-tight">Community Feed</span>
            </Link>
            <Link
              href="/my-reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/my-reports'
                  ? 'text-[#1A6B45] bg-white font-bold shadow-sm'
                  : 'text-emerald-800/60 hover:bg-white/50 font-medium'
              }`}
            >
              <span className="material-symbols-outlined" style={pathname === '/my-reports' ? { fontVariationSettings: "'FILL' 1" } : {}}>assignment</span>
              <span className="font-headline text-sm tracking-tight">My Reports</span>
            </Link>
            <Link
              href="/profile"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/profile'
                  ? 'text-[#1A6B45] bg-white font-bold shadow-sm'
                  : 'text-emerald-800/60 hover:bg-white/50 font-medium'
              }`}
            >
              <span className="material-symbols-outlined" style={pathname === '/profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>settings</span>
              <span className="font-headline text-sm tracking-tight">Settings</span>
            </Link>
          </nav>
          <div className="mt-auto">
            <Link href="/report" className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform active:scale-95 mb-4">
              <span className="material-symbols-outlined text-sm">add</span>
              New Report
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full py-3 border border-outline-variant/30 text-emerald-800/60 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/50 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`${!isSettingsPage ? 'md:ml-64' : 'w-full'} flex-1 flex flex-col min-h-screen relative`}>
        {/* TopNavBar Anchor */}
        {!isSettingsPage && (
          <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center w-full px-4 md:px-8 py-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-4 bg-surface-container-low rounded-full px-4 py-2 w-full max-w-md border border-outline-variant/10">
              <span className="material-symbols-outlined text-outline">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-full font-body outline-none" placeholder="Search..." type="text" />
            </div>
            <div className="flex items-center gap-4 md:gap-6 ml-4">
              <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full border-2 border-surface"></span>
              </button>
              <Link href="/profile" className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight text-on-surface">Citizen</p>
                  <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Profile</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                  C
                </div>
              </Link>
            </div>
          </header>
        )}


        {children}
      </main>
    </div>
  );
}
