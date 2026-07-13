'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Issue, TaskForceResult } from '@/types/issue';
import { TaskForceModal } from '@/components/admin/TaskForceModal';
import { TaskForceDetailDrawer } from '@/components/admin/TaskForceDetailDrawer';
import { fetchAdminIssues } from '@/app/actions/admin';

interface TaskForce {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  description?: string;
  issueCount: number;
  recentIssues: string[];
  priority: string;
  progress?: number;
}

export default function TaskForcesPage() {
  const [taskForces, setTaskForces] = useState<TaskForce[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createIssues, setCreateIssues] = useState<Issue[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadTaskForces = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/task-forces');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTaskForces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching task forces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaskForces();
  }, [loadTaskForces]);

  const openCreateModal = async () => {
    // Preload open, unassigned-preferring issues for the new task force
    try {
      const all = await fetchAdminIssues('');
      const open = (all || []).filter(
        (i) => i.status !== 'Resolved' && i.status !== 'Rejected'
      );
      const preferred = open.filter((i) => !i.task_force_id);
      const pool = preferred.length > 0 ? preferred : open;
      setCreateIssues(pool.slice(0, 10));
    } catch {
      setCreateIssues([]);
    }
    setIsCreateOpen(true);
  };

  const handleCreateSuccess = (_result: TaskForceResult) => {
    loadTaskForces();
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const totalIssues = taskForces.reduce((acc, tf) => acc + tf.issueCount, 0);
  const avgProgress =
    taskForces.length > 0
      ? Math.round(
          taskForces.reduce((acc, tf) => acc + (tf.progress || 0), 0) / taskForces.length
        )
      : 0;
  const activeCount = taskForces.filter((tf) => tf.status === 'active').length;

  return (
    <div className="animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface">
            Task Forces
          </h2>
          <p className="text-on-surface-variant max-w-lg font-medium">
            Create units, assign citizen reports, and track how each team is progressing.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="signature-gradient text-on-primary px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/10 hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">group_add</span>
          Add New Task Force
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between h-44">
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">
            Active task forces
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">{activeCount}</span>
            <span className="text-on-surface-variant font-medium text-sm">
              of {taskForces.length} total
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between h-44">
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">
            Issues managed
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">{totalIssues}</span>
            <span className="text-on-surface-variant font-medium text-sm ml-1">
              linked reports
            </span>
          </div>
        </div>
        <div className="bg-primary text-on-primary p-8 rounded-xl flex flex-col justify-between h-44 signature-gradient shadow-2xl shadow-primary/20">
          <span className="text-on-primary/70 font-bold text-sm tracking-widest uppercase">
            Avg. resolution
          </span>
          <div>
            <span className="text-5xl font-extrabold">{avgProgress}%</span>
            <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-white h-full" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
          Active projects
          <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs font-bold">
            {taskForces.length}
          </span>
        </h3>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[320px] bg-surface-container-low animate-pulse rounded-xl" />
          ))
        ) : taskForces.length === 0 ? (
          <div className="lg:col-span-2 xl:col-span-3 py-20 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl mb-4 text-on-surface-variant opacity-50">
              groups
            </span>
            <h4 className="font-bold text-on-surface text-lg">No task forces yet</h4>
            <p className="text-sm text-on-surface-variant max-w-md mt-2 mb-6">
              Create a task force and assign citizen reports so teams can track progress.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="signature-gradient text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined">group_add</span>
              Add New Task Force
            </button>
          </div>
        ) : (
          taskForces.map((tf) => (
            <div
              key={tf.id}
              className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    tf.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {tf.status}
                </span>
                <span className="text-on-surface-variant text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">folder</span>{' '}
                  {tf.issueCount} issues
                </span>
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2 pt-1">{tf.name}</h4>
              <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">
                {tf.description ||
                  (tf.recentIssues?.length
                    ? `Working on: ${tf.recentIssues.filter(Boolean).slice(0, 2).join(' · ')}`
                    : 'No reports linked yet.')}
              </p>
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface-variant">PROGRESS</span>
                  <span className="text-primary">{tf.progress || 0}%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-700"
                    style={{ width: `${tf.progress || 0}%` }}
                  />
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {tf.createdAt
                    ? new Date(tf.createdAt).toLocaleDateString()
                    : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => openDetail(tf.id)}
                  className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  View progress{' '}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Quick-add card */}
        {!loading && (
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-surface-container-lowest p-6 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center space-y-4 min-h-[280px] hover:border-primary/40 hover:bg-emerald-50/30 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                group_add
              </span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Add New Task Force</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Cluster open reports into a dedicated response unit.
              </p>
            </div>
          </button>
        )}
      </section>

      <TaskForceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        preSelectedIssues={createIssues}
        onSuccess={handleCreateSuccess}
      />

      <TaskForceDetailDrawer
        taskForceId={detailId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onIssueUpdated={loadTaskForces}
      />
    </div>
  );
}
