'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { IssueCard } from '@/components/ui/IssueCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { DashStat } from '@/components/dashboard/DashStat';
import { SegmentedControl } from '@/components/dashboard/SegmentedControl';
import { patchReportLocal } from '@/hooks/useCachedReports';
import { useFeedQuery } from '@/hooks/useFeedQuery';
import type { StatusGroup, ReportSort } from '@/lib/reports/filters';

const CommunityMap = dynamic(() => import('@/components/CommunityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] bg-surface-container-low animate-pulse rounded-2xl" />
  ),
});

const CATEGORIES = ['All', 'Road', 'Garbage', 'Water', 'Electricity', 'Environment', 'Other'] as const;

export default function CommunityFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
        </div>
      }
    >
      <CommunityFeedInner />
    </Suspense>
  );
}

function CommunityFeedInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'card' | 'map'>('card');
  const [sort, setSort] = useState<ReportSort>('recent');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all');
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [userCenter, setUserCenter] = useState<[number, number] | undefined>(undefined);

  const {
    reports,
    loading,
    isValidating,
    error,
    hasMore,
    counts,
    loadMore,
    reload,
    patchLocal,
  } = useFeedQuery({
    statusGroup,
    category,
    q: search,
    sort,
    pageSize: 24,
  });

  // Sync ?q= from shell search into local state (debounced fetch via hook)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setSearch(q);
  }, [searchParams]);

  // Keep URL in sync when user types search (shareable filters)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusGroup !== 'all') params.set('status', statusGroup);
      if (category !== 'All') params.set('category', category);
      if (sort !== 'recent') params.set('sort', sort);
      const qs = params.toString();
      const next = qs ? `/feed?${qs}` : '/feed';
      const cur =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/feed';
      if (cur !== next) router.replace(next, { scroll: false });
    }, 400);
    return () => clearTimeout(t);
  }, [search, statusGroup, category, sort, router]);

  // Hydrate filters from URL on first paint
  useEffect(() => {
    const st = searchParams.get('status');
    if (st === 'open' || st === 'in_progress' || st === 'resolved') setStatusGroup(st);
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
    const so = searchParams.get('sort');
    if (so === 'votes' || so === 'priority' || so === 'recent') setSort(so as ReportSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.user_metadata?.location || cancelled) return;
      try {
        const res = await fetch(
          `/api/maps/search?q=${encodeURIComponent(user.user_metadata.location)}`
        );
        const data = await res.json();
        const first = Array.isArray(data) ? data[0] : null;
        if (first?.lat && first?.lon && !cancelled) {
          setUserCenter([parseFloat(first.lat), parseFloat(first.lon)]);
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const toggleStatus = useCallback((key: StatusGroup) => {
    setStatusGroup((prev) => (prev === key && key !== 'all' ? 'all' : key));
  }, []);

  async function handleVote(id: string) {
    if (String(id).startsWith('mock-') || String(id).startsWith('demo-')) return;

    const current = reports.find((i) => i.id === id);
    const prev = (current?.upvotes as number) || 0;
    // Optimistic
    patchLocal(id, { upvotes: prev + 1 });
    patchReportLocal(id, { upvotes: prev + 1 });

    try {
      const res = await fetch(`/api/issues/${id}/vote`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (res.ok && typeof body.upvotes === 'number') {
        const patch: Record<string, unknown> = {
          upvotes: body.upvotes,
          votes_count: body.upvotes,
        };
        if (body.severity) patch.severity = body.severity;
        if (typeof body.priority_score === 'number') {
          patch.priority_score = body.priority_score;
          patch.ai_score = body.priority_score;
        }
        patchLocal(id, patch);
        patchReportLocal(id, patch);
      } else {
        // Already voted or error — restore server count (never keep optimistic +1)
        const serverCount =
          typeof body.upvotes === 'number' ? body.upvotes : Math.max(0, prev);
        patchLocal(id, { upvotes: serverCount, votes_count: serverCount });
        patchReportLocal(id, { upvotes: serverCount, votes_count: serverCount });
        if (body.code === 'ALREADY_VOTED') {
          // silent — one vote per user
        } else if (!res.ok) {
          console.warn('Vote failed:', body.error || res.status);
        }
      }
    } catch {
      patchLocal(id, { upvotes: Math.max(0, prev), votes_count: Math.max(0, prev) });
      patchReportLocal(id, { upvotes: Math.max(0, prev) });
    }
  }

  const clearFilters = () => {
    setStatusGroup('all');
    setCategory('All');
    setSearch('');
    setSort('recent');
    router.replace('/feed');
  };

  const hasActiveFilters =
    statusGroup !== 'all' || category !== 'All' || search.trim().length > 0 || sort !== 'recent';

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto dash-scroll">
      <PageHeader
        title="Community Feed"
        hideTitle
        subtitle={
          isValidating
            ? 'Updating results from server…'
            : 'Filters run on the server. Tap a status card or category to query the database.'
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => reload()}
              className="dash-btn-ghost !text-xs"
              title="Refresh"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${isValidating ? 'animate-spin' : ''}`}
              >
                refresh
              </span>
            </button>
            <SegmentedControl
              value={viewMode}
              onChange={(v) => setViewMode(v)}
              options={[
                { value: 'card' as const, label: 'Gallery', icon: 'grid_view' },
                { value: 'map' as const, label: 'Map', icon: 'map' },
              ]}
            />
          </div>
        }
      />

      {/* Server-backed counts + filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        <DashStat
          label="All reports"
          value={counts.total}
          icon="inventory_2"
          tone="primary"
          onClick={() => setStatusGroup('all')}
          active={statusGroup === 'all'}
          hint="Show all"
        />
        <DashStat
          label="Open"
          value={counts.open}
          icon="pending_actions"
          tone="warning"
          onClick={() => toggleStatus('open')}
          active={statusGroup === 'open'}
          hint="Submitted"
        />
        <DashStat
          label="In progress"
          value={counts.in_progress}
          icon="engineering"
          tone="info"
          onClick={() => toggleStatus('in_progress')}
          active={statusGroup === 'in_progress'}
          hint="Review & active"
        />
        <DashStat
          label="Resolved"
          value={counts.resolved}
          icon="task_alt"
          tone="primary"
          onClick={() => toggleStatus('resolved')}
          active={statusGroup === 'resolved'}
          hint="Closed"
        />
      </div>

      <div className="dash-card mb-5 !p-3 sm:!p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, place, description (server)…"
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-low border border-transparent text-sm font-medium outline-none focus:bg-white focus:border-primary/25 focus:ring-4 focus:ring-primary/10"
              aria-label="Search reports"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200/60"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant shrink-0">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ReportSort)}
              className="h-11 rounded-xl border border-[var(--outline-variant)] bg-white px-3 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="recent">Most recent</option>
              <option value="votes">Highest priority</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
            Category
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                category === cat
                  ? 'bg-[#0D2D1C] text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-white hover:text-on-surface border border-transparent hover:border-[var(--outline-variant)]'
              }`}
            >
              {cat}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              Clear filters
            </button>
          )}
        </div>

        <p className="text-xs font-medium text-on-surface-variant">
          <span className="font-bold text-on-surface">{reports.length}</span> loaded
          {hasMore ? ' · more available' : ''}
          {isValidating ? ' · querying server…' : ' · from API'}
          {statusGroup !== 'all' ? ` · status: ${statusGroup}` : ''}
          {category !== 'All' ? ` · ${category}` : ''}
          {search.trim() ? ` · “${search.trim()}”` : ''}
        </p>
      </div>

      {error && !reports.length && <ErrorState message={error} onRetry={() => reload()} />}

      {loading && reports.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[320px] bg-white border border-[var(--outline-variant)] animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : viewMode === 'map' ? (
        <div className="dash-card !p-2 w-full h-[620px] overflow-hidden">
          {reports.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon="map"
                title="No reports on the map"
                description="Try another status or category — filters are applied on the server."
              />
            </div>
          ) : (
            <CommunityMap items={reports as never[]} center={userCenter} onVote={handleVote} />
          )}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? 'filter_alt_off' : 'campaign'}
          title={hasActiveFilters ? 'No reports match your filters' : 'No community reports yet'}
          description={
            hasActiveFilters
              ? 'Clear filters or pick another status. Query ran against the database.'
              : 'Be the first to report an issue in your neighborhood.'
          }
          actionLabel={hasActiveFilters ? 'Clear filters' : 'New Report'}
          actionHref={hasActiveFilters ? undefined : '/report'}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {reports.map((issue) => (
              <IssueCard
                key={issue.id}
                id={issue.id}
                title={issue.title}
                description={issue.description || undefined}
                category={issue.category || 'Other'}
                status={issue.status}
                location={issue.location}
                image_url={issue.image_url}
                upvotes={issue.upvotes}
                created_at={issue.created_at}
                duplicate_of={issue.duplicate_of}
                onVote={handleVote}
                href={`/issues/${issue.id}`}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                disabled={isValidating}
                onClick={() => loadMore()}
                className="dash-btn-secondary disabled:opacity-50"
              >
                {isValidating ? 'Loading…' : 'Load more from server'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
