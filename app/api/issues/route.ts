export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';
import { REPORT_LIST_SELECT, normalizeReportRow } from '@/lib/reports/columns';
import {
  applyReportFilters,
  fetchReportFilterCounts,
  parseStatusGroup,
  sanitizeSearch,
  type ReportListFilters,
} from '@/lib/reports/filters';
import { useMockData } from '@/lib/mock';
import { MOCK_ISSUES } from '@/lib/mock-data';
import { compareByPriorityDesc } from '@/lib/reports/priority';

function filterMockIssues(opts: {
  statusGroup: string;
  status: string | null;
  category: string | null;
  q: string | null;
  sort: string;
  page: number;
  pageSize: number;
  mine: boolean;
}) {
  let list = MOCK_ISSUES.map((r) => normalizeReportRow(r as Record<string, unknown>));

  // "Mine" is empty for pure mock (no real user ownership)
  if (opts.mine) list = [];

  const group = parseStatusGroup(opts.statusGroup);
  if (opts.status && opts.status !== 'All') {
    list = list.filter((r) => String(r.status) === opts.status);
  } else if (group === 'open') {
    list = list.filter((r) =>
      ['Submitted', 'Pending', 'Under Review'].includes(String(r.status))
    );
  } else if (group === 'in_progress') {
    list = list.filter((r) =>
      ['Under Review', 'In Progress'].includes(String(r.status))
    );
  } else if (group === 'resolved') {
    list = list.filter((r) =>
      ['Resolved', 'Closed', 'Done'].includes(String(r.status))
    );
  }

  if (opts.category && opts.category !== 'All') {
    list = list.filter(
      (r) => String(r.category || '').toLowerCase() === opts.category!.toLowerCase()
    );
  }

  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((r) =>
      [r.title, r.description, r.location]
        .map((x) => String(x || '').toLowerCase())
        .some((s) => s.includes(q))
    );
  }

  if (opts.sort === 'votes' || opts.sort === 'priority') {
    list = [...list].sort(compareByPriorityDesc);
  } else {
    list = [...list].sort(
      (a, b) => +new Date(String(b.created_at)) - +new Date(String(a.created_at))
    );
  }

  const total = list.length;
  const open = list.filter((r) =>
    ['Submitted', 'Pending', 'Under Review'].includes(String(r.status))
  ).length;
  const in_progress = list.filter((r) => String(r.status) === 'In Progress').length;
  const resolved = list.filter((r) =>
    ['Resolved', 'Closed', 'Done'].includes(String(r.status))
  ).length;

  const from = opts.page * opts.pageSize;
  const pageRows = list.slice(from, from + opts.pageSize);

  return {
    rows: pageRows,
    counts: { total, open, in_progress, resolved },
    hasMore: from + opts.pageSize < total,
  };
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  try {
    const json = await request.json();
    const {
      title,
      description,
      category,
      severity = 'Medium',
      location,
      latitude,
      longitude,
      image_url,
      embedding,
    } = json;

    if (!description && !title) {
      return NextResponse.json(
        { error: 'Title or description is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      user_id: auth.user.id,
      title: title || (description || '').slice(0, 80),
      category: category || 'Other',
      description: description || '',
      location: location || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      image_url: image_url || null,
      status: 'Submitted',
      severity: severity || 'Medium',
      priority_score: 0,
    };

    if (Array.isArray(embedding) && embedding.length === 768) {
      payload.embedding = embedding;
    }

    let { data, error } = await auth.supabase.from('reports').insert([payload]).select().single();

    if (error && payload.embedding && /dimension|embedding|vector/i.test(error.message)) {
      console.warn('Retrying issue insert without embedding:', error.message);
      delete payload.embedding;
      ({ data, error } = await auth.supabase.from('reports').insert([payload]).select().single());
    }

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 });
    }

    if (data?.id) {
      try {
        const name =
          (auth.user.user_metadata?.full_name as string) ||
          auth.user.email?.split('@')[0] ||
          'Citizen';
        await auth.supabase.from('issue_history').insert({
          issue_id: data.id,
          action_type: 'submission',
          old_value: null,
          new_value: 'Submitted',
          user_name: name,
          user_id: auth.user.id,
        });
      } catch (histErr) {
        console.warn('Timeline seed failed:', histErr);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Invalid request', code: 'BAD_REQUEST' }, { status: 400 });
  }
}

