/**
 * Shared reports cache (memory + sessionStorage).
 * Stale-while-revalidate: pages render instantly from cache, then sync deltas.
 */

import type { Report } from '@/types/report';
import { normalizeReportRow } from '@/lib/reports/columns';

export const REPORTS_CACHE_KEY = 'civicpulse_reports_cache_v1';
export const SOFT_TTL_MS = 25_000; // background revalidate after 25s
export const HARD_TTL_MS = 15 * 60_000; // session dump max age 15m
export const MAX_CACHED = 250;

export type CachedReport = Report & { _cached_at?: number };

type CacheMeta = {
  lastSyncedAt: string | null;
  lastFullSyncAt: string | null;
  version: number;
};

type CacheSnapshot = {
  byId: Record<string, CachedReport>;
  meta: CacheMeta;
};

type Listener = (reports: CachedReport[], meta: CacheMeta) => void;

function emptyMeta(): CacheMeta {
  return { lastSyncedAt: null, lastFullSyncAt: null, version: 0 };
}

function isTerminal(status: string | null | undefined): boolean {
  const s = (status || '').toLowerCase();
  return s === 'resolved' || s === 'rejected' || s === 'closed' || s === 'done';
}

function nowIso() {
  return new Date().toISOString();
}

class ReportsCacheStore {
  private byId = new Map<string, CachedReport>();
  private meta: CacheMeta = emptyMeta();
  private listeners = new Set<Listener>();
  private hydrated = false;
  private inflight: Promise<void> | null = null;

  /** Load sessionStorage once (browser only). */
  hydrate() {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;
    try {
      const raw = sessionStorage.getItem(REPORTS_CACHE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw) as CacheSnapshot;
      if (!snap?.byId) return;
      const fullAt = snap.meta?.lastFullSyncAt
        ? new Date(snap.meta.lastFullSyncAt).getTime()
        : 0;
      if (fullAt && Date.now() - fullAt > HARD_TTL_MS) {
        sessionStorage.removeItem(REPORTS_CACHE_KEY);
        return;
      }
      Object.values(snap.byId).forEach((r) => {
        if (r?.id) this.byId.set(r.id, r);
      });
      this.meta = { ...emptyMeta(), ...snap.meta };
    } catch {
      /* ignore corrupt cache */
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      // Prune terminal reports older than 7 days from session dump to keep cache lean
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const byId: Record<string, CachedReport> = {};
      let entries = [...this.byId.values()];
      // Prefer open reports, then recent
      entries.sort((a, b) => {
        const aOpen = isTerminal(a.status) ? 1 : 0;
        const bOpen = isTerminal(b.status) ? 1 : 0;
        if (aOpen !== bOpen) return aOpen - bOpen;
        return +new Date(b.created_at) - +new Date(a.created_at);
      });
      if (entries.length > MAX_CACHED) entries = entries.slice(0, MAX_CACHED);
      for (const r of entries) {
        if (isTerminal(r.status) && +new Date(r.created_at) < cutoff) continue;
        byId[r.id] = r;
      }
      const snap: CacheSnapshot = { byId, meta: this.meta };
      sessionStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(snap));
    } catch {
      /* quota / private mode */
    }
  }

  private emit() {
    const list = this.getAll();
    this.listeners.forEach((fn) => {
      try {
        fn(list, this.meta);
      } catch {
        /* listener error */
      }
    });
  }

  subscribe(fn: Listener): () => void {
    this.hydrate();
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getMeta(): CacheMeta {
    this.hydrate();
    return { ...this.meta };
  }

  isFresh(ttl = SOFT_TTL_MS): boolean {
    this.hydrate();
    if (!this.meta.lastSyncedAt) return false;
    return Date.now() - new Date(this.meta.lastSyncedAt).getTime() < ttl;
  }

  size(): number {
    this.hydrate();
    return this.byId.size;
  }

  getAll(): CachedReport[] {
    this.hydrate();
    return [...this.byId.values()].sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
    );
  }

  getById(id: string): CachedReport | undefined {
    this.hydrate();
    return this.byId.get(id);
  }

  /** Open / active reports only (ops views). */
  getOpen(): CachedReport[] {
    return this.getAll().filter((r) => !isTerminal(r.status));
  }

  getMine(userId: string): CachedReport[] {
    return this.getAll().filter((r) => r.user_id === userId);
  }

  upsertOne(raw: Record<string, unknown> | CachedReport) {
    this.hydrate();
    const row = normalizeReportRow(raw as Record<string, unknown>) as unknown as CachedReport;
    if (!row.id) return;
    row._cached_at = Date.now();
    this.byId.set(row.id, { ...this.byId.get(row.id), ...row });
    this.meta.version += 1;
    this.persist();
    this.emit();
  }

  upsertMany(rows: (Record<string, unknown> | CachedReport)[]) {
    this.hydrate();
    let changed = false;
    for (const raw of rows) {
      const row = normalizeReportRow(raw as Record<string, unknown>) as unknown as CachedReport;
      if (!row.id) continue;
      row._cached_at = Date.now();
      const prev = this.byId.get(row.id);
      if (
        prev &&
        prev.status === row.status &&
        prev.task_force_id === row.task_force_id &&
        prev.department === row.department &&
        prev.priority_score === row.priority_score &&
        prev.title === row.title &&
        prev.severity === row.severity
      ) {
        // Touch cache timestamp only — skip noisy re-renders
        this.byId.set(row.id, { ...prev, ...row, _cached_at: Date.now() });
        continue;
      }
      this.byId.set(row.id, { ...prev, ...row });
      changed = true;
    }
    if (changed) {
      this.meta.version += 1;
      this.persist();
      this.emit();
    } else {
      // Still persist meta timestamps when caller marks sync
      this.persist();
    }
  }

  remove(id: string) {
    this.hydrate();
    if (!this.byId.delete(id)) return;
    this.meta.version += 1;
    this.persist();
    this.emit();
  }

  /** Drop resolved/rejected from active memory (session still may hold briefly). */
  pruneTerminal(keepRecentHours = 48) {
    this.hydrate();
    const cutoff = Date.now() - keepRecentHours * 3600_000;
    let removed = 0;
    for (const [id, r] of this.byId) {
      if (isTerminal(r.status) && +new Date(r.created_at) < cutoff) {
        this.byId.delete(id);
        removed++;
      }
    }
    if (removed > 0) {
      this.meta.version += 1;
      this.persist();
      this.emit();
    }
    return removed;
  }

  markSynced(opts?: { full?: boolean }) {
    this.meta.lastSyncedAt = nowIso();
    if (opts?.full) this.meta.lastFullSyncAt = this.meta.lastSyncedAt;
    this.persist();
  }

  replaceAll(rows: (Record<string, unknown> | CachedReport)[]) {
    this.hydrate();
    this.byId.clear();
    for (const raw of rows) {
      const row = normalizeReportRow(raw as Record<string, unknown>) as unknown as CachedReport;
      if (!row.id) continue;
      row._cached_at = Date.now();
      this.byId.set(row.id, row);
    }
    this.meta.version += 1;
    this.markSynced({ full: true });
    this.emit();
  }

  clear() {
    this.byId.clear();
    this.meta = emptyMeta();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(REPORTS_CACHE_KEY);
      } catch {
        /* */
      }
    }
    this.emit();
  }

  /** Serialize inflight network sync so multiple pages share one request. */
  runSync(fn: () => Promise<void>): Promise<void> {
    if (this.inflight) return this.inflight;
    this.inflight = fn().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  getInflight() {
    return this.inflight;
  }
}

export const reportsCache = new ReportsCacheStore();

export { isTerminal };
