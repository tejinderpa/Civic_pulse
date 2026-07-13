'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsResponse } from '@/types/analytics';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { reportsCache } from '@/lib/cache/reports-cache';
import { ensureReportsSynced } from '@/lib/cache/reports-sync';
import { buildAnalyticsFromReports } from '@/lib/analytics-queries';

// Charts load async — page shell paints faster
const IssueVolumeChart = dynamic(
  () => import('@/components/admin/analytics/IssueVolumeChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const CategoryPieChart = dynamic(
  () => import('@/components/admin/analytics/CategoryPieChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const DepartmentBarChart = dynamic(
  () => import('@/components/admin/analytics/DepartmentBarChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const ResolutionAreaChart = dynamic(
  () => import('@/components/admin/analytics/ResolutionAreaChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const TopAreasChart = dynamic(
  () => import('@/components/admin/analytics/TopAreasChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const HeatmapSection = dynamic(
  () => import('@/components/admin/analytics/HeatmapSection'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-2xl bg-white/60 border border-slate-100 animate-pulse" />
    ),
  }
);

function ChartSkeleton() {
  return <div className="h-[280px] rounded-xl bg-slate-50 animate-pulse" />;
}

const SESSION_KEY = 'civicpulse_analytics_v1';

function sessionKey(days: string) {
  return `${SESSION_KEY}_${days}`;
}

function readSession(days: string): AnalyticsResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(sessionKey(days));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: AnalyticsResponse };
    if (Date.now() - parsed.at > 5 * 60_000) return null; // 5 min
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSession(days: string, data: AnalyticsResponse) {
  try {
    sessionStorage.setItem(sessionKey(days), JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota */
  }
}

function fromReportsCache(days: string): AnalyticsResponse | null {
  reportsCache.hydrate();
  if (reportsCache.size() === 0) return null;
  const start = new Date(Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date().toISOString();
  const rows = reportsCache.getAll() as unknown as Record<string, unknown>[];
  return buildAnalyticsFromReports(rows, { startDate: start, endDate: end });
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('90');
  const [data, setData] = useState<AnalyticsResponse | null>(() => {
    if (typeof window === 'undefined') return null;
    return readSession('90') || fromReportsCache('90');
  });
  const [isLoading, setIsLoading] = useState(() => !data);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'cache' | 'session' | 'network'>('cache');

  const supabase = useMemo(() => createClient(), []);

  const fetchAnalytics = useCallback(
    async (days: string, opts?: { background?: boolean }) => {
      const background = opts?.background ?? false;
      if (!background) {
        // Instant path: session → reports cache
        const sess = readSession(days);
        if (sess) {
          setData(sess);
          setIsLoading(false);
          setSource('session');
        } else {
          const local = fromReportsCache(days);
          if (local) {
            setData(local);
            setIsLoading(false);
            setSource('cache');
          } else if (!data) {
            setIsLoading(true);
          }
        }
      }

      setIsValidating(true);
      setError(null);
      try {
        // Warm reports cache in parallel (helps other pages + next analytics visit)
        void ensureReportsSynced(supabase);

        const start = new Date(
          Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000
        ).toISOString();
        const end = new Date().toISOString();
        const res = await fetch(
          `/api/admin/analytics?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
        setData(json);
        writeSession(days, json);
        setSource('network');
      } catch (err) {
        console.error('Fetch analytics error:', err);
        // Keep showing cache if we have it
        if (!data) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [supabase, data]
  );

  useEffect(() => {
    // Prefer instant local paint when switching ranges
    const local = readSession(dateRange) || fromReportsCache(dateRange);
    if (local) {
      setData(local);
      setIsLoading(false);
      setSource(readSession(dateRange) ? 'session' : 'cache');
    }
    void fetchAnalytics(dateRange, { background: Boolean(local) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleExport = () => {
    if (!data) return;
    const k = data.kpis;
    const rows = [
      ['Metric', 'Value'],
      ['Period (days)', dateRange],
      ['Total Issues', String(k.totalIssues)],
      ['Open Issues', String(k.openIssues)],
      ['Resolved Rate %', String(k.resolvedPercent)],
      ['Avg Resolution Hours', String(k.avgResolutionHours)],
      ['SLA Compliance %', String(k.slaCompliancePercent)],
      ['Duplicates Flagged', String(k.duplicatesFlagged)],
      ['Duplicates Auto-Rejected', String(k.duplicatesAutoRejected)],
      ['Total Rejected', String(k.totalRejected)],
      ['Duplicate Rate %', String(k.duplicateRate)],
      ...data.hotspotZones.map((h) => [
        `Hotspot: ${h.label}`,
        `${h.count} reports (${h.openCount} open)`,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civicpulse_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpis = data?.kpis;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 sm:space-y-8 pb-16">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-1">
            Authority · Insights
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-[var(--font-plus-jakarta)] text-[#0D2D1C]">
            Analytics & intelligence
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-xl">
            {isValidating
              ? 'Refreshing from server…'
              : source === 'network'
                ? 'Live metrics from citizen reports.'
                : source === 'session'
                  ? 'Loaded from session cache · verifying latest…'
                  : 'Built from local report cache · verifying latest…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex gap-0.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {[
              { d: '7', label: '7D' },
              { d: '30', label: '30D' },
              { d: '90', label: '90D' },
              { d: '365', label: '1Y' },
            ].map(({ d, label }) => (
              <button
                key={d}
                type="button"
                onClick={() => setDateRange(d)}
                className={`px-3.5 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  dateRange === d
                    ? 'bg-primary text-white shadow-md shadow-emerald-900/15'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(dateRange, { background: false })}
            className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
            title="Refresh"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${isValidating ? 'animate-spin' : ''}`}
            >
              refresh
            </span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!data}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-xs font-black uppercase tracking-wider text-[#0D2D1C] disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </header>

      {error && !data && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          label="Total reports"
          value={kpis?.totalIssues ?? 0}
          icon="assignment"
          accentColor="#3B82F6"
          isLoading={isLoading && !data}
        />
        <StatCard
          label="Open / active"
          value={kpis?.openIssues ?? 0}
          icon="pending_actions"
          accentColor="#F59E0B"
          isLoading={isLoading && !data}
        />
        <StatCard
          label="Resolved rate"
          value={`${kpis?.resolvedPercent?.toFixed(1) ?? 0}%`}
          icon="verified"
          accentColor="#10B981"
          isLoading={isLoading && !data}
        />
        <StatCard
          label="Avg resolution"
          value={
            kpis && kpis.avgResolutionHours > 0
              ? `${kpis.avgResolutionHours}h`
              : kpis?.totalIssues
                ? '—'
                : '0h'
          }
          icon="schedule"
          accentColor="#8B5CF6"
          isLoading={isLoading && !data}
        />
        <StatCard
          label="Auto-rejected dups"
          value={kpis?.duplicatesAutoRejected ?? 0}
          icon="block"
          accentColor="#DC2626"
          isLoading={isLoading && !data}
        />
        <StatCard
          label="Dup flag rate"
          value={`${kpis?.duplicateRate?.toFixed(1) ?? 0}%`}
          icon="content_copy"
          accentColor="#64748B"
          isLoading={isLoading && !data}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="md:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80 mb-1">
            Duplicate defense
          </p>
          <p className="text-sm font-medium text-white/70 leading-relaxed">
            How the platform collapses repeat noise before it reaches operations.
          </p>
        </div>
        <div className="grid grid-cols-3 md:col-span-3 gap-3 sm:gap-4">
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Flagged</p>
            <p className="text-2xl font-black mt-1 tabular-nums">
              {isLoading && !data ? '…' : kpis?.duplicatesFlagged ?? 0}
            </p>
            <p className="text-[11px] text-white/50 mt-1">linked via duplicate_of</p>
          </div>
          <div className="rounded-xl bg-red-500/20 border border-red-400/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-200/80">
              Auto-rejected
            </p>
            <p className="text-2xl font-black mt-1 tabular-nums text-red-100">
              {isLoading && !data ? '…' : kpis?.duplicatesAutoRejected ?? 0}
            </p>
            <p className="text-[11px] text-white/50 mt-1">rejected by system / staff</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              All rejected
            </p>
            <p className="text-2xl font-black mt-1 tabular-nums">
              {isLoading && !data ? '…' : kpis?.totalRejected ?? 0}
            </p>
            <p className="text-[11px] text-white/50 mt-1">any rejection reason</p>
          </div>
        </div>
      </div>

      <HeatmapSection
        points={data?.allIssuePoints || []}
        hotspots={data?.hotspotZones || []}
        mapCenter={data?.mapCenter}
        mapZoom={data?.mapZoom}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm min-h-[340px]">
          <IssueVolumeChart data={data?.volumeTrend || []} />
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm min-h-[340px]">
          <CategoryPieChart data={data?.categoryStats || []} />
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm min-h-[340px]">
          <DepartmentBarChart data={data?.departmentStats || []} />
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm min-h-[340px]">
          <ResolutionAreaChart data={data?.resolutionRateTrend || []} />
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm min-h-[340px] lg:col-span-2">
          <TopAreasChart data={data?.topAreas || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Priority queue</h3>
                <p className="text-xs text-slate-400 font-medium">Open issues by score</p>
              </div>
            </div>
            <Badge variant="warning" dot>
              Action
            </Badge>
          </div>

          <div className="space-y-2.5">
            {isLoading && !data && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-slate-50 animate-pulse" />
                ))}
              </div>
            )}
            {!isLoading && (data?.priorityIssues || []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 font-medium">
                No open priority items in this period.
              </div>
            )}
            {(data?.priorityIssues || []).map((issue, i) => (
              <div
                key={issue.id}
                className="p-3.5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-all"
              >
                <span className="text-lg font-black text-slate-200 w-6 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate text-slate-900">{issue.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{issue.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black tabular-nums">
                    {issue.aiScore}
                  </span>
                  <Badge variant={issue.severity === 'Critical' ? 'critical' : 'warning'}>
                    {issue.severity}
                  </Badge>
                </div>
              </div>
            ))}
            <Link
              href="/admin/issues"
              className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-primary hover:underline py-2"
            >
              Open issue management
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <span className="material-symbols-outlined">dynamic_feed</span>
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Duplicate clusters</h3>
                <p className="text-xs text-slate-400 font-medium">Auto-grouped by original report</p>
              </div>
            </div>
            <Badge variant="neutral">{data?.duplicateClusters?.length ?? 0} clusters</Badge>
          </div>

          <div className="space-y-2.5">
            {!isLoading && (data?.duplicateClusters || []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 px-4 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  No duplicate clusters in this period
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  When citizens file near-identical reports, they are linked and can be
                  auto-rejected. Rejected totals still appear in the KPI strip above.
                </p>
                {(kpis?.totalRejected ?? 0) > 0 && (
                  <p className="mt-4 text-sm font-bold text-red-600">
                    {kpis?.totalRejected} rejected report
                    {(kpis?.totalRejected ?? 0) === 1 ? '' : 's'} in range
                  </p>
                )}
              </div>
            )}
            {(data?.duplicateClusters || []).map((cluster) => (
              <div
                key={cluster.duplicateOf}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm truncate mb-0.5">{cluster.mainTitle}</h4>
                  <p className="text-xs text-slate-400 truncate">{cluster.address}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-50 px-2 py-1 rounded-lg border border-violet-100">
                    {cluster.count} dups
                  </span>
                  {cluster.autoRejected > 0 && (
                    <span className="text-[10px] font-bold text-red-600">
                      {cluster.autoRejected} auto-rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
