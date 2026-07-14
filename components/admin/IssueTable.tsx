'use client';

import React from 'react';
import { Issue } from '@/types/issue';
import { SEVERITY_BADGE_CLASS } from '@/lib/reports/priority';

type IssueTableProps = {
  issues: Issue[];
  isLoading: boolean;
  onViewDetails: (issue: Issue) => void;
  selectedIssues: string[];
  onSelectIssue: (id: string, select: boolean) => void;
  onSelectAll: (select: boolean) => void;
};

export const IssueTable: React.FC<IssueTableProps> = ({ 
  issues, 
  isLoading, 
  onViewDetails, 
  selectedIssues, 
  onSelectIssue, 
  onSelectAll 
}) => {
  if (isLoading) {
    return (
      <div className="p-20 flex flex-col justify-center items-center h-80 bg-white">
        <div className="w-16 h-16 rounded-full border-4 border-[var(--surface-container-low)] border-t-[var(--primary)] animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--on-surface-variant)] opacity-40">Syncing District Records...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-20 text-center bg-white flex flex-col items-center">
        <div className="w-20 h-20 bg-[var(--surface-container-low)] rounded-full flex items-center justify-center text-[var(--on-surface-variant)] mb-6 opacity-50">
           <span className="material-symbols-outlined text-4xl">inbox_customize</span>
        </div>
        <h3 className="text-[var(--on-surface)] font-black text-xl mb-2 font-[var(--font-plus-jakarta)]">No Active Records</h3>
        <p className="text-[var(--on-surface-variant)] text-sm max-w-sm font-medium opacity-60">District 7 is currently clear. No reports matching your current configuration were found.</p>
      </div>
    );
  }

  const allSelected = issues.length > 0 && selectedIssues.length === issues.length;

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-container-low)]/50 border-b border-[var(--outline-variant)]">
              <th className="p-5 w-14 text-center">
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded-lg border-[var(--outline-variant)] text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-5 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-[0.2em] opacity-60">Reference</th>
              <th className="p-5 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-[0.2em] opacity-60">Issue Profile</th>
              <th className="p-5 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-[0.2em] opacity-60">Geospatial Data</th>
              <th className="p-5 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-[0.2em] opacity-60 text-center">Priority</th>
              <th className="p-5 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-[0.2em] opacity-60 text-center">Directive</th>
              <th className="p-5 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-[0.2em] opacity-60 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--outline-variant)]">
            {issues.map(issue => (
              <tr key={issue.id} className="hover:bg-[var(--surface-container-low)]/30 transition-all duration-200 group">
                <td className="p-5 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIssues.includes(issue.id)}
                    onChange={(e) => onSelectIssue(issue.id, e.target.checked)}
                    className="rounded-lg border-[var(--outline-variant)] text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-5">
                  <span className="font-mono text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-1 rounded-lg border border-[var(--primary)]/10">
                    ID-{issue.id.slice(0, 6).toUpperCase()}
                  </span>
                </td>
                <td className="p-5 max-w-[320px]">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-[var(--surface-container-low)] overflow-hidden border border-[var(--outline-variant)] shadow-sm">
                      {issue.image_url ? (
                        <img src={issue.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--on-surface-variant)] opacity-30">
                          <span className="material-symbols-outlined text-[20px]">image_not_supported</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--on-surface)] truncate group-hover:text-[var(--primary)] transition-colors">{issue.title}</p>
                      {issue.duplicate_of && (
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] bg-amber-100/80 text-amber-700 font-black px-2 py-0.5 rounded border border-amber-200/50 uppercase tracking-widest inline-block">Duplicate</span>
                          <span className="text-[10px] text-amber-600 font-medium">of ID-{issue.duplicate_of.slice(0, 6).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase text-[var(--primary)] opacity-70">{issue.category}</span>
                        <span className="text-[14px] text-[var(--on-surface-variant)] opacity-30">•</span>
                        <span className="text-[10px] text-[var(--on-surface-variant)] font-bold opacity-50">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[var(--on-surface-variant)] opacity-40">location_on</span>
                      <p className="text-xs font-bold text-[var(--on-surface-variant)] line-clamp-1 opacity-70">
                        {issue.address || issue.location || 'Location pending'}
                      </p>
                   </div>
                </td>
                <td className="p-5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          SEVERITY_BADGE_CLASS[issue.severity || 'Medium'] ||
                          SEVERITY_BADGE_CLASS.Medium
                        }`}
                      >
                        {issue.severity || 'Medium'}
                      </span>
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black shadow-sm ${
                          (issue.ai_score ?? issue.priority_score ?? 0) >= 80
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : (issue.ai_score ?? issue.priority_score ?? 0) >= 50
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                      >
                        {issue.ai_score ?? issue.priority_score ?? 0}
                      </div>
                    </div>
                </td>
                <td className="p-5 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                           issue.status === 'Resolved' ? 'bg-emerald-900 text-white border-emerald-900' :
                           issue.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                           'bg-[#F4A623]/10 text-[#835500] border-[#F4A623]/20'
                        }`}>
                           {issue.status}
                        </span>
                        {issue.task_force_id && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm flex items-center gap-1">
                             <span className="material-symbols-outlined text-[12px]">groups</span>
                             UNIT
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] opacity-30">
                         {issue.department || 'AWAITING_ASSIGN'}
                      </span>
                </td>
                <td className="p-5 text-right">
                   <button 
                    type="button"
                    title="Assign & track progress"
                    onClick={() => onViewDetails(issue)}
                    className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-white border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all duration-300 shadow-sm ml-auto"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    <span className="text-[11px] font-black uppercase tracking-wide hidden sm:inline">Actions</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-5 bg-[var(--surface-container-low)]/30 border-t border-[var(--outline-variant)] flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--on-surface-variant)] opacity-40">Showing {issues.length} active directives</span>
        <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg border border-[var(--outline-variant)] bg-white flex items-center justify-center text-[var(--on-surface-variant)] opacity-40 pointer-events-none">
               <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg border border-[var(--outline-variant)] bg-white flex items-center justify-center text-[var(--on-surface-variant)]">
               <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
        </div>
      </div>
    </div>
  );
};
