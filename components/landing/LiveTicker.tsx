'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type TickerItem = {
  id: string;
  text: string;
  tone: 'new' | 'progress' | 'resolved';
};

const FALLBACK: TickerItem[] = [
  { id: '1', text: 'New report · Road issue near Central Park', tone: 'new' },
  { id: '2', text: 'Authority update · Water leak marked In Progress', tone: 'progress' },
  { id: '3', text: 'Resolved · Streetlight restored on Oak Ave', tone: 'resolved' },
  { id: '4', text: 'AI merged 3 duplicate waste reports downtown', tone: 'progress' },
  { id: '5', text: 'Citizen upvote spike · Pothole on 5th Ave', tone: 'new' },
  { id: '6', text: 'Task force dispatched · Power outage zone B', tone: 'progress' },
];

const toneDot: Record<TickerItem['tone'], string> = {
  new: 'bg-sky-400',
  progress: 'bg-amber-400',
  resolved: 'bg-emerald-400',
};

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('reports')
          .select('id, title, category, status, location, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          setItems(
            data.map((r) => {
              const s = (r.status || '').toLowerCase();
              const tone: TickerItem['tone'] =
                s === 'resolved' || s === 'closed'
                  ? 'resolved'
                  : s.includes('progress') || s.includes('review')
                    ? 'progress'
                    : 'new';
              const place = r.location ? ` · ${String(r.location).slice(0, 40)}` : '';
              return {
                id: r.id,
                text: `${r.category || 'Issue'} · ${r.title || 'Community report'}${place}`,
                tone,
              };
            })
          );
        }
      } catch {
        /* keep fallback */
      }
    };
    load();
  }, []);

  const strip = [...items, ...items];

  return (
    <div className="relative border-y border-emerald-900/10 bg-[#0b1f17] text-white overflow-hidden">
      <div className="flex items-center gap-0">
        <div className="shrink-0 z-10 flex items-center gap-2 bg-emerald-500 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live feed
        </div>
        <div className="relative flex-1 overflow-hidden py-3">
          <div className="flex w-max animate-landing-ticker gap-10 whitespace-nowrap pl-6">
            {strip.map((item, i) => (
              <span key={`${item.id}-${i}`} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-50/90">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[item.tone]}`} />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
