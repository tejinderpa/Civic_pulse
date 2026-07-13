'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HERO_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=900',
    alt: 'City street at golden hour',
  },
  {
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=700',
    alt: 'Urban skyline',
  },
  {
    src: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600',
    alt: 'Road infrastructure',
  },
  {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600',
    alt: 'Green community park',
  },
];

const LIVE_CARDS = [
  {
    label: 'Pothole',
    status: 'In Progress',
    color: 'bg-orange-500',
    delay: '0s',
    pos: 'top-[8%] -left-2 md:-left-6',
  },
  {
    label: 'Street light',
    status: 'Submitted',
    color: 'bg-amber-400',
    delay: '0.6s',
    pos: 'bottom-[18%] -right-2 md:-right-8',
  },
  {
    label: 'Waste pile',
    status: 'Resolved',
    color: 'bg-emerald-500',
    delay: '1.2s',
    pos: 'top-[42%] -right-4 md:-right-10',
  },
];

const PINS = [
  { top: '22%', left: '28%', color: '#F97316', delay: '0s' },
  { top: '38%', left: '62%', color: '#22C55E', delay: '0.4s' },
  { top: '58%', left: '40%', color: '#3B82F6', delay: '0.8s' },
  { top: '48%', left: '78%', color: '#EAB308', delay: '1.1s' },
];

export const HeroSection = () => {
  const [mounted, setMounted] = useState(false);
  const [liveCount, setLiveCount] = useState(1284);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => {
      setLiveCount((n) => n + (Math.random() > 0.55 ? 1 : 0));
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[var(--surface)] pt-6 pb-12 lg:pt-10 lg:pb-16">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-400/20 blur-[100px] animate-landing-glow" />
        <div className="absolute top-1/3 -right-20 h-[380px] w-[380px] rounded-full bg-lime-300/15 blur-[90px] animate-landing-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-0 left-1/3 h-[280px] w-[280px] rounded-full bg-primary/10 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0f6b45 1px, transparent 1px), linear-gradient(to bottom, #0f6b45 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Copy */}
          <div
            className={`flex-1 text-center lg:text-left transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                Live · {liveCount.toLocaleString()} civic signals today
              </span>
            </div>

            <h1 className="font-headline text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight text-on-surface">
              Report it.
              <br />
              <span className="landing-shimmer-text">Track it.</span>
              <br />
              Fix it.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-on-surface-variant max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              AI-powered civic reporting that turns neighborhood photos into action —
              prioritized, routed, and resolved with your community watching.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/report"
                className="dash-btn-primary !px-8 !py-4 !text-base !rounded-2xl shadow-xl shadow-emerald-900/20"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                Report an issue
              </Link>
              <Link
                href="/community"
                className="dash-btn-secondary !px-8 !py-4 !text-base !rounded-2xl bg-white/80 backdrop-blur"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                Explore the map
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-on-surface-variant">
              {[
                { icon: 'bolt', label: 'AI routing' },
                { icon: 'hub', label: 'Duplicate merge' },
                { icon: 'verified', label: 'Live progress' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[var(--outline-variant)] text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Visual collage */}
          <div
            className={`flex-1 w-full max-w-xl lg:max-w-none transition-all duration-1000 delay-150 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="relative mx-auto aspect-square max-w-[540px]">
              {/* Main photo */}
              <div className="absolute inset-[8%] rounded-[28px] overflow-hidden shadow-2xl shadow-emerald-900/20 ring-1 ring-white/60 animate-landing-float-slow">
                <Image
                  src={HERO_PHOTOS[0].src}
                  alt={HERO_PHOTOS[0].alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 520px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f17]/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="rounded-xl bg-white/15 backdrop-blur-md border border-white/25 px-3 py-2 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      City pulse
                    </p>
                    <p className="text-sm font-bold">Neighborhood map active</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                  </div>
                </div>

                {/* Live pins on photo */}
                {PINS.map((pin, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ top: pin.top, left: pin.left, animationDelay: pin.delay }}
                  >
                    <span
                      className="absolute -inset-2 rounded-full opacity-40"
                      style={{
                        backgroundColor: pin.color,
                        animation: 'landing-pulse-ring 2s ease-out infinite',
                        animationDelay: pin.delay,
                      }}
                    />
                    <span
                      className="relative block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-lg animate-landing-pin"
                      style={{ backgroundColor: pin.color, animationDelay: pin.delay }}
                    />
                  </div>
                ))}
              </div>

              {/* Secondary stacked photos */}
              <div className="absolute top-[4%] right-[2%] w-[34%] aspect-[4/5] rounded-2xl overflow-hidden shadow-xl ring-2 ring-white rotate-3 animate-landing-float">
                <Image
                  src={HERO_PHOTOS[1].src}
                  alt={HERO_PHOTOS[1].alt}
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </div>
              <div
                className="absolute bottom-[6%] left-[0%] w-[30%] aspect-square rounded-2xl overflow-hidden shadow-xl ring-2 ring-white -rotate-6 animate-landing-float"
                style={{ animationDelay: '1s' }}
              >
                <Image
                  src={HERO_PHOTOS[2].src}
                  alt={HERO_PHOTOS[2].alt}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div
                className="absolute bottom-[12%] right-[4%] w-[28%] aspect-[5/4] rounded-2xl overflow-hidden shadow-xl ring-2 ring-white rotate-2 animate-landing-float-slow"
                style={{ animationDelay: '0.5s' }}
              >
                <Image
                  src={HERO_PHOTOS[3].src}
                  alt={HERO_PHOTOS[3].alt}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
              </div>

              {/* Floating live report chips */}
              {LIVE_CARDS.map((card) => (
                <div
                  key={card.label}
                  className={`absolute ${card.pos} z-20 animate-landing-float`}
                  style={{ animationDelay: card.delay }}
                >
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur border border-black/[0.06] px-3 py-2.5 shadow-xl shadow-black/10">
                    <span className={`h-2.5 w-2.5 rounded-full ${card.color} animate-pulse`} />
                    <div>
                      <p className="text-xs font-bold text-on-surface leading-none">{card.label}</p>
                      <p className="text-[10px] font-semibold text-on-surface-variant mt-1">
                        {card.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
