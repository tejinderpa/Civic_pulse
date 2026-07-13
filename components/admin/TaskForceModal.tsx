'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Issue, TaskForceResult } from '@/types/issue';

interface TaskForceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedIssues: Issue[];
  onSuccess: (taskForce: TaskForceResult) => void;
}

export const TaskForceModal: React.FC<TaskForceModalProps> = ({
  isOpen,
  onClose,
  preSelectedIssues,
  onSuccess
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [successData, setSuccessData] = useState<TaskForceResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIssues(preSelectedIssues);
      setSuccessData(null);
      setName('');
    }
  }, [isOpen, preSelectedIssues]);

  if (!isOpen) return null;

  const canCreate = name.trim().length >= 3;

  const handleRemoveIssue = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCreate = async () => {
    if (name.trim().length < 3) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/task-force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          issueIds: issues.map((i) => i.id),
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create task force');
      }

      const result: TaskForceResult = await response.json();
      setSuccessData(result);
      onSuccess(result);
    } catch (err: any) {
      console.error('[Task Force Modal] Error:', err);
      alert(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0D2D1C]/60 backdrop-blur-md" 
        onClick={!isCreating ? onClose : undefined} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
        
        {/* SUCCESS STATE */}
        {successData ? (
          <div className="p-10 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#0D2D1C] mb-2 tracking-tight">Task Force Created!</h2>
              <p className="text-gray-500 font-medium">"{successData.name}" is now operational.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                   <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Assigned</p>
                   <p className="text-2xl font-black text-[#0D2D1C]">{successData.issuesAssigned}</p>
                   <p className="text-[9px] font-bold text-emerald-600/60 uppercase">Reports</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                   <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Updated</p>
                   <p className="text-2xl font-black text-[#0D2D1C]">{successData.statusesUpdated}</p>
                   <p className="text-[9px] font-bold text-blue-600/60 uppercase">Status Logs</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
               <button 
                  onClick={() => router.push('/admin/task-forces')} 
                  className="flex-1 py-4 px-6 bg-[#0D2D1C] text-white font-bold rounded-2xl hover:scale-[1.02] transition-all"
               >
                  View Task Forces
               </button>
               <button 
                  onClick={onClose} 
                  className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
               >
                  Done
               </button>
            </div>
          </div>
        ) : (
          /* CONFIGURE / CREATING STATE */
          <>
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start">
               <div>
                  <h2 className="text-2xl font-black text-[#0D2D1C] tracking-tight">Establish Task Force</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-issue mobilization unit</p>
               </div>
               {!isCreating && (
                 <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                 </button>
               )}
            </div>

            <div className="p-8 overflow-y-auto space-y-8 flex-1">
               {/* Section 1: Name */}
               <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0D2D1C]">Task Force Name</label>
                    <span className="text-[10px] font-bold text-gray-300">{name.length}/80</span>
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    placeholder="e.g. Monsoon Road Damage Response"
                    disabled={isCreating}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-[#0D2D1C] transition-all disabled:opacity-50"
                  />
                  {name.length > 0 && name.length < 3 && (
                    <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tighter italic">Name too short (min 3 chars)</p>
                  )}
               </div>

               {/* Section 2: Issues */}
               <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0D2D1C]">Issues to be grouped ({issues.length})</label>
                    {preSelectedIssues.length > 0 && issues.length === preSelectedIssues.length && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded border border-blue-100">
                        {preSelectedIssues.some(i => (i.ai_score ?? 0) > 0 || i.severity === 'Critical' || i.severity === 'High')
                          ? 'Priority ranked'
                          : 'Selected reports'}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {issues.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
                        <p className="text-xs font-bold text-gray-500">
                          No reports pre-selected. You can still create the task force and assign reports later from Issue Management.
                        </p>
                      </div>
                    ) : (
                      issues.map(issue => (
                      <div key={issue.id} className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 group">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${issue.severity === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {issue.ai_score ?? 0}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-[#0D2D1C] truncate">{issue.title}</h4>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {issue.address || issue.location || 'Location pending'}
                            </p>
                         </div>
                         {!isCreating && (
                           <button 
                             onClick={() => handleRemoveIssue(issue.id)}
                             className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                           >
                              <span className="material-symbols-outlined text-sm">delete</span>
                           </button>
                         )}
                      </div>
                    ))
                    )}
                  </div>
               </div>

               {/* Section 3: Info */}
               <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-4">
                  <span className="material-symbols-outlined text-emerald-600">info</span>
                  <p className="text-[10px] text-emerald-700/80 font-bold leading-relaxed uppercase tracking-tight">
                    Submitted issues will be moved to <span className="text-emerald-700 font-black">Under Review</span>. 
                    In Progress / Under Review statuses will not change.
                  </p>
               </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
               {!isCreating && (
                 <button 
                   onClick={onClose}
                   className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-white rounded-2xl transition-all"
                 >
                   Cancel
                 </button>
               )}
               <button 
                 disabled={isCreating || !canCreate}
                 onClick={handleCreate}
                 className="flex-[2] py-4 bg-[#0D2D1C] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10 hover:scale-[1.02] transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3"
               >
                 {isCreating ? (
                   <>
                     <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     Creating Unit...
                   </>
                 ) : (
                   issues.length > 0 ? 'Establish Task Force' : 'Create Task Force'
                 )}
               </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
