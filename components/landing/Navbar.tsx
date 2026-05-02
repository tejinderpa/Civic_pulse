'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [signupOpen, setSignupOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close dropdown on outside click
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
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* ── Logo pill ──────────────────────────────── */}
          <div className="flex-shrink-0 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm shadow-black/5 rounded-2xl px-5 py-2.5">
            <Link
              href="/"
              className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-[#1A6B45] tracking-tight whitespace-nowrap"
            >
              CivicPulse
            </Link>
          </div>

          {/* ── Center nav pill ────────────────────────── */}
          <div className="hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm shadow-black/5 rounded-2xl px-3 py-2">
            <Link
              href="/community"
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#1A6B45] hover:bg-[#1A6B45]/8 rounded-xl transition-all duration-150"
            >
              Community
            </Link>
            <Link
              href="#how-it-works"
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#1A6B45] hover:bg-[#1A6B45]/8 rounded-xl transition-all duration-150"
            >
              How It Works
            </Link>
            <Link
              href="#about"
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#1A6B45] hover:bg-[#1A6B45]/8 rounded-xl transition-all duration-150"
            >
              About
            </Link>
            {user && (
              <Link
                href="/my-reports"
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#1A6B45] hover:bg-[#1A6B45]/8 rounded-xl transition-all duration-150"
              >
                My Reports
              </Link>
            )}
          </div>

          {/* ── Right actions pill ─────────────────────── */}
          <div className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm shadow-black/5 rounded-2xl px-3 py-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            ) : (
              <>
                {/* Citizen Login */}
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-bold text-[#1A6B45] hover:bg-[#1A6B45]/8 rounded-xl transition-all duration-150 flex items-center gap-1.5 border border-[#1A6B45]/25 hover:border-[#1A6B45]/50"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Citizen Login
                </Link>

                {/* Separator */}
                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Authority Login */}
                <Link
                  href="/admin-login"
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#080C10] hover:bg-[#080C10]/6 rounded-xl transition-all duration-150 flex items-center gap-1.5 border border-gray-200 hover:border-gray-400"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                  Authority
                </Link>

                {/* Separator */}
                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Sign Up dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSignupOpen(prev => !prev)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1A6B45] to-[#145336] text-white text-sm font-bold rounded-xl hover:from-[#145336] hover:to-[#0f3d28] transition-all duration-150 shadow-md shadow-[#1A6B45]/20 focus:outline-none focus:ring-2 focus:ring-[#1A6B45]/40 focus:ring-offset-1"
                  >
                    Sign Up
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${signupOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Panel */}
                  {signupOpen && (
                    <div className="absolute right-0 top-full mt-3 w-80 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/10 border border-white/80 overflow-hidden z-50">

                      {/* Citizen Option */}
                      <Link
                        href="/signup"
                        onClick={() => setSignupOpen(false)}
                        className="flex items-start gap-4 p-5 hover:bg-[#F0F9F4] transition-all duration-150 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#1A6B45]/10 border border-[#1A6B45]/15 flex items-center justify-center shrink-0 group-hover:bg-[#1A6B45] group-hover:border-[#1A6B45] transition-all duration-150">
                          <span className="material-symbols-outlined text-[#1A6B45] group-hover:text-white transition-colors text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            person
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">Sign up as Citizen</p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Report issues, track progress, and engage with your community.</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-[#1A6B45] group-hover:translate-x-0.5 text-lg transition-all duration-150 mt-0.5">chevron_right</span>
                      </Link>

                      {/* Divider */}
                      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                      {/* Authority Option — same structure, different color */}
                      <Link
                        href="/admin-signup"
                        onClick={() => setSignupOpen(false)}
                        className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-all duration-150 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 group-hover:bg-[#080C10] group-hover:border-[#080C10] transition-all duration-150">
                          <span className="material-symbols-outlined text-gray-500 group-hover:text-emerald-400 text-xl transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>
                            admin_panel_settings
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            Sign up as Authority
                            <span className="text-[9px] font-black bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Official</span>
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Manage & resolve civic issues. Access code required.</p>
                          <p className="text-gray-400 text-[10px] mt-1 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">key</span>
                            Requires authority access code
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 text-lg transition-all duration-150 mt-0.5">chevron_right</span>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-2.5">
            <button className="text-gray-700 hover:text-[#1A6B45] focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
