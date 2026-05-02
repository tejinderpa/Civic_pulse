'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Issue, TaskForceResult } from '@/types/issue';
import { IssueTable } from '@/components/admin/IssueTable';
import { fetchAdminIssues } from '@/app/actions/admin';
import { TaskForceModal } from '@/components/admin/TaskForceModal';

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'originals' | 'duplicates'>('all');
  
  // Feature State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isTaskForceModalOpen, setIsTaskForceModalOpen] = useState(false);
  const [taskForceIssues, setTaskForceIssues] = useState<Issue[]>([]);

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminIssues(searchQuery);
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [searchQuery]);

  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      if (duplicateFilter === 'duplicates') return i.duplicate_of !== null;
      if (duplicateFilter === 'originals') return i.duplicate_of === null;
      return true;
    });
  }, [issues, duplicateFilter]);

  async function handleExportReport() {
    console.log('[Export] Triggering export handler...');
    const issuesToExport = selectedIds.size > 0
      ? issues.filter(i => selectedIds.has(i.id))
      : filteredIssues;

    if (issuesToExport.length === 0) {
      alert('No issues to export. Apply filters or select rows.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueIds: issuesToExport.map(i => i.id) })
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

      const scope = selectedIds.size > 0 ? 'selected' : 'filtered';
      console.log(`[Export] ${issuesToExport.length} ${scope} issues exported successfully`);
    } catch (err) {
      console.error('[Export] Failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  const handleOpenTaskForce = () => {
    console.log('[TaskForce] Triggering modal handler...');
    const issuesToAssign = selectedIds.size > 0
      ? issues.filter(i => selectedIds.has(i.id))
      : issues
          .filter(i => (i.ai_score && i.ai_score > 70) || i.severity === 'Critical')
          .filter(i => i.status !== 'Resolved' && i.status !== 'Rejected')
          .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
          .slice(0, 8);

    if (issuesToAssign.length === 0) {
      alert('No high-priority issues found automatically. Please select issues manually.');
      return;
    }

    setTaskForceIssues(issuesToAssign);
    setIsTaskForceModalOpen(true);
  };

  const handleTaskForceSuccess = (result: TaskForceResult) => {
    // Update local state without full re-fetch
    setIssues(prevIssues => 
      prevIssues.map(issue => {
        if (taskForceIssues.some(ti => ti.id === issue.id)) {
          return {
            ...issue,
            task_force_id: result.taskForceId,
            status: issue.status === 'Submitted' ? 'Under Review' : issue.status
          };
        }
        return issue;
      })
    );
    setSelectedIds(new Set());
  };

  const handleSelectIssue = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(issues.map(i => i.id)));
    else setSelectedIds(new Set());
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--primary)] font-[var(--font-plus-jakarta)] mb-2">Issue Management</h1>
          <p className="text-[var(--on-surface-variant)] font-medium max-w-lg">Advanced filtering and governance for district-wide reports.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex bg-[var(--surface-container-low)] rounded-2xl p-1 border border-[var(--outline-variant)]">
            <button 
              onClick={() => setDuplicateFilter('all')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${duplicateFilter === 'all' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'}`}
            >
              All
            </button>
            <button 
              onClick={() => setDuplicateFilter('originals')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${duplicateFilter === 'originals' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'}`}
            >
              Originals
            </button>
            <button 
              onClick={() => setDuplicateFilter('duplicates')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${duplicateFilter === 'duplicates' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'}`}
            >
              Duplicates
            </button>
          </div>
          <div className="relative flex-1 sm:min-w-[200px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] opacity-40">search</span>
            <input 
              type="text"
              placeholder="Search by ID, Title, or Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--outline-variant)] rounded-2xl text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none shadow-sm"
            />
          </div>
          <button 
            disabled={isExporting || (issues.length === 0 && selectedIds.size === 0)}
            onClick={handleExportReport}
            className="px-6 py-3 rounded-2xl bg-white border border-[var(--outline-variant)] font-bold text-sm text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span> Export Report
              </>
            )}
          </button>
          <button 
            onClick={handleOpenTaskForce}
            className="px-6 py-3 rounded-2xl bg-[#0D2D1C] text-white font-bold text-sm hover:scale-[1.02] shadow-xl shadow-emerald-900/10 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">groups</span> Establish Task Force
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-[var(--outline-variant)] shadow-sm overflow-hidden">
        <IssueTable 
          issues={filteredIssues} 
          isLoading={isLoading} 
          onViewDetails={(issue) => console.log('View', issue)}
          selectedIssues={Array.from(selectedIds)}
          onSelectIssue={handleSelectIssue}
          onSelectAll={handleSelectAll}
        />
      </div>

      <TaskForceModal 
        isOpen={isTaskForceModalOpen}
        onClose={() => setIsTaskForceModalOpen(false)}
        preSelectedIssues={taskForceIssues}
        onSuccess={handleTaskForceSuccess}
      />
    </div>
  );
}
