'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  AdminNotification,
  AdminNotifFilter,
  AdminNotifSort,
  filterAdminNotifications,
  formatTimeAgo,
  kindMeta,
  loadAdminReadIds,
  saveAdminReadIds,
  sortAdminNotifications,
} from '@/lib/admin/notifications';
import { IssueDetailDrawer } from '@/components/shared/IssueDetailDrawer';
import { Issue } from '@/types/issue';
import { normalizeReportRow } from '@/lib/reports/columns';

const FILTERS: { key: AdminNotifFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'new_report', label: 'New reports' },
  { key: 'critical', label: 'Critical / High' },
  { key: 'task_force', label: 'Task forces' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'rejected', label: 'Rejected' },
];

const SORTS: { key: AdminNotifSort; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'priority', label: 'Priority' },
  { key: 'location', label: 'Location' },
  { key: 'task_force', label: 'Task force' },
  { key: 'status', label: 'Status' },
];

export default function AdminNotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<AdminNotification[]>([]);
  const [reportsById, setReportsById] = useState<Record<string, Issue>>({});
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    critical: 0,
    unassigned: 0,
    withTaskForce: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AdminNotifFilter>('all');
  const [sort, setSort] = useState<AdminNotifSort>('newest');
  const [search, setSearch] = useState('');
  const [readIds, setReadIds] = useState<Set<string>>(() => loadAdminReadIds());

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const applyReadState = useCallback(
    (list: AdminNotification[], ids: Set<string>) =>
      list.map((n) => ({ ...n, is_read: ids.has(n.id) })),
    []
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      // Instant paint from shared reports cache, then refresh API/meta
      const { ensureReportsSynced } = await import('@/lib/cache/reports-sync');
      const { reportsCache } = await import('@/lib/cache/reports-cache');
      const { createClient } = await import('@/utils/supabase/client');
      const {
        buildAdminNotifications,
      } = await import('@/lib/admin/notifications');
      const supabase = createClient();

      const ids = loadAdminReadIds();
      setReadIds(ids);

      reportsCache.hydrate();
      if (reportsCache.size() > 0) {
        const cached = reportsCache.getAll();
        const built = applyReadState(
          buildAdminNotifications(cached, ids, {}),
          ids
        );
        setItems(built);
        const map: Record<string, Issue> = {};
        cached.forEach((r) => {
          map[r.id] = r as unknown as Issue;
        });
        setReportsById(map);
        setStats({
          total: cached.length,
          open: cached.filter((r) => {
            const s = (r.status || '').toLowerCase();
            return s !== 'resolved' && s !== 'rejected';
          }).length,
          critical: cached.filter(
            (r) => r.severity === 'Critical' || r.severity === 'High'
          ).length,
          unassigned: cached.filter((r) => {
            const s = (r.status || '').toLowerCase();
            return s !== 'resolved' && s !== 'rejected' && !r.task_force_id;
          }).length,
          withTaskForce: cached.filter((r) => !!r.task_force_id).length,
        });
        setLoading(false);
      } else {
        setLoading(true);
      }

      await ensureReportsSynced(supabase);
      const res = await fetch('/api/admin/notifications');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');

      const built = applyReadState(json.items || [], ids);
      setItems(built);
      setStats(json.stats || { total: 0, open: 0, critical: 0, unassigned: 0, withTaskForce: 0 });

      const map: Record<string, Issue> = {};
      (json.reports || []).forEach((r: Record<string, unknown>) => {
        const n = normalizeReportRow(r) as unknown as Issue;
        if (n.id) map[n.id] = n;
      });
      setReportsById(map);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [applyReadState]);

  useEffect(() => {
    load();
  }, [load]);

  // Live: new citizen reports appear instantly
  useEffect(() => {
    const channel = supabase
      .channel(`admin-ops-inbox-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  const visible = useMemo(() => {
    const filtered = filterAdminNotifications(items, filter, search);
    return sortAdminNotifications(filtered, sort);
  }, [items, filter, search, sort]);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const persistRead = (next: Set<string>) => {
    setReadIds(next);
    saveAdminReadIds(next);
    setItems((prev) => applyReadState(prev, next));
  };

  const markRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    persistRead(next);
  };

  const markAllRead = () => {
    const next = new Set(readIds);
    items.forEach((n) => next.add(n.id));
    persistRead(next);
  };

  const openNotification = (n: AdminNotification) => {
    markRead(n.id);
    const issue = reportsById[n.issue_id];
    if (issue) {
      setSelectedIssue(issue);
      setDrawerOpen(true);
    } else {
      router.push(`/admin/issues?id=${n.issue_id}`);
    }
  };

  const openInIssues = (n: AdminNotification) => {
    markRead(n.id);
    router.push(`/admin/issues?id=${n.issue_id}`);
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-1">
            Operations inbox
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D2D1C] font-[var(--font-plus-jakarta)]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-black">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-xl">
            New citizen reports land here first. Open a card to assign a task force, update status,
            or jump to issue management.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Refresh
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'In feed', value: stats.total, icon: 'inbox', tone: 'text-slate-700' },
          { label: 'Open', value: stats.open, icon: 'pending_actions', tone: 'text-amber-700' },
          { label: 'Critical / High', value: stats.critical, icon: 'warning', tone: 'text-red-700' },
          {
            label: 'Unassigned',
            value: stats.unassigned,
            icon: 'person_off',
            tone: 'text-indigo-700',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <span className={`material-symbols-outlined ${s.tone}`}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
              <p className="text-xl font-black tabular-nums text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, location, task force, category…"
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-transparent text-sm font-medium focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as AdminNotifSort)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-3 sm:px-4 py-2.5 flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-[#0D2D1C] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
              notifications_paused
            </span>
            <p className="font-bold text-slate-500">No notifications match this view</p>
            <p className="text-sm text-slate-400 mt-1">
              New citizen submissions will appear here automatically.
            </p>
          </div>
        ) : (
          visible.map((n) => {
            const meta = kindMeta(n.kind);
            return (
              <article
                key={n.id}
                className={`group rounded-2xl border transition-all ${
                  !n.is_read
                    ? 'bg-blue-50/40 border-blue-200/60 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch gap-0">
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className="flex-1 flex items-start gap-3 sm:gap-4 p-4 text-left min-w-0"
                  >
                    <div className="flex items-start gap-2 shrink-0">
                      {!n.is_read && (
                        <span className="mt-3 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center ${meta.color}`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {meta.label}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            n.severity === 'Critical'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : n.severity === 'High'
                                ? 'bg-orange-50 text-orange-700 border-orange-100'
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}
                        >
                          {n.severity}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <h3
                        className={`text-sm sm:text-base truncate ${
                          !n.is_read ? 'font-black text-[#0D2D1C]' : 'font-bold text-slate-700'
                        }`}
                      >
                        {n.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                          <span className="material-symbols-outlined text-[12px]">category</span>
                          {n.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md max-w-[200px] truncate">
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          {n.short_location}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                          {n.status}
                        </span>
                        {n.task_force_name && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            <span className="material-symbols-outlined text-[12px]">groups</span>
                            {n.task_force_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {n.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.image_url}
                        alt=""
                        className="hidden sm:block h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                    )}
                  </button>

                  <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-slate-100 p-2 sm:p-3 gap-1.5 sm:justify-center shrink-0">
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className="flex-1 sm:flex-none h-9 px-3 rounded-xl bg-[#0D2D1C] text-white text-[11px] font-black uppercase tracking-wide hover:opacity-90 inline-flex items-center justify-center gap-1"
                    >
                      Open
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openInIssues(n)}
                      className="flex-1 sm:flex-none h-9 px-3 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-1"
                    >
                      Issues
                    </button>
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="flex-1 sm:flex-none h-9 px-3 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      >
                        Read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 font-medium">
        Showing {visible.length} of {items.length} · Live updates when citizens submit reports
      </p>

      <IssueDetailDrawer
        issue={selectedIssue}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={() => {
          load();
        }}
        onCreateTaskForce={(issue) => {
          setDrawerOpen(false);
          router.push(`/admin/issues?id=${issue.id}`);
        }}
      />
    </div>
  );
}
