'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Report } from '@/types/report';
import {
  reportsCache,
  type CachedReport,
  isTerminal,
} from '@/lib/cache/reports-cache';
import {
  ensureReportsSynced,
  bindReportsRealtime,
  patchReportLocal,
} from '@/lib/cache/reports-sync';

export type ReportsScope = 'all' | 'open' | 'mine';

type Options = {
  scope?: ReportsScope;
  /** Prefer cached paint; default true */
  staleWhileRevalidate?: boolean;
  category?: string;
  status?: string;
  sort?: 'recent' | 'votes' | 'priority';
  limit?: number;
  /** Skip network on mount (rare) */
  cacheOnly?: boolean;
};

/**
 * Instant load from shared reports cache + background delta sync.
 * All citizen/admin pages should use this instead of raw Supabase selects.
 */
export function useCachedReports(options: Options = {}) {
  const {
    scope = 'all',
    staleWhileRevalidate = true,
    category,
    status,
    sort = 'recent',
    limit,
    cacheOnly = false,
  } = options;

  const supabase = useMemo(() => createClient(), []);
  const [tick, setTick] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => reportsCache.size() === 0);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to cache mutations
  useEffect(() => {
    reportsCache.hydrate();
    const unsub = reportsCache.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  // Resolve user for mine scope
  useEffect(() => {
    if (scope !== 'mine') return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, supabase]);

  const sync = useCallback(
    async (force = false) => {
      setIsValidating(true);
      setError(null);
      try {
        await ensureReportsSynced(supabase, {
          force,
          cacheOnly: cacheOnly && !force,
        });
      } catch (e) {
        console.error(e);
        setError('Failed to sync reports');
      } finally {
        setLoading(false);
        setIsValidating(false);
      }
    },
    [supabase, cacheOnly]
  );

  // Initial: show cache, then sync
  useEffect(() => {
    reportsCache.hydrate();
    if (reportsCache.size() > 0) {
      setLoading(false);
    }
    if (staleWhileRevalidate) {
      void sync(false);
    }
  }, [sync, staleWhileRevalidate]);

  // Shared realtime (once per app via module flag)
  useEffect(() => {
    const unbind = bindReportsRealtime(supabase);
    return () => {
      // keep channel for app lifetime — unbind only on full unmount of last subscriber is complex;
      // bindReportsRealtime is singleton; no-op cleanup keeps channel warm.
      void unbind;
    };
  }, [supabase]);

  const reports: CachedReport[] = useMemo(() => {
    void tick;
    let list: CachedReport[] =
      scope === 'open'
        ? reportsCache.getOpen()
        : scope === 'mine' && userId
          ? reportsCache.getMine(userId)
          : reportsCache.getAll();

    if (category && category !== 'All') {
      list = list.filter(
        (r) => (r.category || '').toLowerCase() === category.toLowerCase()
      );
    }
    if (status && status !== 'All') {
      list = list.filter(
        (r) => (r.status || '').toLowerCase() === status.toLowerCase()
      );
    }

    if (sort === 'votes' || sort === 'priority') {
      list = [...list].sort(
        (a, b) =>
          (b.priority_score || b.ai_score || 0) - (a.priority_score || a.ai_score || 0)
      );
    } else {
      list = [...list].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
      );
    }

    if (typeof limit === 'number') list = list.slice(0, limit);
    return list;
  }, [tick, scope, userId, category, status, sort, limit]);

  const updateReport = useCallback((id: string, patch: Partial<Report>) => {
    patchReportLocal(id, patch as Record<string, unknown>);
  }, []);

  const removeReport = useCallback((id: string) => {
    reportsCache.remove(id);
  }, []);

  return {
    reports: reports as Report[],
    loading,
    /** True while background revalidation runs */
    isValidating,
    error,
    /** Force full network refresh */
    reload: () => sync(true),
    softReload: () => sync(false),
    updateReport,
    removeReport,
    cacheSize: reportsCache.size(),
    isFromCache: reportsCache.size() > 0,
  };
}

export { isTerminal, patchReportLocal, reportsCache };
