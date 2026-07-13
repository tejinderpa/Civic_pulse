'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useReveal } from './useReveal';

export function CtaBanner() {
  const { ref, className } = useReveal<HTMLElement>();

  return (
    <section ref={ref} className={`${className} px-4 sm:px-6 lg:px-8 pb-24 pt-4`}>
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[32px] min-h-[320px] flex items-center">
        <Image
          src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=1600"
          alt="City at dusk"
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        {/* Stronger scrim so text + buttons always read */}
        <div className="absolute inset-0 bg-[#06140f]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f17] via-[#0b1f17]/90 to-[#0f6b45]/55" />

        <div className="relative z-10 w-full px-8 md:px-14 py-14 md:py-16">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-3">
              Join the digital common
            </p>
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-white leading-tight drop-shadow-sm">
              Your next photo could fix a street.
            </h2>
            <p className="mt-4 text-emerald-50/90 text-base md:text-lg leading-relaxed">
              Report in under a minute. Track progress with your neighbors. Hold the system
              accountable.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#0f6b45] text-base font-extrabold shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.99] transition-all border-2 border-white"
              >
                Create free account
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <Link
                href="/report"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 text-[#062015] text-base font-extrabold shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                Report now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
