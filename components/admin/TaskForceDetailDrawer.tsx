'use client';

import React, { useEffect, useState } from 'react';
import { StatusPill } from '@/components/ui/StatusPill';

type TFIssue = {
  id: string;
  title?: string;
  status?: string;
  severity?: string;
  category?: string;
  location?: string | null;
  address?: string | null;
  ai_score?: number;
};

type TFDetail = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  issueCount: number;
  progress: number;
  stats: {
    total: number;
    resolved: number;
    inProgress: number;
    underReview: number;
    submitted: number;
  };
  issues: TFIssue[];
  recentActivity: Array<{
    id: string;
    issue_id: string;
    action_type: string;
    old_value?: string | null;
    new_value?: string | null;
    user_name?: string | null;
    created_at: string;
  }>;
};

type Props = {
  taskForceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueUpdated?: () => void;
};

export function TaskForceDetailDrawer({
  taskForceId,
  isOpen,
  onClose,
  onIssueUpdated,
}: Props) {
  const [data, setData] = useState<TFDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !taskForceId) {
      setData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/task-forces/${taskForceId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load task force');
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, taskForceId]);

  const refresh = async () => {
    if (!taskForceId) return;
    const res = await fetch(`/api/admin/task-forces/${taskForceId}`);
    if (res.ok) setData(await res.json());
    onIssueUpdated?.();
  };

  const advanceStatus = async (issue: TFIssue, next: string) => {
    setUpdatingId(issue.id);
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          taskForceId: taskForceId,
          status: next,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Update failed');
      }
      await refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const nextStatus = (status?: string) => {
    const order = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
    const i = order.indexOf(status || 'Submitted');
    if (i < 0 || i >= order.length - 1) return null;
    return order[i + 1];
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full md:w-[520px] bg-white z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">
              Task force detail
            </p>
            <h2 className="text-2xl font-black text-[#0D2D1C] truncate">
              {data?.name || (loading ? 'Loading…' : 'Task force')}
            </h2>
            {data && (
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Created {new Date(data.createdAt).toLocaleDateString()} ·{' '}
                <span className="capitalize">{data.status}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium p-4">
              {error}
            </div>
          )}

          {loading && !data && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {data && (
            <>
              {/* Progress KPIs */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-700 text-white p-5 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                      Resolution progress
                    </p>
                    <p className="text-4xl font-black mt-1">{data.progress}%</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-100">
                    {data.stats.resolved}/{data.stats.total} resolved
                  </p>
                </div>
                <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${data.progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'New', n: data.stats.submitted },
                    { label: 'Review', n: data.stats.underReview },
                    { label: 'Active', n: data.stats.inProgress },
                    { label: 'Done', n: data.stats.resolved },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/10 py-2">
                      <p className="text-lg font-black">{s.n}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked issues */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">
                  Assigned reports ({data.issues.length})
                </h3>
                {data.issues.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 font-medium">
                    No reports linked yet. Assign issues from Issue Management.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.issues.map((issue) => {
                      const next = nextStatus(issue.status);
                      return (
                        <div
                          key={issue.id}
                          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-[#0D2D1C] truncate">
                                {issue.title || 'Untitled'}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                {issue.location || issue.address || issue.category || '—'}
                              </p>
                            </div>
                            <StatusPill status={issue.status || 'Submitted'} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-gray-400">
                              {issue.severity || 'Medium'} · score {issue.ai_score ?? 0}
                            </span>
                            {next && issue.status !== 'Rejected' && (
                              <button
                                type="button"
                                disabled={updatingId === issue.id}
                                onClick={() => advanceStatus(issue, next)}
                                className="ml-auto text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {updatingId === issue.id ? 'Updating…' : `Mark ${next}`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              {data.recentActivity?.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">
                    Recent activity
                  </h3>
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 10).map((e) => (
                      <div
                        key={e.id}
                        className="flex gap-3 text-sm border-l-2 border-emerald-200 pl-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {e.action_type.replace(/_/g, ' ')}
                            {e.new_value ? `: ${e.new_value}` : ''}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(e.created_at).toLocaleString()}
                            {e.user_name ? ` · ${e.user_name}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
