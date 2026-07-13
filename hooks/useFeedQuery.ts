'use client';

/**
 * Feed list query with real backend filters (statusGroup, category, q, sort, pagination).
 * Results are also merged into the shared reports cache for reuse elsewhere.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Report } from '@/types/report';
import { reportsCache } from '@/lib/cache/reports-cache';
import type { StatusGroup, ReportSort } from '@/lib/reports/filters';

export type FeedCounts = {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
};

type Options = {
  statusGroup: StatusGroup;
  category: string;
  q: string;
  sort: ReportSort;
  pageSize?: number;
  /** Debounce ms for search string */
  searchDebounceMs?: number;
};

type FeedState = {
  reports: Report[];
  loading: boolean;
  isValidating: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  counts: FeedCounts;
};

const emptyCounts: FeedCounts = { total: 0, open: 0, in_progress: 0, resolved: 0 };

export function useFeedQuery(options: Options) {
  const {
    statusGroup,
    category,
    q,
    sort,
    pageSize = 24,
    searchDebounceMs = 350,
  } = options;

  const [debouncedQ, setDebouncedQ] = useState(q);
  const [state, setState] = useState<FeedState>({
    reports: [],
    loading: true,
    isValidating: false,
    error: null,
    page: 0,
    hasMore: false,
    counts: emptyCounts,
  });

  const abortRef = useRef<AbortController | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), searchDebounceMs);
    return () => clearTimeout(t);
  }, [q, searchDebounceMs]);

  const buildUrl = useCallback(
    (page: number, withCounts: boolean) => {
      const params = new URLSearchParams();
      params.set('statusGroup', statusGroup);
      if (category && category !== 'All') params.set('category', category);
      if (debouncedQ) params.set('q', debouncedQ);
      params.set('sort', sort === 'votes' || sort === 'priority' ? 'votes' : 'recent');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (withCounts) params.set('includeCounts', 'true');
      return `/api/issues?${params.toString()}`;
    },
    [statusGroup, category, debouncedQ, sort, pageSize]
  );

  const fetchPage = useCallback(
    async (page: number, mode: 'replace' | 'append') => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const id = ++reqId.current;

      setState((s) => ({
        ...s,
        loading: mode === 'replace' && s.reports.length === 0,
        isValidating: true,
        error: null,
      }));

      try {
        const res = await fetch(buildUrl(page, mode === 'replace'), {
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (id !== reqId.current) return;

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load reports');
        }

        const rows = (json.data || []) as Report[];
        // Warm shared cache
        if (rows.length) {
          reportsCache.upsertMany(rows as unknown as Record<string, unknown>[]);
        }

        setState((s) => ({
          reports: mode === 'append' ? [...s.reports, ...rows] : rows,
          loading: false,
          isValidating: false,
          error: null,
          page,
          hasMore: Boolean(json.hasMore),
          counts: json.counts
            ? {
                total: json.counts.total ?? 0,
                open: json.counts.open ?? 0,
                in_progress: json.counts.in_progress ?? 0,
                resolved: json.counts.resolved ?? 0,
              }
            : s.counts,
        }));
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        if (id !== reqId.current) return;
        console.error('[useFeedQuery]', e);
        setState((s) => ({
          ...s,
          loading: false,
          isValidating: false,
          error: e instanceof Error ? e.message : 'Failed to load reports',
        }));
      }
    },
    [buildUrl]
  );

  // Refetch when filters change
  useEffect(() => {
    void fetchPage(0, 'replace');
    return () => abortRef.current?.abort();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (state.isValidating || !state.hasMore) return;
    void fetchPage(state.page + 1, 'append');
  }, [fetchPage, state.isValidating, state.hasMore, state.page]);

  const reload = useCallback(() => {
    void fetchPage(0, 'replace');
  }, [fetchPage]);

  /** Optimistic local patch (e.g. votes) + shared cache */
  const patchLocal = useCallback((id: string, patch: Partial<Report>) => {
    setState((s) => ({
      ...s,
      reports: s.reports.map((r) =>
        r.id === id ? ({ ...r, ...patch } as Report) : r
      ),
    }));
    reportsCache.upsertOne({ id, ...patch } as Record<string, unknown>);
  }, []);

  return {
    ...state,
    loadMore,
    reload,
    patchLocal,
    debouncedQ,
  };
}