/**
 * GET /api/issues
 * Query params:
 *  - statusGroup: all | open | in_progress | resolved
 *  - status: exact status (overrides group)
 *  - category: category name or All
 *  - q: search text
 *  - sort: recent | votes | priority
 *  - mine: true
 *  - page, pageSize
 *  - includeCounts: true → { counts: { total, open, in_progress, resolved } }
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10)));
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const statusGroup = searchParams.get('statusGroup') || searchParams.get('filter') || 'all';
  const sort = searchParams.get('sort') || 'recent';
  const q = sanitizeSearch(searchParams.get('q') || searchParams.get('search'));
  const mine = searchParams.get('mine') === 'true';
  const includeCounts = searchParams.get('includeCounts') === 'true';

  let userId: string | null = null;
  if (mine) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }
    userId = user.id;
  }

  const filters: ReportListFilters = {
    statusGroup: parseStatusGroup(statusGroup),
    status,
    category,
    q,
    sort,
    mine,
    userId,
    page,
    pageSize,
  };

  try {
    let query = supabase.from('reports').select(REPORT_LIST_SELECT);
    query = applyReportFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/issues]', error);
      // Fallback: simpler filters (eq/in only) if ilike/or fails on schema
      let fallback = supabase.from('reports').select(REPORT_LIST_SELECT);
      if (mine && userId) fallback = fallback.eq('user_id', userId);
      if (category && category !== 'All') fallback = fallback.eq('category', category);
      const group = parseStatusGroup(statusGroup);
      if (status && status !== 'All') {
        fallback = fallback.eq('status', status);
      } else if (group === 'open') {
        fallback = fallback.in('status', ['Submitted', 'Pending']);
      } else if (group === 'in_progress') {
        fallback = fallback.in('status', ['Under Review', 'In Progress']);
      } else if (group === 'resolved') {
        fallback = fallback.in('status', ['Resolved', 'Closed', 'Done']);
      }
      if (q) {
        fallback = fallback.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`
        );
      }
      if (sort === 'votes' || sort === 'priority') {
        fallback = fallback
          .order('priority_score', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        fallback = fallback.order('created_at', { ascending: false });
      }
      const from = page * pageSize;
      fallback = fallback.range(from, from + pageSize - 1);
      const fb = await fallback;
      if (fb.error) {
        return NextResponse.json({ error: fb.error.message, code: 'DB_ERROR' }, { status: 500 });
      }
      const rows = ((fb.data as Record<string, unknown>[]) || []).map((r) =>
        normalizeReportRow(r)
      );

      let fbCounts:
        | { total: number; open: number; in_progress: number; resolved: number }
        | undefined;
      if (includeCounts) {
        try {
          fbCounts = await fetchReportFilterCounts(supabase, {
            category,
            q,
            mine,
            userId,
          });
        } catch {
          /* optional */
        }
      }

      return NextResponse.json({
        data: rows,
        page,
        pageSize,
        hasMore: rows.length === pageSize,
        filters: { statusGroup: group, category, q, sort },
        counts: fbCounts,
      });
    }

    let rows = ((data as Record<string, unknown>[]) || []).map((r) => normalizeReportRow(r));

    // When DB is empty, serve Punjab demo dataset so citizen + authority analytics work
    if (rows.length === 0 && useMockData() && !mine) {
      const mock = filterMockIssues({
        statusGroup,
        status,
        category,
        q,
        sort,
        page,
        pageSize,
        mine,
      });
      return NextResponse.json({
        data: mock.rows,
        page,
        pageSize,
        hasMore: mock.hasMore,
        filters: {
          statusGroup: parseStatusGroup(statusGroup),
          category: category || 'All',
          q,
          sort,
        },
        counts: includeCounts ? mock.counts : undefined,
        source: 'mock-punjab-demo',
      });
    }

    let counts:
      | { total: number; open: number; in_progress: number; resolved: number }
      | undefined;

    if (includeCounts) {
      try {
        counts = await fetchReportFilterCounts(supabase, {
          category,
          q,
          mine,
          userId,
        });
      } catch (countErr) {
        console.warn('[GET /api/issues] counts failed', countErr);
      }
    }

    return NextResponse.json({
      data: rows,
      page,
      pageSize,
      hasMore: rows.length === pageSize,
      filters: {
        statusGroup: parseStatusGroup(statusGroup),
        category: category || 'All',
        q,
        sort,
      },
      counts,
    });
  } catch (err) {
    console.error('[GET /api/issues] unexpected', err);
    if (useMockData() && !mine) {
      const mock = filterMockIssues({
        statusGroup,
        status,
        category,
        q,
        sort,
        page,
        pageSize,
        mine,
      });
      return NextResponse.json({
        data: mock.rows,
        page,
        pageSize,
        hasMore: mock.hasMore,
        filters: {
          statusGroup: parseStatusGroup(statusGroup),
          category: category || 'All',
          q,
          sort,
        },
        counts: includeCounts ? mock.counts : undefined,
        source: 'mock-punjab-demo',
      });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL' }, { status: 500 });
  }
}
