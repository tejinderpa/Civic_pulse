'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { IssueCard, IssueCardProps } from '../ui/IssueCard';
import { createClient } from '@/lib/supabase/client';
import { useReveal } from './useReveal';
import { normalizeReportRow } from '@/lib/reports/columns';

const SAMPLE_ISSUES: IssueCardProps[] = [
  {
    id: 'sample-1',
    category: 'Road',
    status: 'In Progress',
    title: 'Hazardous pothole expanding on 5th Avenue',
    location: 'Downtown Main St.',
    upvotes: 142,
    imageUrl:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
    timeAgo: 'Sample',
  },
  {
    id: 'sample-2',
    category: 'Garbage',
    status: 'Submitted',
    title: 'Uncollected waste bins on Main & Elm',
    location: 'Central Park Overflow',
    upvotes: 89,
    imageUrl:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
    timeAgo: 'Sample',
  },
  {
    id: 'sample-3',
    category: 'Water',
    status: 'Resolved',
    title: 'Burst pipe flooding local playground',
    location: 'Riverside Drive',
    upvotes: 256,
    imageUrl:
      'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=400',
    timeAgo: 'Sample',
  },
  {
    id: 'sample-4',
    category: 'Electricity',
    status: 'Under Review',
    title: 'Flickering street lights on Maple corridor',
    location: 'North District',
    upvotes: 64,
    imageUrl:
      'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&q=80&w=400',
    timeAgo: 'Sample',
  },
];

export const FeaturedIssues = () => {
  const [issues, setIssues] = useState<IssueCardProps[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [paused, setPaused] = useState(false);
  const supabase = createClient();
  const header = useReveal<HTMLDivElement>();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, category, status, location, image_url, created_at, severity')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        setIssues(
          data.map((raw) => {
            const r = normalizeReportRow(raw as Record<string, unknown>);
            return {
              id: String(r.id),
              title: String(r.title || ''),
              category: String(r.category || 'Other'),
              status: String(r.status || 'Submitted'),
              location: (r.location as string) || undefined,
              image_url: (r.image_url as string) || undefined,
              upvotes: typeof r.upvotes === 'number' ? r.upvotes : 0,
              timeAgo: r.created_at
                ? new Date(String(r.created_at)).toLocaleDateString()
                : '',
              href: `/issues/${r.id}`,
            };
          })
        );
        setIsSample(false);
      } else {
        setIssues(SAMPLE_ISSUES);
        setIsSample(true);
      }
    };
    load();
  }, [supabase]);

  // Duplicate for seamless loop (need enough cards)
  const base = issues.length > 0 ? issues : SAMPLE_ISSUES;
  const strip =
    base.length < 4 ? [...base, ...base, ...base] : [...base, ...base];

  return (
    <section className="py-20 md:py-24 bg-[var(--surface)] border-y border-[var(--outline-variant)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div
          ref={header.ref}
          className={`${header.className} flex flex-col md:flex-row md:items-end justify-between gap-4`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
              From the field
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface font-headline">
              Recent reports from your city
            </h2>
            <p className="mt-3 text-lg text-on-surface-variant">
              Auto-scrolling community signals — hover to pause.
              {isSample && (
                <span className="block text-sm mt-1 text-outline">
                  Sample cards until live data appears.
                </span>
              )}
            </p>
          </div>
          <Link href="/community" className="dash-btn-secondary shrink-0">
            View all
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-20 z-10 bg-gradient-to-r from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-20 z-10 bg-gradient-to-l from-[var(--surface)] to-transparent" />

        <div
          className="flex w-max gap-5 px-4 md:px-8"
          style={{
            animation: 'landing-marquee 45s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {strip.map((issue, i) => (
            <div
              key={`${issue.id}-${i}`}
              className="w-[280px] sm:w-[300px] shrink-0"
            >
              <IssueCard
                {...issue}
                href={
                  String(issue.id).startsWith('sample-')
                    ? '/community'
                    : `/issues/${issue.id}`
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
