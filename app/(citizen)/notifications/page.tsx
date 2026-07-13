'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  buildNotificationsFromReports,
  loadReadIds,
  saveReadIds,
  type CitizenNotification,
} from '@/lib/citizen/notifications';

export default function NotificationsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<CitizenNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [source, setSource] = useState<'table' | 'activity'>('activity');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be signed in.');
        return;
      }

      // Prefer real notifications table when present
      const tableAttempt = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!tableAttempt.error && tableAttempt.data) {
        setSource('table');
        let rows = tableAttempt.data.map((n) => ({
          id: String(n.id),
          title: n.title || 'Update',
          message: n.message || 'You have a new update.',
          created_at: n.created_at,
          is_read: !!n.is_read,
          kind: 'system' as const,
        }));
        if (filter === 'unread') rows = rows.filter((r) => !r.is_read);
        setItems(rows);
        return;
      }

      // Fallback: activity from own reports (no notifications table in live DB)
      setSource('activity');
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);

      if (reportsError) throw reportsError;

      const read = loadReadIds();
      let built = buildNotificationsFromReports(reports || [], read);
      if (filter === 'unread') built = built.filter((n) => !n.is_read);
      setItems(built);
    } catch (e) {
      console.error(e);
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    if (source === 'table') {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } else {
      const read = loadReadIds();
      read.add(id);
      saveReadIds(read);
    }
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (source === 'table') {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } else {
      const read = loadReadIds();
      items.forEach((n) => read.add(n.id));
      saveReadIds(read);
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const hours = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full">
      <PageHeader
        title="Notifications"
        subtitle={
          source === 'activity'
            ? 'Activity from your reports (live updates).'
            : 'Updates about your reports and community.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={markAllRead}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Mark all read
            </button>
          </div>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-container-low animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon="notifications_off"
          title="No notifications"
          description="You are all caught up. Submit a report to see activity here."
          actionLabel="New Report"
          actionHref="/report"
        />
      )}

      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`p-5 rounded-2xl border transition-colors ${
              n.is_read
                ? 'bg-white border-outline-variant/20'
                : 'bg-primary/5 border-primary/20'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-headline font-bold text-on-surface">{n.title}</p>
                <p className="text-sm text-on-surface-variant font-body mt-1">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-outline font-medium">{formatTime(n.created_at)}</p>
                  {n.href && (
                    <Link
                      href={n.href}
                      className="text-xs font-bold text-primary hover:underline"
                      onClick={() => markRead(n.id)}
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="text-xs font-bold text-primary shrink-0 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
