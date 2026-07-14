/**
 * Shared report filter helpers for Supabase / PostgREST queries.
 */

export type StatusGroup = 'all' | 'open' | 'in_progress' | 'resolved';
export type ReportSort = 'recent' | 'votes' | 'priority';

export type ReportListFilters = {
  statusGroup?: StatusGroup | string | null;
  /** Exact status match (overrides statusGroup when set) */
  status?: string | null;
  category?: string | null;
  /** Free-text search: title, description, location */
  q?: string | null;
  sort?: ReportSort | string | null;
  mine?: boolean;
  userId?: string | null;
  page?: number;
  pageSize?: number;
};

/** Canonical status values used by the app + common variants */
export const STATUS_GROUP_VALUES: Record<Exclude<StatusGroup, 'all'>, string[]> = {
  open: ['Submitted', 'Pending'],
  in_progress: ['Under Review', 'In Progress'],
  resolved: ['Resolved', 'Closed', 'Done'],
};

export function parseStatusGroup(raw: string | null | undefined): StatusGroup {
  const s = (raw || 'all').toLowerCase().trim().replace(/-/g, '_');
  if (s === 'open' || s === 'pending' || s === 'submitted') return 'open';
  if (
    s === 'in_progress' ||
    s === 'progress' ||
    s === 'active' ||
    s === 'under_review' ||
    s === 'under review'
  )
    return 'in_progress';
  if (s === 'resolved' || s === 'closed' || s === 'done') return 'resolved';
  return 'all';
}

export function sanitizeSearch(q: string | null | undefined): string {
  if (!q) return '';
  // Strip characters that break PostgREST filter grammar
  return q
    .replace(/[%_,.()\"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function sanitizeCategory(cat: string): string {
  return cat.replace(/[%_,.()\"'\\]/g, '').trim().slice(0, 40);
}

type FilterableQuery = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eq: (col: string, val: unknown) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  in: (col: string, val: unknown[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  or: (filters: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ilike: (col: string, pattern: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: (col: string, opts?: { ascending?: boolean }) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  range: (from: number, to: number) => any;
};

/**
 * Apply list filters to a Supabase query builder.
 * Category + status + search are ANDed; search uses a single .or() group.
 */
export function applyReportFilters<T extends FilterableQuery>(
  query: T,
  filters: ReportListFilters
): T {
  let q: FilterableQuery = query;

  if (filters.mine && filters.userId) {
    q = q.eq('user_id', filters.userId);
  }

  const category = sanitizeCategory(filters.category || '');
  if (category && category.toLowerCase() !== 'all') {
    // Case-insensitive exact category match
    q = q.ilike('category', category);
  }

  const exactStatus = (filters.status || '').trim();
  if (exactStatus && exactStatus.toLowerCase() !== 'all') {
    q = q.eq('status', exactStatus);
  } else {
    const group = parseStatusGroup(filters.statusGroup);
    if (group !== 'all') {
      q = q.in('status', STATUS_GROUP_VALUES[group]);
    }
  }

  const search = sanitizeSearch(filters.q);
  if (search) {
    // PostgREST: or=(title.ilike.*x*,description.ilike.*x*,location.ilike.*x*)
    const pattern = `%${search}%`;
    q = q.or(
      `title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`
    );
  }

  const sort = (filters.sort || 'recent').toLowerCase();
  if (sort === 'votes' || sort === 'priority') {
    q = q.order('priority_score', { ascending: false });
    q = q.order('created_at', { ascending: false });
  } else {
    q = q.order('created_at', { ascending: false });
  }

  const page = Math.max(0, filters.page ?? 0);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 24));
  const from = page * pageSize;
  const to = from + pageSize - 1;
  q = q.range(from, to);

  return q as T;
}

type CountClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

/**
 * Accurate counts for filter chips, respecting category + search (not status group).
 */
export async function fetchReportFilterCounts(
  supabase: CountClient,
  opts: {
    category?: string | null;
    q?: string | null;
    mine?: boolean;
    userId?: string | null;
  }
): Promise<{ total: number; open: number; in_progress: number; resolved: number }> {
  // Keep as any so Supabase thenables retain .count after filter chaining
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyCommon = (query: any) => {
    let q = query;
    if (opts.mine && opts.userId) q = q.eq('user_id', opts.userId);
    const category = sanitizeCategory(opts.category || '');
    if (category && category.toLowerCase() !== 'all') {
      q = q.ilike('category', category);
    }
    const search = sanitizeSearch(opts.q);
    if (search) {
      const pattern = `%${search}%`;
      q = q.or(
        `title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`
      );
    }
    return q;
  };

  type CountRow = { count: number | null };

  const head = (): PromiseLike<CountRow> =>
    applyCommon(
      supabase.from('reports').select('id', { count: 'exact', head: true })
    );

  const [allRes, openRes, progRes, resRes] = await Promise.all([
    head(),
    applyCommon(
      supabase.from('reports').select('id', { count: 'exact', head: true })
    ).in('status', STATUS_GROUP_VALUES.open) as PromiseLike<CountRow>,
    applyCommon(
      supabase.from('reports').select('id', { count: 'exact', head: true })
    ).in('status', STATUS_GROUP_VALUES.in_progress) as PromiseLike<CountRow>,
    applyCommon(
      supabase.from('reports').select('id', { count: 'exact', head: true })
    ).in('status', STATUS_GROUP_VALUES.resolved) as PromiseLike<CountRow>,
  ]);

  return {
    total: allRes.count ?? 0,
    open: openRes.count ?? 0,
    in_progress: progRes.count ?? 0,
    resolved: resRes.count ?? 0,
  };
}
