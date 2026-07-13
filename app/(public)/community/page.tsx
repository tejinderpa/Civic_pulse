'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navbar } from '../../../components/landing/Navbar';
import { Footer } from '../../../components/landing/Footer';
import { IssueCard } from '../../../components/ui/IssueCard';
import { FilterSidebar } from '../../../components/features/FilterSidebar';
import dynamic from 'next/dynamic';
import { FilterBottomSheet } from '../../../components/features/FilterBottomSheet';
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MOCK_ISSUES } from '../../../lib/mock-data';
import { REPORT_LIST_SELECT, normalizeReportRow } from '@/lib/reports/columns';
import {
  type CommunityCategory,
  type CommunityStatus,
  type CommunitySort,
  categoryValuesForFilter,
  statusValuesForFilter,
  matchesCategory,
  matchesStatus,
  sortIssues,
} from '@/lib/community/filters';

const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-surface-container-low animate-pulse rounded-3xl" />
  ),
});

type IssueRow = Record<string, unknown> & {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  image_url?: string;
  status?: string;
  severity?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  upvotes?: number;
  timeAgo?: string;
};

const PAGE_SIZE = 24;

export default function CommunityPage() {
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [category, setCategory] = useState<CommunityCategory>('All');
  const [status, setStatus] = useState<CommunityStatus>('All');
  const [sort, setSort] = useState<CommunitySort>('Most Recent');
  /** Text search typed by user (filters titles/locations) */
  const [searchQuery, setSearchQuery] = useState('');
  /** Map pin from landing geocode — does NOT text-filter the list */
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.326, 75.576]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const supabase = createClient();
  const observer = useRef<IntersectionObserver | null>(null);
  const router = useRouter();
  const filtersKey = `${category}|${status}|${sort}`;
  const filtersKeyRef = useRef(filtersKey);
  filtersKeyRef.current = filtersKey;

  const mapRows = (data: Record<string, unknown>[] | null | undefined): IssueRow[] =>
    (data || []).map((raw) => {
      const n = normalizeReportRow(raw);
      return {
        ...n,
        imageUrl: n.image_url,
        timeAgo: n.created_at ? new Date(String(n.created_at)).toLocaleDateString() : '',
      } as unknown as IssueRow;
    });

  const fetchIssues = useCallback(
    async (opts: { reset: boolean; pageIndex?: number }) => {
      const { reset } = opts;
      const pageIndex = opts.pageIndex ?? 0;
      const appliedKey = `${category}|${status}|${sort}`;

      setLoading(true);
      setFetchError(null);

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Safer select without optional columns that may 400
      const selectCols =
        'id, user_id, title, description, category, location, image_url, status, severity, latitude, longitude, created_at, duplicate_of';

      try {
        let query = supabase.from('reports').select(selectCols);

        const cats = categoryValuesForFilter(category);
        if (cats) query = query.in('category', cats);

        const statuses = statusValuesForFilter(status);
        if (statuses) query = query.in('status', statuses);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query.range(from, to);

        let rows: IssueRow[] = [];
        let usedClientFilter = false;

        if (error) {
          console.warn('[community] filtered fetch failed, falling back:', error.message);
          const fallback = await supabase
            .from('reports')
            .select(selectCols)
            .order('created_at', { ascending: false })
            .range(0, 199);

          if (fallback.error) throw fallback.error;

          usedClientFilter = true;
          rows = mapRows(fallback.data as Record<string, unknown>[]);
          rows = rows.filter(
            (i) => matchesCategory(i.category, category) && matchesStatus(i.status, status)
          );
          rows = sortIssues(rows, sort);
          setHasMore(false);
        } else {
          rows = mapRows(data as Record<string, unknown>[]);
          // Client-side alias match (Pending ↔ Submitted, etc.)
          rows = rows.filter(
            (i) => matchesCategory(i.category, category) && matchesStatus(i.status, status)
          );
          rows = sortIssues(rows, sort);
          setHasMore(!usedClientFilter && (data?.length || 0) === PAGE_SIZE);
        }

        if (filtersKeyRef.current !== appliedKey) return;

        if (reset) {
          setIssues(rows);
          setPage(usedClientFilter ? 0 : pageIndex + 1);
        } else {
          setIssues((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            const merged = [...prev];
            for (const r of rows) {
              if (!seen.has(r.id)) merged.push(r);
            }
            return sortIssues(merged, sort);
          });
          setPage(pageIndex + 1);
        }

        if (reset && rows.length === 0 && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
          const mock = (MOCK_ISSUES as unknown as IssueRow[]).filter(
            (i) => matchesCategory(i.category, category) && matchesStatus(i.status, status)
          );
          setIssues(sortIssues(mock, sort));
          setHasMore(false);
        }
      } catch (err: unknown) {
        console.error('[community] fetch error:', err);
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Could not load issues.';
        setFetchError(msg);
        if (reset && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
          setIssues(sortIssues(MOCK_ISSUES as unknown as IssueRow[], sort));
        }
      } finally {
        if (filtersKeyRef.current === appliedKey) setLoading(false);
      }
    },
    [supabase, category, status, sort]
  );

  // Reset + refetch whenever filters change
  useEffect(() => {
    setIssues([]);
    setPage(0);
    setHasMore(true);
    fetchIssues({ reset: true, pageIndex: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only on filter change
  }, [category, status, sort]);

  // Landing page query params (map pin / search / view)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');
    const q = params.get('q');
    const viewParam = params.get('view');
    const cat = params.get('category');
    const st = params.get('status');

    if (lat && lon) {
      setMapCenter([parseFloat(lat), parseFloat(lon)]);
      setMapZoom(15);
      // Map focus only — never dump geocode address into list text filter
    } else if (q) {
      setSearchQuery(q);
    }
    if (viewParam === 'map') setView('map');
    if (cat && ['Road', 'Garbage', 'Water', 'Electricity', 'Environment', 'Other'].includes(cat)) {
      setCategory(cat as CommunityCategory);
    }
    if (st && ['Pending', 'In Progress', 'Resolved'].includes(st)) {
      setStatus(st as CommunityStatus);
    }
  }, []);

  const lastIssueRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchIssues({ reset: false, pageIndex: page });
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchIssues, page]
  );

  const handleVote = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/login?redirect=/community`);
      return;
    }

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, upvotes: (issue.upvotes || 0) + 1 } : issue
      )
    );

    const res = await fetch(`/api/issues/${id}/vote`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (res.ok && typeof body.upvotes === 'number') {
      setIssues((prev) =>
        prev.map((issue) => (issue.id === id ? { ...issue, upvotes: body.upvotes } : issue))
      );
    } else if (!res.ok && body.code !== 'ALREADY_VOTED') {
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id
            ? { ...issue, upvotes: Math.max(0, (issue.upvotes || 1) - 1) }
            : issue
        )
      );
    }
  };

  const displayedIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = issues;
    if (q) {
      list = list.filter((issue) => {
        const hay = [
          issue.title,
          issue.description,
          issue.location,
          issue.category,
          issue.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return sortIssues(list, sort);
  }, [issues, searchQuery, sort]);

  const clearFilters = () => {
    setCategory('All');
    setStatus('All');
    setSort('Most Recent');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
          <div className="hidden lg:block w-[28%]">
            <FilterSidebar
              category={category}
              setCategory={setCategory}
              status={status}
              setStatus={setStatus}
              sort={sort}
              setSort={setSort}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          <div className="lg:w-[72%] flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-headline font-bold text-on-surface">
                  {loading && issues.length === 0
                    ? 'Loading…'
                    : `${displayedIssues.length} issue${displayedIssues.length === 1 ? '' : 's'} found`}
                </h3>
                <p className="text-on-surface-variant text-sm mt-0.5">
                  {[
                    category !== 'All' ? category : null,
                    status !== 'All' ? status : null,
                    sort !== 'Most Recent' ? sort : null,
                    searchQuery.trim() ? `“${searchQuery.trim()}”` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Priority updates from your community.'}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex-1 sm:flex-none dash-btn-secondary"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Filters
                </button>

                {(category !== 'All' || status !== 'All' || searchQuery.trim()) && (
                  <button type="button" onClick={clearFilters} className="dash-btn-ghost !text-xs hidden sm:inline-flex">
                    Clear
                  </button>
                )}

                <div className="flex bg-white border border-[var(--outline-variant)] rounded-xl p-1 shadow-sm flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    className={`flex-1 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      view === 'grid'
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('map')}
                    className={`flex-1 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      view === 'map'
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Map
                  </button>
                </div>
              </div>
            </div>

            {fetchError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm font-medium">
                {fetchError}
              </div>
            )}

            {view === 'grid' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  {displayedIssues.map((issue, index) => (
                    <div
                      key={issue.id}
                      ref={index === displayedIssues.length - 1 ? lastIssueRef : null}
                    >
                      <IssueCard
                        id={issue.id}
                        title={issue.title}
                        description={issue.description}
                        category={issue.category || 'Other'}
                        status={issue.status}
                        location={issue.location}
                        image_url={issue.image_url as string}
                        upvotes={issue.upvotes}
                        created_at={issue.created_at}
                        timeAgo={issue.timeAgo}
                        onVote={handleVote}
                        href={`/issues/${issue.id}`}
                      />
                    </div>
                  ))}
                </div>

                {loading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-[320px] bg-white border border-[var(--outline-variant)] animate-pulse rounded-2xl"
                      />
                    ))}
                  </div>
                )}

                {!loading && displayedIssues.length === 0 && (
                  <div className="text-center py-20 dash-card border-dashed">
                    <span className="material-symbols-outlined text-5xl text-outline/30 mb-4">
                      search_off
                    </span>
                    <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
                      No issues match these filters
                    </h3>
                    <p className="text-on-surface-variant mb-6 max-w-sm mx-auto text-sm">
                      Try clearing category/status, or report a new issue in this area.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button type="button" onClick={clearFilters} className="dash-btn-secondary">
                        Clear filters
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/report')}
                        className="dash-btn-primary"
                      >
                        Report an issue
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[calc(100vh-20rem)] min-h-[500px] dash-card !p-2 overflow-hidden">
                <MapComponent
                  items={displayedIssues as any[]}
                  center={mapCenter}
                  zoom={mapZoom}
                  onItemClick={(item) => router.push(`/issues/${item.id}`)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <FilterBottomSheet
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
      >
        <FilterSidebar
          category={category}
          setCategory={(c) => {
            setCategory(c);
            setIsMobileFiltersOpen(false);
          }}
          status={status}
          setStatus={(s) => {
            setStatus(s);
            setIsMobileFiltersOpen(false);
          }}
          sort={sort}
          setSort={setSort}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </FilterBottomSheet>

      <Footer />
    </div>
  );
}
