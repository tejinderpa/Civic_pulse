'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [signupOpen, setSignupOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSignupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-[2000] isolate border-b border-black/[0.06] bg-[var(--surface,#F3F5F7)]/95 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--surface,#F3F5F7)]/85 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-shrink-0 bg-white border border-black/[0.06] shadow-sm rounded-2xl px-5 py-2.5">
            <Link
              href="/"
              className="font-headline font-extrabold text-xl text-primary tracking-tight whitespace-nowrap"
            >
              CivicPulse
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white border border-black/[0.06] shadow-sm rounded-2xl px-3 py-2">
            <Link
              href="/community"
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/8 rounded-xl transition-all"
            >
              Community
            </Link>
            <Link
              href="/#how-it-works"
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/8 rounded-xl transition-all"
            >
              How It Works
            </Link>
            <Link
              href="/#about"
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/8 rounded-xl transition-all"
            >
              About
            </Link>
            {user && (
              <Link
                href="/feed"
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/8 rounded-xl transition-all"
              >
                Feed
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 bg-white border border-black/[0.06] shadow-sm rounded-2xl px-3 py-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/8 rounded-xl transition-all flex items-center gap-1.5 border border-primary/25"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Citizen Login
                </Link>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <Link
                  href="/admin-login"
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-on-surface hover:bg-on-surface/5 rounded-xl transition-all flex items-center gap-1.5 border border-gray-200"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shield
                  </span>
                  Authority
                </Link>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSignupOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-4 py-2 signature-gradient text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20"
                  >
                    Sign Up
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${signupOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {signupOpen && (
                    <div className="absolute right-0 top-full mt-3 w-80 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 overflow-hidden z-50">
                      <Link
                        href="/signup"
                        onClick={() => setSignupOpen(false)}
                        className="flex items-start gap-4 p-5 hover:bg-primary/5 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Sign up as Citizen</p>
                          <p className="text-gray-500 text-xs mt-0.5">Report issues and track progress.</p>
                        </div>
                      </Link>
                      <div className="mx-5 h-px bg-gray-200" />
                      <Link
                        href="/admin-signup"
                        onClick={() => setSignupOpen(false)}
                        className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-gray-500">admin_panel_settings</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Sign up as Authority</p>
                          <p className="text-gray-500 text-xs mt-0.5">Access code required (server-verified).</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center bg-white border border-black/[0.06] shadow-sm rounded-2xl p-2.5">
            <button
              type="button"
              aria-label="Open menu"
              className="text-gray-700 hover:text-primary focus:outline-none"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-3 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl p-4 space-y-2">
            <Link href="/community" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-semibold text-on-surface hover:bg-primary/5">
              Community
            </Link>
            <Link href="/#how-it-works" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-semibold text-on-surface hover:bg-primary/5">
              How It Works
            </Link>
            {user ? (
              <>
                <Link href="/feed" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-semibold text-on-surface hover:bg-primary/5">
                  Feed
                </Link>
                <Link href="/report" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-semibold text-primary hover:bg-primary/5">
                  New Report
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-semibold text-error hover:bg-error/5">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-bold text-primary hover:bg-primary/5">
                  Citizen Login
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-bold text-primary hover:bg-primary/5">
                  Citizen Sign Up
                </Link>
                <Link href="/admin-login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl font-semibold text-on-surface hover:bg-surface-container-low">
                  Authority Login
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
