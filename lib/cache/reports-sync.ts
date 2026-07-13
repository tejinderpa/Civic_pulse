/**
 * Delta sync for reports cache.
 * - Serve cache immediately
 * - Fetch only new rows + refresh open rows
 * - Realtime patches update the same store
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { REPORT_LIST_SELECT } from '@/lib/reports/columns';
import { isTerminal, reportsCache, SOFT_TTL_MS } from '@/lib/cache/reports-cache';

const OPEN_REFRESH_LIMIT = 120;
const NEW_LIMIT = 80;
const FULL_LIMIT = 200;

export type SyncOptions = {
  /** Force network even if soft TTL fresh */
  force?: boolean;
  /** Skip network if cache has data (initial paint only) */
  cacheOnly?: boolean;
};

/**
 * Ensure cache is populated. Returns cached list immediately after hydrate;
 * kicks background sync when stale.
 */
export async function ensureReportsSynced(
  supabase: SupabaseClient,
  options: SyncOptions = {}
): Promise<{ fromCache: boolean; count: number }> {
  reportsCache.hydrate();

  if (options.cacheOnly) {
    return { fromCache: reportsCache.size() > 0, count: reportsCache.size() };
  }

  const hasData = reportsCache.size() > 0;
  const fresh = reportsCache.isFresh(SOFT_TTL_MS);

  if (hasData && fresh && !options.force) {
    return { fromCache: true, count: reportsCache.size() };
  }

  // Stale-while-revalidate: if we have data, sync in background without blocking
  if (hasData && !options.force) {
    void reportsCache.runSync(() => deltaSync(supabase));
    return { fromCache: true, count: reportsCache.size() };
  }

  // Cold start or forced: await sync
  await reportsCache.runSync(() =>
    hasData && !options.force ? deltaSync(supabase) : fullSync(supabase)
  );
  return { fromCache: false, count: reportsCache.size() };
}

export async function fullSync(supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(FULL_LIMIT);

  if (error) {
    console.warn('[reports-sync] fullSync error:', error.message);
    throw error;
  }

  reportsCache.replaceAll((data as Record<string, unknown>[]) || []);
  reportsCache.pruneTerminal(72);
}

export async function deltaSync(supabase: SupabaseClient): Promise<void> {
  const meta = reportsCache.getMeta();
  const lastSync = meta.lastSyncedAt;

  // 1) Brand-new reports since last sync
  if (lastSync) {
    const { data: newer, error: newErr } = await supabase
      .from('reports')
      .select(REPORT_LIST_SELECT)
      .gt('created_at', lastSync)
      .order('created_at', { ascending: false })
      .limit(NEW_LIMIT);

    if (newErr) {
      console.warn('[reports-sync] new rows error:', newErr.message);
    } else if (newer?.length) {
      reportsCache.upsertMany(newer as Record<string, unknown>[]);
    }
  }

  // 2) Refresh currently open reports (status / assignment may have changed)
  const openCached = reportsCache.getOpen();
  const openIds = openCached.map((r) => r.id).slice(0, OPEN_REFRESH_LIMIT);

  if (openIds.length > 0) {
    // Chunk .in() queries (PostgREST URL limits)
    const chunkSize = 80;
    for (let i = 0; i < openIds.length; i += chunkSize) {
      const chunk = openIds.slice(i, i + chunkSize);
      const { data: refreshed, error } = await supabase
        .from('reports')
        .select(REPORT_LIST_SELECT)
        .in('id', chunk);

      if (error) {
        console.warn('[reports-sync] refresh open error:', error.message);
        continue;
      }

      const rows = (refreshed as Record<string, unknown>[]) || [];
      const found = new Set(rows.map((r) => String(r.id)));
      reportsCache.upsertMany(rows);

      // Removed from DB
      for (const id of chunk) {
        if (!found.has(id)) reportsCache.remove(id);
      }
    }
  }

  // 3) Pull any open reports not in cache (new open items we might have missed)
  const { data: openRemote, error: openErr } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .not('status', 'in', '(Resolved,Rejected)')
    .order('created_at', { ascending: false })
    .limit(OPEN_REFRESH_LIMIT);

  if (!openErr && openRemote?.length) {
    reportsCache.upsertMany(openRemote as Record<string, unknown>[]);
  }

  // 4) If cache was empty, do a fuller pull of recent history too
  if (reportsCache.size() < 5) {
    const { data: recent } = await supabase
      .from('reports')
      .select(REPORT_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(FULL_LIMIT);
    if (recent?.length) reportsCache.upsertMany(recent as Record<string, unknown>[]);
  }

  reportsCache.pruneTerminal(72);
  reportsCache.markSynced({ full: !lastSync });
}

/**
 * Patch cache from a realtime payload (INSERT/UPDATE/DELETE).
 */
export function applyRealtimeChange(
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string,
  row: Record<string, unknown> | null,
  oldRow?: Record<string, unknown> | null
) {
  if (eventType === 'DELETE') {
    const id = String(oldRow?.id || row?.id || '');
    if (id) reportsCache.remove(id);
    return;
  }
  if (row && row.id) {
    reportsCache.upsertOne(row);
    // Terminal + old: still keep briefly for history UIs
    if (isTerminal(String(row.status || ''))) {
      // no-op keep; prune later
    }
  }
}

let realtimeBound = false;

/** Single shared realtime channel for the whole app. */
export function bindReportsRealtime(supabase: SupabaseClient) {
  if (typeof window === 'undefined' || realtimeBound) return () => {};
  realtimeBound = true;

  const channel = supabase
    .channel('reports-cache-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reports' },
      (payload) => {
        const type = payload.eventType;
        applyRealtimeChange(
          type,
          payload.new as Record<string, unknown>,
          payload.old as Record<string, unknown>
        );
        reportsCache.markSynced();
      }
    )
    .subscribe();

  return () => {
    realtimeBound = false;
    supabase.removeChannel(channel);
  };
}

/** Optimistic local update after admin/citizen mutation. */
export function patchReportLocal(
  id: string,
  patch: Partial<Record<string, unknown>>
) {
  const prev = reportsCache.getById(id);
  if (!prev) {
    reportsCache.upsertOne({ id, ...patch } as Record<string, unknown>);
    return;
  }
  reportsCache.upsertOne({ ...prev, ...patch, id } as Record<string, unknown>);
}
