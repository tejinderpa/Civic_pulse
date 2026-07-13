'use client';

import { useMemo } from 'react';
import { useCachedReports } from '@/hooks/useCachedReports';
import type { Report } from '@/types/report';

type Options = {
  pageSize?: number;
  mine?: boolean;
  sort?: 'recent' | 'votes';
  category?: string;
  status?: string;
};

/**
 * Back-compat issues hook — powered by shared reports cache (SWR + delta sync).
 */
export function useIssues(options: Options = {}) {
  const { pageSize = 20, mine = false, sort = 'recent', category, status } = options;

  const { reports, loading, error, reload, isValidating, updateReport } = useCachedReports({
    scope: mine ? 'mine' : 'all',
    category,
    status,
    sort: sort === 'votes' ? 'votes' : 'recent',
  });

  // Simple client-side pagination over cached list
  const page = 0;
  const slice = useMemo(() => reports.slice(0, pageSize), [reports, pageSize]);
  const hasMore = reports.length > pageSize;

  return {
    issues: slice as Report[],
    setIssues: (_: Report[] | ((prev: Report[]) => Report[])) => {
      // No-op store writes go through updateReport; kept for API compat
    },
    loading,
    error,
    page,
    hasMore,
    isValidating,
    reload,
    loadMore: () => {
      /* full list already in cache — callers can raise pageSize */
    },
    updateReport,
    allCount: reports.length,
  };
}
