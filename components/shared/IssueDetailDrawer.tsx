'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Issue } from '@/types/issue';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import { DEPARTMENTS } from '@/lib/reports/departments';

const STATUS_ORDER = ['Submitted', 'Under Review', 'In Progress', 'Resolved'] as const;

type TaskForceOption = {
  id: string;
  name: string;
  status: string;
  issueCount?: number;
  progress?: number;
};

type HistoryEvent = {
  id: string;
  action_type: string;
  old_value?: string | null;
  new_value?: string | null;
  user_name?: string | null;
  created_at: string;
};

type AiSuggestion = {
  category: string;
  severity: string;
  department: string;
  priority_score: number;
  rationale: string;
  confidence: number;
  source: string;
  recommended_task_force_id: string | null;
  recommended_task_force_name: string | null;
  recommended_status: string;
  load_note: string;
};

type IssueDetailDrawerProps = {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  /** Open create-task-force modal with this issue preselected */
  onCreateTaskForce?: (issue: Issue) => void;
};

function progressIndex(status: string): number {
  const i = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  if (status === 'Rejected') return -1;
  return i >= 0 ? i : 0;
}

function formatAction(e: HistoryEvent): string {
  switch (e.action_type) {
    case 'submission':
    case 'created':
      return 'Report submitted';
    case 'status_change':
      return `Status → ${e.new_value || '—'}`;
    case 'task_force_assignment':
      return `Assigned to task force “${e.new_value || 'unit'}”`;
    case 'task_force_unassign':
      return 'Removed from task force';
    case 'department_assignment':
      return `Department → ${e.new_value || 'Unassigned'}`;
    case 'severity_update':
      return `Severity → ${e.new_value || '—'}`;
    case 'ai_suggestion_applied':
      return e.new_value
        ? `AI assignment approved: ${e.new_value}`
        : 'AI assignment approved';
    case 'note':
      return e.new_value ? `Note: ${e.new_value}` : 'Note added';
    default:
      return e.action_type.replace(/_/g, ' ');
  }
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  isOpen,
  onClose,
  onUpdate,
  onCreateTaskForce,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [priorityScore, setPriorityScore] = useState(0);
  const [taskForceId, setTaskForceId] = useState('');
  const [note, setNote] = useState('');
  const [taskForces, setTaskForces] = useState<TaskForceOption[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const loadMeta = useCallback(async (issueId: string) => {
    setLoadingMeta(true);
    setAiLoading(true);
    setAiError(null);
    try {
      const [tfRes, tlRes, aiRes] = await Promise.all([
        fetch('/api/admin/task-forces'),
        fetch(`/api/issues/${issueId}/timeline`),
        fetch('/api/ai/suggest-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueId }),
        }),
      ]);
      if (tfRes.ok) {
        const tfs = await tfRes.json();
        setTaskForces(Array.isArray(tfs) ? tfs : []);
      }
      if (tlRes.ok) {
        const events = await tlRes.json();
        setHistory(Array.isArray(events) ? events : []);
      } else {
        setHistory([]);
      }
      if (aiRes.ok) {
        const suggestion = (await aiRes.json()) as AiSuggestion;
        setAiSuggestion(suggestion);
        // Auto-fill fields from AI/heuristic (authority only needs to approve)
        if (suggestion.severity) setNewSeverity(suggestion.severity);
        if (suggestion.department) setNewDepartment(suggestion.department);
        if (typeof suggestion.priority_score === 'number') {
          setPriorityScore(suggestion.priority_score);
        }
        if (suggestion.recommended_task_force_id) {
          setTaskForceId(suggestion.recommended_task_force_id);
        }
        if (suggestion.recommended_status) {
          setNewStatus(suggestion.recommended_status);
        }
      } else {
        const errBody = await aiRes.json().catch(() => ({}));
        setAiError(
          errBody.error ||
            'Server suggestion failed — filled from local heuristics. Check /api/ai/health for API keys.'
        );
        // Still auto-fill from issue + TF list so authority saves time
        setAiSuggestion(null);
      }
    } catch (err) {
      console.error('Issue drawer meta load failed:', err);
      setAiError('Could not load AI suggestion — check /api/ai/health');
    } finally {
      setLoadingMeta(false);
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (issue && isOpen) {
      setNewStatus(issue.status);
      setNewDepartment(issue.department || '');
      setNewSeverity(issue.severity || 'Medium');
      setPriorityScore(
        typeof issue.priority_score === 'number'
          ? issue.priority_score
          : typeof issue.ai_score === 'number'
            ? issue.ai_score
            : 0
      );
      setTaskForceId(issue.task_force_id || '');
      setNote('');
      setShowManual(false);
      setAiSuggestion(null);
      loadMeta(issue.id);
    }
  }, [issue, isOpen, loadMeta]);

  // Freeze main page scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: documentElement.style.overflow,
    };

    const scrollbarGap = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      body.style.paddingRight = prev.bodyPaddingRight;
      documentElement.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!issue || !isOpen) return null;

  const currentStatusIndex = STATUS_ORDER.indexOf(
    issue.status as (typeof STATUS_ORDER)[number]
  );

  const getAvailableStatuses = () => {
    if (issue.status === 'Rejected' || issue.status === 'Resolved') return [issue.status];
    const available = [issue.status];
    const next = currentStatusIndex + 1;
    if (next > 0 && next < STATUS_ORDER.length) {
      available.push(STATUS_ORDER[next]);
    } else if (currentStatusIndex < 0) {
      // Unknown status — allow full path
      STATUS_ORDER.forEach((s) => {
        if (!available.includes(s)) available.push(s);
      });
    }
    // Allow jumping to In Progress / Resolved for admin flexibility
    ['Under Review', 'In Progress', 'Resolved'].forEach((s) => {
      if (!available.includes(s)) available.push(s);
    });
    available.push('Rejected');
    return available;
  };

  const pIdx = progressIndex(newStatus || issue.status);
  const assignedTf = taskForces.find((t) => t.id === (taskForceId || issue.task_force_id));

  const persistAssignment = async (opts: { aiApproved: boolean }) => {
    if (newStatus === 'Rejected' && !note.trim()) {
      alert('You must provide a note when rejecting an issue.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          taskForceId: taskForceId || null,
          status: newStatus,
          department: newDepartment,
          severity: newSeverity,
          priority_score: priorityScore,
          note: note || undefined,
          aiApproved: opts.aiApproved,
          aiSource: aiSuggestion?.source || null,
          aiRationale: aiSuggestion?.rationale || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to save changes');
      }

      try {
        const { patchReportLocal } = await import('@/lib/cache/reports-sync');
        patchReportLocal(issue.id, {
          status: newStatus,
          department: newDepartment || null,
          task_force_id: taskForceId || null,
          severity: newSeverity,
          priority_score: priorityScore,
          ai_score: priorityScore,
        });
      } catch {
        /* cache optional */
      }

      onUpdate();
      await loadMeta(issue.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Error updating issue: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAi = () => persistAssignment({ aiApproved: true });
  const handleSave = () => persistAssignment({ aiApproved: false });

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm overscroll-none"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Issue details"
        className="fixed inset-y-0 right-0 z-[100] flex h-[100dvh] w-full max-w-full flex-col bg-white shadow-2xl
          md:w-[480px] md:rounded-none rounded-t-3xl
          animate-in slide-in-from-right duration-300"
      >
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-3xl md:rounded-none relative shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden" />
          <div className="mt-2 md:mt-0 min-w-0 pr-2">
            <div className="flex gap-2 items-center mb-2 flex-wrap">
              <Badge>{issue.category || 'Other'}</Badge>
              <StatusPill status={issue.status} />
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">{issue.title}</h2>
            <p className="text-gray-400 text-xs mt-1 font-mono uppercase">
              ID: {issue.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-8">
          {/* Progress tracker */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Work progress
            </p>
            {issue.status === 'Rejected' ? (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                This report was rejected
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {STATUS_ORDER.map((s, i) => {
                  const done = pIdx >= i;
                  const current = pIdx === i;
                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                            done
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-200 text-gray-400'
                          } ${current ? 'ring-4 ring-emerald-100' : ''}`}
                        >
                          {done && i < pIdx ? (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span
                          className={`mt-1.5 text-[9px] font-bold uppercase tracking-tight text-center leading-tight ${
                            done ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          {s === 'Under Review' ? 'Review' : s === 'In Progress' ? 'Active' : s}
                        </span>
                      </div>
                      {i < STATUS_ORDER.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mb-5 rounded ${
                            pIdx > i ? 'bg-emerald-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {issue.image_url ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image src={issue.image_url} alt="Issue" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-28 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined mr-2">image_not_supported</span>
              <span className="text-sm font-medium">No image provided</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Description
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {issue.description || 'No description'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Location
                </p>
                <div className="flex items-start text-sm text-gray-700 font-medium">
                  <span className="material-symbols-outlined text-red-500 text-base mr-1">
                    location_on
                  </span>
                  <span className="line-clamp-3">
                    {issue.location || issue.address || 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Severity
                </p>
                <Badge
                  variant={
                    issue.severity === 'Critical'
                      ? 'critical'
                      : issue.severity === 'High'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {issue.severity || 'Medium'}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Priority score
                </p>
                <p className="text-sm font-black text-gray-900 tabular-nums">
                  {issue.priority_score ?? issue.ai_score ?? 0}/100
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Department
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {issue.department || 'Awaiting assignment'}
                </p>
              </div>
            </div>
            {assignedTf && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-600">groups</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-indigo-900 truncate">{assignedTf.name}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold">
                    Task force · {assignedTf.progress ?? 0}% resolved ·{' '}
                    {assignedTf.issueCount ?? '—'} issues
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI recommendation — primary workflow */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-950">AI recommendation</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">
                    {aiLoading
                      ? 'Analyzing…'
                      : aiSuggestion
                        ? `via ${aiSuggestion.source}`
                        : 'Heuristic / manual'}
                  </p>
                </div>
              </div>
              {aiSuggestion && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white border border-emerald-100 text-emerald-800">
                  {Math.round((aiSuggestion.confidence || 0) * 100)}% conf.
                </span>
              )}
            </div>

            {aiLoading && (
              <div className="h-20 rounded-xl bg-white/70 border border-emerald-50 animate-pulse" />
            )}

            {aiError && !aiLoading && (
              <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                {aiError}
              </p>
            )}

            {aiSuggestion && !aiLoading && (
              <>
                <p className="text-sm text-emerald-950/90 leading-relaxed font-medium">
                  {aiSuggestion.rationale}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white border border-emerald-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                      Severity
                    </p>
                    <p className="text-sm font-black text-gray-900">{aiSuggestion.severity}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-emerald-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                      Priority
                    </p>
                    <p className="text-sm font-black text-gray-900 tabular-nums">
                      {aiSuggestion.priority_score}/100
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-emerald-50 p-3 col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                      Department
                    </p>
                    <p className="text-sm font-bold text-gray-900">{aiSuggestion.department}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-emerald-50 p-3 col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                      Task force
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {aiSuggestion.recommended_task_force_name || 'None available'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      {aiSuggestion.load_note}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApproveAi}
                  disabled={isSaving || issue.status === 'Resolved'}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span className="material-symbols-outlined animate-spin">autorenew</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Approve AI assignment
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-gray-500 font-medium">
                  Confirms severity, department, priority, status &amp; task force. You only check
                  unit availability.
                </p>
              </>
            )}

            {onCreateTaskForce && !aiSuggestion?.recommended_task_force_id && !aiLoading && (
              <button
                type="button"
                onClick={() => onCreateTaskForce(issue)}
                className="w-full text-xs font-bold text-emerald-800 bg-white border border-emerald-100 rounded-xl py-2.5 hover:bg-emerald-50"
              >
                Create task force for this issue
              </button>
            )}
          </div>

          {/* Manual override (collapsed) */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                Override manually
              </span>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">
                {showManual ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showManual && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Assign task force
                  </label>
                  <select
                    value={taskForceId}
                    onChange={(e) => setTaskForceId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    disabled={loadingMeta}
                  >
                    <option value="">— Unassigned —</option>
                    {taskForces
                      .filter((t) => t.status === 'active' || t.id === taskForceId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {typeof t.issueCount === 'number' ? ` (${t.issueCount} issues)` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Severity (AI default)
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Update status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    disabled={issue.status === 'Resolved'}
                  >
                    {getAvailableStatuses().map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Assign department
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    {newDepartment &&
                      !(DEPARTMENTS as readonly string[]).includes(newDepartment) && (
                        <option value={newDepartment}>{newDepartment}</option>
                      )}
                  </select>
                </div>

                {(newStatus === 'Rejected' || note.length > 0) && (
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        newStatus === 'Rejected' ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      {newStatus === 'Rejected' ? 'Rejection reason (required)' : 'Progress note'}
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={`w-full p-3 bg-white border rounded-lg text-sm focus:ring-2 outline-none ${
                        newStatus === 'Rejected'
                          ? 'border-red-200 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-emerald-500'
                      }`}
                      rows={3}
                      placeholder={
                        newStatus === 'Rejected'
                          ? 'Why is this issue being rejected?'
                          : 'Optional note for the audit trail…'
                      }
                    />
                  </div>
                )}
                {newStatus !== 'Rejected' && !note && (
                  <button
                    type="button"
                    onClick={() => setNote('Working on this report…')}
                    className="text-[11px] font-bold text-gray-400 hover:text-gray-600"
                  >
                    + Add progress note
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {issue.duplicate_of && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-2 text-orange-800">
                  <span className="material-symbols-outlined text-orange-500 mt-0.5">
                    content_copy
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">Marked as duplicate</h4>
                    <p className="text-xs mt-1 text-orange-700/80">
                      Linked to ID-{String(issue.duplicate_of).slice(0, 6).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">history</span>
                Activity & progress
                {loadingMeta && (
                  <span className="text-[10px] font-medium text-gray-400">Loading…</span>
                )}
              </h3>

              <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {history.length === 0 && !loadingMeta ? (
                  <div className="relative">
                    <div className="absolute -left-[27px] bg-emerald-100 w-4 h-4 rounded-full border-4 border-white" />
                    <p className="text-xs text-gray-500 font-medium">
                      {new Date(issue.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      Issue <span className="font-bold text-emerald-600">submitted</span>
                    </p>
                  </div>
                ) : (
                  [...history].reverse().map((e) => (
                    <div key={e.id} className="relative">
                      <div
                        className={`absolute -left-[27px] w-4 h-4 rounded-full border-4 border-white ${
                          e.action_type.includes('task_force')
                            ? 'bg-indigo-200'
                            : e.action_type === 'status_change'
                              ? 'bg-blue-200'
                              : 'bg-emerald-100'
                        }`}
                      />
                      <p className="text-xs text-gray-500 font-medium">
                        {new Date(e.created_at).toLocaleString()}
                        {e.user_name ? ` · ${e.user_name}` : ''}
                      </p>
                      <p className="text-sm text-gray-900 mt-0.5 font-medium">{formatAction(e)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
          {showManual ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSaving ? (
                <span className="material-symbols-outlined animate-spin">autorenew</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save manual changes
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApproveAi}
              disabled={isSaving || aiLoading || issue.status === 'Resolved'}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSaving || aiLoading ? (
                <span className="material-symbols-outlined animate-spin">autorenew</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Approve AI assignment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
