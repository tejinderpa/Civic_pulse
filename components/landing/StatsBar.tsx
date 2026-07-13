'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const AnimatedCounter = ({
  end,
  duration = 1800,
  suffix = '',
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-headline font-extrabold text-white tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

export const StatsBar = () => {
  const [stats, setStats] = useState({ total: 12400, resolved: 3200, open: 180 });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('reports').select('id, status').limit(500);
        if (data && data.length > 0) {
          const resolved = data.filter((r) =>
            ['resolved', 'closed', 'done'].includes((r.status || '').toLowerCase())
          ).length;
          setStats({
            total: Math.max(data.length, 1),
            resolved,
            open: data.length - resolved,
          });
        }
      } catch {
        /* keep defaults */
      }
    };
    load();
  }, []);

  const cards = [
    { icon: 'campaign', end: stats.total, suffix: '+', label: 'Issues reported', sub: 'Across the network' },
    { icon: 'task_alt', end: stats.resolved, suffix: '', label: 'Resolved', sub: 'Closed with impact' },
    { icon: 'pending_actions', end: stats.open, suffix: '', label: 'Open signals', sub: 'Being tracked now' },
    { icon: 'location_city', end: 8, suffix: '', label: 'Cities active', sub: 'Growing every week' },
  ];

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1600')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1f17]/95 via-[#0f6b45]/88 to-[#0b1f17]/92" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/80 mb-2">
            Impact in motion
          </p>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-white">
            Numbers that move with your city
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-6 text-center hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-emerald-300 text-2xl mb-3">
                {c.icon}
              </span>
              <AnimatedCounter end={c.end} suffix={c.suffix} />
              <p className="mt-2 text-sm font-bold text-white">{c.label}</p>
              <p className="text-[11px] text-emerald-100/60 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
