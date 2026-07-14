'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DashStat } from '@/components/dashboard/DashStat';
import { SegmentedControl } from '@/components/dashboard/SegmentedControl';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCachedReports, reportsCache } from '@/hooks/useCachedReports';

const CommunityMap = dynamic(() => import('@/components/CommunityMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-surface-container-low animate-pulse rounded-2xl" />,
});

type ReportRow = Record<string, unknown> & {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  location?: string;
  image_url?: string;
  imageUrl?: string;
  created_at?: string;
  severity?: string;
  priority_score?: number;
  ai_score?: number;
  department?: string;
};

export default function MyReportsPage() {
  const supabase = createClient();
  const router = useRouter();
  const {
    reports,
    loading: cacheLoading,
    reload,
    isValidating,
  } = useCachedReports({ scope: 'mine' });

  const issues = useMemo(() => reports as unknown as ReportRow[], [reports]);
  const [selectedIssue, setSelectedIssue] = useState<ReportRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'map'>('card');
  const [copied, setCopied] = useState(false);
  const [userCenter, setUserCenter] = useState<[number, number] | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(cacheLoading && issues.length === 0);
  }, [cacheLoading, issues.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.user_metadata?.location || cancelled) return;
      try {
        const gRes = await fetch(
          `/api/maps/search?q=${encodeURIComponent(user.user_metadata.location)}`
        );
        const gData = await gRes.json();
        const first = Array.isArray(gData) ? gData[0] : null;
        if (first?.lat && first?.lon && !cancelled) {
          setUserCenter([parseFloat(first.lat), parseFloat(first.lon)]);
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const fetchReports = () => reload();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const progressPath = (id: string) => `/issues/${id}`;
  const progressAbsoluteUrl = (id: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}${progressPath(id)}`
      : progressPath(id);

  const openProgress = (issue: ReportRow) => {
    setSelectedIssue(null);
    router.push(progressPath(issue.id));
  };

  const shareProgress = async (issue: ReportRow) => {
    setActionError(null);
    const url = progressAbsoluteUrl(issue.id);
    const title = issue.title || 'CivicPulse report progress';
    const text = `Track progress: ${title}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Fallback: navigate to progress page where link is visible
      openProgress(issue);
    }
  };

  const deleteIssue = async (issue: ReportRow) => {
    setActionError(null);
    const ok = window.confirm(
      `Delete "${issue.title || 'this report'}" permanently? This cannot be undone.`
    );
    if (!ok) return;

    setDeletingId(issue.id);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'Failed to delete report');
        setDeletingId(null);
        return;
      }
      reportsCache.remove(issue.id);
      if (selectedIssue?.id === issue.id) setSelectedIssue(null);
    } catch {
      setActionError('Network error while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const displayIssues = issues;
  const totalReports = displayIssues?.length || 0;
  const pendingReports =
    displayIssues?.filter((i) => {
      const s = (i.status || '').toLowerCase();
      return s === 'pending' || s === 'submitted' || s === 'under review';
    }).length || 0;
  const inProgressReports =
    displayIssues?.filter((i) => (i.status || '').toLowerCase() === 'in progress').length || 0;
  const resolvedReports =
    displayIssues?.filter((i) => (i.status || '').toLowerCase() === 'resolved').length || 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full pb-28">
      <PageHeader
        title="My Reports"
        hideTitle
        subtitle="Track contributions, share progress links, or delete reports you no longer need."
        actions={
          <SegmentedControl
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            options={[
              { value: 'card' as const, label: 'History', icon: 'list_alt' },
              { value: 'map' as const, label: 'Map', icon: 'map' },
            ]}
          />
        }
      />

      {actionError && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium flex items-start gap-2">
          <span className="material-symbols-outlined text-lg shrink-0">error</span>
          <span>{actionError}</span>
          <button
            type="button"
            className="ml-auto text-red-400 hover:text-red-600"
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {copied && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold text-center">
          Progress link copied to clipboard
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <DashStat label="Total" value={totalReports} icon="inventory_2" tone="primary" />
        <DashStat label="Pending" value={pendingReports} icon="hourglass_empty" tone="neutral" />
        <DashStat label="In progress" value={inProgressReports} icon="engineering" tone="info" />
        <DashStat label="Resolved" value={resolvedReports} icon="task_alt" tone="primary" />
      </div>

      {viewMode === 'card' ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-container-low animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : !displayIssues || displayIssues.length === 0 ? (
            <div className="text-center py-16 dash-card border-dashed">
              <span className="material-symbols-outlined text-outline/25 text-5xl mb-3">
                move_to_inbox
              </span>
              <h3 className="text-lg font-bold text-on-surface mb-2">Nothing reported yet</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                File your first civic report to track it here.
              </p>
              <Link href="/report" className="dash-btn-primary">
                New Report
              </Link>
            </div>
          ) : (
            displayIssues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onOpen={() => setSelectedIssue(issue)}
                onViewProgress={() => openProgress(issue)}
                onShare={() => shareProgress(issue)}
                onDelete={() => deleteIssue(issue)}
                deleting={deletingId === issue.id}
              />
            ))
          )}
        </div>
      ) : (
        <div className="w-full h-[600px] mb-20">
          <CommunityMap
            items={displayIssues}
            onItemClick={setSelectedIssue}
            center={userCenter}
          />
        </div>
      )}

      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedIssue(null)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[90vh] shadow-2xl border border-[var(--outline-variant)]">
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute top-4 right-4 z-10 h-9 w-9 bg-white rounded-xl flex items-center justify-center text-on-surface-variant shadow border border-[var(--outline-variant)]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="relative w-full md:w-[42%] h-[220px] md:h-auto md:min-h-[400px] bg-surface-container-low">
              {selectedIssue.image_url || selectedIssue.imageUrl ? (
                <Image
                  src={(selectedIssue.image_url || selectedIssue.imageUrl) as string}
                  alt="Case Proof"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-outline/20">
                  <span className="material-symbols-outlined text-7xl">image</span>
                </div>
              )}
            </div>
            <div className="flex-1 p-6 md:p-8 overflow-y-auto dash-scroll">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="dash-chip bg-emerald-50 text-emerald-800">
                  {selectedIssue.category || 'Issue'}
                </span>
                <span className="dash-chip bg-slate-100 text-slate-700">
                  {selectedIssue.status || 'Draft'}
                </span>
                <span className="dash-chip bg-amber-50 text-amber-800">
                  {selectedIssue.severity || 'Medium'} priority
                </span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface font-headline mb-3">
                {selectedIssue.title || selectedIssue.description}
              </h2>
              <div className="mb-6 p-4 bg-surface-container-low rounded-xl text-sm text-on-surface-variant leading-relaxed">
                {selectedIssue.description ||
                  'The community has flagged this concern for civil review.'}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="dash-label mb-1">Location</p>
                  <p className="font-semibold text-sm text-on-surface truncate">
                    {selectedIssue.location as string}
                  </p>
                </div>
                <div>
                  <p className="dash-label mb-1">Submitted</p>
                  <p className="font-semibold text-sm text-on-surface">
                    {selectedIssue.created_at
                      ? new Date(selectedIssue.created_at as string).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="dash-label mb-1">Priority score</p>
                  <p className="font-semibold text-sm text-on-surface">
                    {selectedIssue.priority_score ?? selectedIssue.ai_score ?? '—'}
                    {(selectedIssue.priority_score != null || selectedIssue.ai_score != null) &&
                      '/100'}
                  </p>
                </div>
                <div>
                  <p className="dash-label mb-1">Department</p>
                  <p className="font-semibold text-sm text-on-surface truncate">
                    {selectedIssue.department || 'Awaiting assignment'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => openProgress(selectedIssue)}
                  className="w-full dash-btn-primary !py-3.5"
                >
                  <span className="material-symbols-outlined text-[18px]">timeline</span>
                  View / share progress
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => shareProgress(selectedIssue)}
                    className="dash-btn-secondary !py-3"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteIssue(selectedIssue)}
                    disabled={deletingId === selectedIssue.id}
                    className="dash-btn-danger !py-3 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    {deletingId === selectedIssue.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueRow({
  issue,
  onOpen,
  onViewProgress,
  onShare,
  onDelete,
  deleting,
}: {
  issue: ReportRow;
  onOpen: () => void;
  onViewProgress: () => void;
  onShare: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="dash-card-hover !p-4 md:!p-5 flex flex-col sm:flex-row gap-4">
      <button type="button" onClick={onOpen} className="flex flex-1 gap-4 text-left min-w-0">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-surface-container-low flex-shrink-0 relative overflow-hidden flex items-center justify-center text-outline">
          {issue.image_url || issue.imageUrl ? (
            <Image
              src={(issue.image_url || issue.imageUrl) as string}
              alt="Proof"
              fill
              className="object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-3xl">image</span>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="dash-chip bg-emerald-50 text-emerald-800 !text-[9px]">
                {issue.category || 'Issue'}
              </span>
              <span className="dash-chip bg-amber-50 text-amber-800 !text-[9px]">
                {issue.severity || 'Medium'}
              </span>
            </div>
            <h4 className="text-base font-bold text-on-surface mt-1.5 line-clamp-1">
              {issue.title || issue.description}
            </h4>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 truncate">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {issue.location}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                {issue.status || 'Pending'}
              </span>
            </div>
            {(issue.priority_score != null || issue.ai_score != null) && (
              <span className="text-[11px] font-bold text-on-surface-variant tabular-nums">
                Score {issue.priority_score ?? issue.ai_score}
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="flex sm:flex-col gap-2 sm:justify-center shrink-0">
        <button
          type="button"
          onClick={onViewProgress}
          className="flex-1 sm:flex-none dash-btn-primary !py-2 !px-3 !text-xs"
          title="View progress page"
        >
          <span className="material-symbols-outlined text-[16px]">timeline</span>
          Progress
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex-1 sm:flex-none dash-btn-secondary !py-2 !px-3 !text-xs"
          title="Share progress link"
        >
          <span className="material-symbols-outlined text-[16px]">share</span>
          Share
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="flex-1 sm:flex-none dash-btn-danger !py-2 !px-3 !text-xs disabled:opacity-50"
          title="Delete report"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
