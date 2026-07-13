'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Issue, TaskForceResult } from '@/types/issue';
import { IssueTable } from '@/components/admin/IssueTable';
import { TaskForceModal } from '@/components/admin/TaskForceModal';
import { IssueDetailDrawer } from '@/components/shared/IssueDetailDrawer';
import { useCachedReports, patchReportLocal } from '@/hooks/useCachedReports';

export default function AdminIssuesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[var(--primary)] animate-spin" />
        </div>
      }
    >
      <AdminIssuesPageInner />
    </Suspense>
  );
}

function AdminIssuesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deepLinkId = searchParams.get('id');

  const { reports, loading, reload, isValidating } = useCachedReports({ scope: 'all' });
  const issues = reports as unknown as Issue[];
  const isLoading = loading && issues.length === 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'originals' | 'duplicates'>('all');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isTaskForceModalOpen, setIsTaskForceModalOpen] = useState(false);
  const [taskForceIssues, setTaskForceIssues] = useState<Issue[]>([]);

  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Deep-link from notifications: /admin/issues?id=...
  useEffect(() => {
    if (!deepLinkId || issues.length === 0) return;
    const found = issues.find((i) => i.id === deepLinkId);
    if (found) {
      setDetailIssue(found);
      setIsDrawerOpen(true);
    }
  }, [deepLinkId, issues]);

  // Keep drawer in sync with cache updates
  useEffect(() => {
    setDetailIssue((prev) => {
      if (!prev) return prev;
      return issues.find((i) => i.id === prev.id) || prev;
    });
  }, [issues]);

  // Debounce search input → query
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return issues.filter((i) => {
      if (duplicateFilter === 'duplicates' && i.duplicate_of == null) return false;
      if (duplicateFilter === 'originals' && i.duplicate_of != null) return false;
      if (!q) return true;
      return (
        (i.title || '').toLowerCase().includes(q) ||
        (i.location || i.address || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
    });
  }, [issues, duplicateFilter, searchQuery]);

  async function handleExportReport() {
    const issuesToExport =
      selectedIds.size > 0 ? issues.filter((i) => selectedIds.has(i.id)) : filteredIssues;

    if (issuesToExport.length === 0) {
      alert('No issues to export. Apply filters or select rows.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueIds: issuesToExport.map((i) => i.id) }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civicpulse-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Export] Failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  const handleOpenTaskForce = (fromIssues?: Issue[]) => {
    const openIssues = issues.filter(
      (i) => i.status !== 'Resolved' && i.status !== 'Rejected'
    );

    const issuesToAssign =
      fromIssues && fromIssues.length > 0
        ? fromIssues
        : selectedIds.size > 0
          ? issues.filter((i) => selectedIds.has(i.id))
          : [...openIssues]
              .sort((a, b) => {
                const scoreDiff = (b.ai_score || 0) - (a.ai_score || 0);
                if (scoreDiff !== 0) return scoreDiff;
                const sevRank = (s: string | undefined) =>
                  s === 'Critical' ? 4 : s === 'High' ? 3 : s === 'Medium' ? 2 : 1;
                return sevRank(b.severity) - sevRank(a.severity);
              })
              .slice(0, 8);

    if (issuesToAssign.length === 0) {
      alert(
        'No open issues available. Select reports from the table or wait for new citizen submissions.'
      );
      return;
    }

    setTaskForceIssues(issuesToAssign);
    setIsTaskForceModalOpen(true);
  };

  const handleTaskForceSuccess = (result: TaskForceResult) => {
    taskForceIssues.forEach((issue) => {
      patchReportLocal(issue.id, {
        task_force_id: result.taskForceId,
        status: issue.status === 'Submitted' ? 'Under Review' : issue.status,
      });
    });
    setSelectedIds(new Set());
  };

  const handleViewDetails = (issue: Issue) => {
    setDetailIssue(issue);
    setIsDrawerOpen(true);
  };

  const handleSelectIssue = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filteredIssues.map((i) => i.id)));
    else setSelectedIds(new Set());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const filterLabels: Record<typeof duplicateFilter, string> = {
    all: 'All',
    originals: 'Originals',
    duplicates: 'Duplicates',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--primary)] font-[var(--font-plus-jakarta)]">
            Issue Management
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] font-medium mt-1 max-w-xl">
            Assign task forces, update status, and track progress on citizen reports.
          </p>
        </div>
        <p className="text-xs font-bold text-[var(--on-surface-variant)]/70 tabular-nums shrink-0">
          {isLoading ? 'Loading…' : `${filteredIssues.length} report${filteredIssues.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Toolbar card */}
      <div className="rounded-2xl border border-[var(--outline-variant)] bg-white shadow-sm overflow-hidden">
        {/* Search row */}
        <div className="p-3 sm:p-4 border-b border-[var(--outline-variant)]/80">
          <form
            className="flex flex-col sm:flex-row gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchQuery(searchInput.trim());
            }}
          >
            <div className="relative flex-1 min-w-0 group">
              <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-[var(--on-surface-variant)]/50 group-focus-within:text-[var(--primary)] transition-colors">
                search
              </span>
              <input
                type="search"
                placeholder="Search by title, location, or description…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-11 pr-10 rounded-xl bg-[var(--surface-container-low)] border border-transparent text-sm font-medium text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/50 focus:bg-white focus:border-[var(--primary)]/30 focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all"
                aria-label="Search issues"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)] transition-colors"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-sm shadow-emerald-900/10 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Search
            </button>
          </form>
        </div>

        {/* Filters + actions row */}
        <div className="px-3 sm:px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div
            className="inline-flex self-start p-1 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/60"
            role="tablist"
            aria-label="Duplicate filter"
          >
            {(['all', 'originals', 'duplicates'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={duplicateFilter === key}
                onClick={() => setDuplicateFilter(key)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  duplicateFilter === key
                    ? 'bg-white text-[var(--primary)] shadow-sm ring-1 ring-black/5'
                    : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                }`}
              >
                {filterLabels[key]}
              </button>
            ))}
          </div>

          <div className="hidden lg:block h-6 w-px bg-[var(--outline-variant)]" />

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <button
              type="button"
              disabled={isExporting || (issues.length === 0 && selectedIds.size === 0)}
              onClick={handleExportReport}
              className="h-10 px-4 rounded-xl bg-white border border-[var(--outline-variant)] font-bold text-xs sm:text-sm text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOpenTaskForce()}
              className="h-10 px-4 rounded-xl bg-[#0D2D1C] text-white font-bold text-xs sm:text-sm hover:opacity-95 active:scale-[0.98] shadow-md shadow-emerald-900/10 transition-all inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">groups</span>
              {selectedIds.size > 0
                ? `Task force (${selectedIds.size})`
                : 'Establish Task Force'}
            </button>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-3">
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-black px-2">
            {selectedIds.size}
          </span>
          <span className="text-sm font-bold text-emerald-900">selected</span>
          <button
            type="button"
            onClick={() => handleOpenTaskForce()}
            className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
          >
            Assign to new task force
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-bold text-emerald-700/70 hover:underline ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl sm:rounded-[28px] border border-[var(--outline-variant)] shadow-sm overflow-hidden">
        <IssueTable
          issues={filteredIssues}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          selectedIssues={Array.from(selectedIds)}
          onSelectIssue={handleSelectIssue}
          onSelectAll={handleSelectAll}
        />
      </div>

      <IssueDetailDrawer
        issue={detailIssue}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          if (deepLinkId) {
            router.replace('/admin/issues');
          }
        }}
        onUpdate={() => reload()}
        onCreateTaskForce={(issue) => {
          setIsDrawerOpen(false);
          handleOpenTaskForce([issue]);
        }}
      />

      <TaskForceModal
        isOpen={isTaskForceModalOpen}
        onClose={() => setIsTaskForceModalOpen(false)}
        preSelectedIssues={taskForceIssues}
        onSuccess={handleTaskForceSuccess}
      />
    </div>
  );
}
