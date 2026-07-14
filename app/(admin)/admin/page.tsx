'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Issue } from '@/types/issue';

import { MOCK_ISSUES } from '@/lib/mock-data';
import { useMockData } from '@/lib/mock';
import { useCachedReports, patchReportLocal } from '@/hooks/useCachedReports';

import { TaskForceModal } from '@/components/admin/TaskForceModal';
import { TaskForceResult } from '@/types/issue';
import { DashStat } from '@/components/dashboard/DashStat';
import { DashCard, DashCardHeader } from '@/components/dashboard/DashCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { compareByPriorityDesc, SEVERITY_BADGE_CLASS } from '@/lib/reports/priority';

const AdminMap = dynamic(() => import('../../../components/admin/AdminMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-surface-container-low animate-pulse rounded-2xl flex items-center justify-center text-on-surface-variant text-sm font-medium">
      Loading operations map…
    </div>
  ),
});

export default function AdminDashboard() {
  const {
    reports,
    loading: cacheLoading,
    isValidating,
    reload,
  } = useCachedReports({ scope: 'all' });

  const issues = useMemo(() => {
    if (reports.length === 0 && !cacheLoading && useMockData()) {
      return MOCK_ISSUES as unknown as Issue[];
    }
    return reports as unknown as Issue[];
  }, [reports, cacheLoading]);

  const isLoading = cacheLoading && issues.length === 0;
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isTaskForceModalOpen, setIsTaskForceModalOpen] = useState(false);
  const [taskForceIssues, setTaskForceIssues] = useState<Issue[]>([]);
  const [portalReady, setPortalReady] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Freeze page scroll while map is expanded
  useEffect(() => {
    if (!isMapExpanded) return;
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      htmlOverflow: documentElement.style.overflow,
    };
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      documentElement.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isMapExpanded]);

  const stats = useMemo(() => {
    const active = issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected').length;
    const critical = issues.filter(
      (i) => i.severity === 'Critical' && i.status !== 'Resolved'
    ).length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    const duplicates = issues.filter((i) => i.duplicate_of !== null).length;
    const total = issues.length;
    const satisfaction = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const duplicateRate = total > 0 ? Math.round((duplicates / total) * 100) : 0;

    return [
      {
        label: 'Active reports',
        value: active.toLocaleString(),
        change: isLoading ? '…' : isValidating ? `${total} · syncing` : `${total} total`,
        trend: 'neutral' as const,
        tone: 'primary' as const,
        icon: 'assignment',
      },
      {
        label: 'Critical',
        value: critical.toLocaleString(),
        change: critical > 0 ? 'Needs attention' : 'Stable',
        trend: critical > 0 ? ('down' as const) : ('neutral' as const),
        tone: 'error' as const,
        icon: 'warning',
      },
      {
        label: 'Duplicates',
        value: duplicates.toLocaleString(),
        change: `${duplicateRate}% rate`,
        trend: 'neutral' as const,
        tone: 'warning' as const,
        icon: 'content_copy',
      },
      {
        label: 'Resolution rate',
        value: `${satisfaction}%`,
        change: `${resolved} closed`,
        trend: satisfaction >= 50 ? ('up' as const) : ('neutral' as const),
        tone: 'primary' as const,
        icon: 'verified',
      },
    ];
  }, [issues, isLoading]);

  const aiQueue = useMemo(() => {
    return issues
      .filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected')
      .sort(compareByPriorityDesc)
      .slice(0, 5);
  }, [issues]);

  const handleOpenTaskForce = () => {
    if (aiQueue.length === 0) {
      alert('No high-priority issues currently in queue.');
      return;
    }
    setTaskForceIssues(aiQueue.slice(0, 3));
    setIsTaskForceModalOpen(true);
  };

  const handleTaskForceSuccess = (result: TaskForceResult) => {
    taskForceIssues.forEach((issue) => {
      patchReportLocal(issue.id, {
        task_force_id: result.taskForceId,
        status: issue.status === 'Submitted' ? 'Under Review' : issue.status,
      });
    });
  };

  const handleSeedDemo = async (force = false) => {
    setSeedingDemo(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/admin/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSeedMessage(json.error || 'Failed to seed demo data');
        return;
      }
      if (json.reports?.length) {
        const { reportsCache } = await import('@/lib/cache/reports-cache');
        reportsCache.upsertMany(json.reports as Record<string, unknown>[]);
      }
      await reload();
      setSeedMessage(
        json.message ||
          (json.seeded
            ? `Loaded ${json.seeded} Punjab demo reports`
            : 'Demo data ready')
      );
    } catch {
      setSeedMessage('Network error while seeding demo data');
    } finally {
      setSeedingDemo(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Operations Dashboard"
        hideTitle
        subtitle="Infrastructure health and citizen pulse. AI co-pilot prioritizes your next actions."
        actions={
          <>
            <button
              type="button"
              onClick={() => handleSeedDemo(false)}
              disabled={seedingDemo}
              className="dash-btn-secondary"
              title="Insert 15 Punjab-region demo reports into the live database"
            >
              <span className="material-symbols-outlined text-[18px]">
                {seedingDemo ? 'progress_activity' : 'database'}
              </span>
              {seedingDemo ? 'Seeding…' : 'Load Punjab demo'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/issues')}
              className="dash-btn-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">list_alt</span>
              All issues
            </button>
            <button type="button" onClick={handleOpenTaskForce} className="dash-btn-primary">
              <span className="material-symbols-outlined text-[18px]">groups</span>
              Task force
            </button>
          </>
        }
      />

      {seedMessage && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 flex items-start gap-2">
          <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
          <span className="flex-1">{seedMessage}</span>
          <button
            type="button"
            className="text-emerald-700/70 hover:text-emerald-900"
            onClick={() => setSeedMessage(null)}
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <DashStat
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            tone={stat.tone}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7">
          <DashCard padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <DashCardHeader
                title="Geospatial intelligence"
                subtitle={`${issues.length} records on map`}
                icon="map"
              />
              <button
                type="button"
                onClick={() => setIsMapExpanded(true)}
                className="dash-btn-ghost !text-xs"
              >
                Expand
                <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              </button>
            </div>
            <div className="h-[480px] px-2 pb-2">
              <AdminMap onToggleExpand={() => setIsMapExpanded(true)} />
            </div>
          </DashCard>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-4">
          <DashCard className="flex-1">
            <DashCardHeader
              title="Priority queue"
              subtitle="Critical & high severity first"
              icon="psychology"
              action={
                aiQueue.length > 0 ? (
                  <span className="dash-chip bg-emerald-50 text-emerald-700">
                    {aiQueue.length} open
                  </span>
                ) : null
              }
            />

            <div className="space-y-2.5">
              {aiQueue.length > 0 ? (
                aiQueue.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push('/admin/issues')}
                    className="w-full group flex items-center gap-3 rounded-xl border border-[var(--outline-variant)] bg-surface/50 p-3 text-left hover:border-primary/25 hover:bg-white transition-all"
                  >
                    <span className="text-xs font-bold text-slate-300 w-5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-outline/30">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                          {item.category}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            SEVERITY_BADGE_CLASS[item.severity || 'Medium'] ||
                            SEVERITY_BADGE_CLASS.Medium
                          }`}
                        >
                          {item.severity || 'Medium'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold truncate text-on-surface">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Score{' '}
                        {(item as { ai_score?: number; priority_score?: number }).ai_score ??
                          (item as { priority_score?: number }).priority_score ??
                          '—'}{' '}
                        · {item.status}
                        {item.department ? ` · ${item.department}` : ''}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[var(--outline-variant)] rounded-xl">
                  <span className="material-symbols-outlined text-3xl text-outline/30 mb-2">
                    task_alt
                  </span>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    No priority alerts
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push('/admin/issues')}
              className="mt-4 w-full dash-btn-secondary"
            >
              View all issues ({issues.length})
            </button>
          </DashCard>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="dash-section-title">Department ecosystem</h2>
          <button
            type="button"
            onClick={() => router.push('/admin/analytics')}
            className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:underline"
          >
            Analytics
            <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              dept: 'Public Works',
              efficiency: 82,
              reports: issues.filter((i) =>
                ['road', 'roads'].includes((i.category || '').toLowerCase())
              ).length,
              icon: 'construction',
              tone: 'warning' as const,
            },
            {
              dept: 'Power & Grid',
              efficiency: 65,
              reports: issues.filter((i) =>
                ['electricity', 'electric'].includes((i.category || '').toLowerCase())
              ).length,
              icon: 'bolt',
              tone: 'error' as const,
            },
            {
              dept: 'Water Supply',
              efficiency: 71,
              reports: issues.filter((i) =>
                (i.category || '').toLowerCase() === 'water'
              ).length,
              icon: 'water_drop',
              tone: 'info' as const,
            },
            {
              dept: 'Waste Mgmt',
              efficiency: 94,
              reports: issues.filter((i) =>
                ['garbage', 'waste', 'sanitation'].includes((i.category || '').toLowerCase())
              ).length,
              icon: 'delete_sweep',
              tone: 'primary' as const,
            },
          ].map((item) => (
            <DashCard key={item.dept} hover>
              <div className="flex justify-between items-start mb-4">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </div>
                <div className="text-right">
                  <p className="dash-label">Reports</p>
                  <p className="text-xl font-bold text-on-surface tabular-nums">{item.reports}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{item.dept}</span>
                  <span className="text-primary">{item.efficiency}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full rounded-full signature-gradient transition-all duration-700"
                    style={{ width: `${item.efficiency}%` }}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Resolution efficacy for categorized requests.
                </p>
              </div>
            </DashCard>
          ))}
        </div>
      </div>

      {/* Portal to body so the map is not clipped by the admin sidebar stacking context */}
      {portalReady &&
        isMapExpanded &&
        createPortal(
          <div
            className="fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded operations map"
          >
            <div
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-md"
              onClick={() => setIsMapExpanded(false)}
            />
            <div className="relative z-10 w-full h-full max-w-[1600px] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-4rem)] bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10001] bg-white/95 backdrop-blur px-5 py-2 rounded-full border border-[var(--outline-variant)] shadow-lg flex items-center gap-3 max-w-[min(90%,28rem)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface truncate">
                  Geospatial intelligence
                </h3>
                <span className="h-3 w-px bg-slate-200 shrink-0" />
                <span className="text-[10px] font-bold text-on-surface-variant shrink-0">
                  {issues.length} records
                </span>
              </div>
              <div className="flex-1 min-h-0 w-full h-full">
                <AdminMap isExpanded onToggleExpand={() => setIsMapExpanded(false)} />
              </div>
              <button
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="absolute top-4 right-4 z-[10001] h-11 w-11 rounded-full bg-white shadow-lg border border-[var(--outline-variant)] flex items-center justify-center hover:bg-surface-container-low"
                aria-label="Close expanded map"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>,
          document.body
        )}

      <TaskForceModal
        isOpen={isTaskForceModalOpen}
        onClose={() => setIsTaskForceModalOpen(false)}
        preSelectedIssues={taskForceIssues}
        onSuccess={handleTaskForceSuccess}
      />
    </div>
  );
}
