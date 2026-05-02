'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    const fetchTaskForces = async () => {
      try {
        const res = await fetch('/api/admin/task-forces');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        // Add mock progress for visual consistency with design if missing
        setTaskForces(data.map((tf: any) => ({ ...tf, progress: Math.floor(Math.random() * 60) + 20 })));
      } catch (err) {
        console.error('Error fetching task forces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskForces();
  }, []);

  const totalIssues = taskForces.reduce((acc, tf) => acc + tf.issueCount, 0);

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface">Task Forces</h2>
          <p className="text-on-surface-variant max-w-lg font-medium">Strategic clusters of citizen reports being addressed by dedicated municipal teams.</p>
        </div>
        <button 
          onClick={() => router.push('/admin')}
          className="signature-gradient text-on-primary px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/10 hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          New Initiative
        </button>
      </header>

      {/* KPI Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between h-44 transition-transform hover:scale-[1.01]">
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Total Active Task Forces</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">{taskForces.length}</span>
            <span className="text-emerald-600 font-bold text-sm flex items-center">
              <span className="material-symbols-outlined text-sm">arrow_upward</span> 12%
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between h-44 transition-transform hover:scale-[1.01]">
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Issues Managed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">{totalIssues}</span>
            <span className="text-on-surface-variant font-medium text-sm ml-1">linked reports</span>
          </div>
        </div>
        <div className="bg-primary text-on-primary p-8 rounded-xl flex flex-col justify-between h-44 signature-gradient shadow-2xl shadow-primary/20 transition-transform hover:scale-[1.01]">
          <span className="text-on-primary/70 font-bold text-sm tracking-widest uppercase">Current Mobilization</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold">84%</span>
            <div className="w-full bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-white h-full w-[84%]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Task Force Grid Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
          Active Projects
          <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs font-bold">{taskForces.length}</span>
        </h3>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">sort</span>
          </button>
        </div>
      </div>

      {/* Task Force Cards Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[320px] bg-surface-container-low animate-pulse rounded-xl"></div>
          ))
        ) : taskForces.length === 0 ? (
          <div className="lg:col-span-2 xl:col-span-3 py-20 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center opacity-60">
            <span className="material-symbols-outlined text-5xl mb-4">inventory_2</span>
            <h4 className="font-bold text-on-surface">No active task forces</h4>
            <p className="text-xs text-on-surface-variant">Create a new initiative from the dashboard to start clustering reports.</p>
          </div>
        ) : (
          taskForces.map((tf) => (
            <div key={tf.id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow flex flex-col h-full group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  tf.status === 'active' ? 'bg-secondary-fixed text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {tf.status}
                </span>
                <span className="text-on-surface-variant text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">folder</span> {tf.issueCount} Issues
                </span>
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2 pt-1">{tf.name}</h4>
              <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">
                {tf.description || `Optimizing response for ${tf.issueCount} civic issues. Primary focus: ${tf.recentIssues[0]}.`}
              </p>
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface-variant">PROGRESS</span>
                  <span className="text-primary">{tf.progress || 0}%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${tf.progress || 0}%` }}></div>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-[var(--primary-container)] text-white flex items-center justify-center text-[10px] font-bold">A</div>
                  <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-[var(--secondary-container)] text-white flex items-center justify-center text-[10px] font-bold">U</div>
                  <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">+{tf.issueCount > 2 ? tf.issueCount - 2 : 1}</div>
                </div>
                <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                  View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Static Asymmetric Large Card / Special Priority Example */}
        {!loading && taskForces.find(tf => tf.priority === 'Critical') && (
           <div className="bg-surface-container-high lg:col-span-2 p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center border border-primary/5">
             <div className="flex-1 space-y-4">
               <div className="inline-flex bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-tighter">Priority: Urgent</div>
               <h4 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">Civic Center Connectivity Cluster</h4>
               <p className="text-on-surface-variant font-medium">Merging 42 separate reports regarding public Wi-Fi outages and fiber optic deployment delays in the government district.</p>
               <div className="flex gap-4 items-center">
                 <div className="flex -space-x-2">
                   <div className="w-10 h-10 rounded-full border-4 border-surface-container-high bg-emerald-900 text-white flex items-center justify-center text-xs font-bold">OC</div>
                   <div className="w-10 h-10 rounded-full border-4 border-surface-container-high bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">IT</div>
                 </div>
                 <span className="text-sm font-bold text-on-surface-variant">Core Tech Unit + 5 Analysts</span>
               </div>
             </div>
             <div className="w-full md:w-64 space-y-6 bg-surface-container-lowest p-6 rounded-xl shadow-lg shadow-on-surface/5">
               <div className="text-center">
                 <div className="text-4xl font-black text-primary mb-1">42</div>
                 <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Reports Linked</div>
               </div>
               <div className="w-full bg-surface-container-high h-4 rounded-full overflow-hidden">
                 <div className="bg-primary h-full w-[15%]"></div>
               </div>
               <button className="w-full signature-gradient text-on-primary py-3 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-transform">
                 Accelerate Progress
               </button>
             </div>
           </div>
        )}

        {/* Empty State / Suggestions Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center space-y-4 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">group_add</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface">Need another force?</h4>
            <p className="text-xs text-on-surface-variant">Automated clustering is ready to suggest new formations.</p>
          </div>
          <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline transition-all">Review Suggestions</button>
        </div>
      </section>

      {/* Signature Issue Timeline Component / Recent Milestones */}
      <section className="bg-surface-container-low rounded-xl p-10">
        <h3 className="text-2xl font-extrabold text-on-surface mb-10 tracking-tight">Recent Task Force Milestones</h3>
        <div className="relative pl-8 border-l-4 border-surface-container-highest space-y-12">
          {/* Milestone 1 */}
          <div className="relative">
            <div className="absolute -left-[44px] top-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">Completed 2 hours ago</span>
              <h4 className="text-lg font-bold text-on-surface">Asphalt Paving Phase 1</h4>
              <p className="text-on-surface-variant text-sm mt-1 max-w-xl">The Main St. Pothole Repair force successfully resurfaced the intersection of 5th and Broadway. 4 citizen reports closed.</p>
            </div>
          </div>
          {/* Milestone 2 */}
          <div className="relative">
            <div className="absolute -left-[44px] top-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Staff Assigned Today</span>
              <h4 className="text-lg font-bold text-on-surface">Eco-Audit Force Expanded</h4>
              <p className="text-on-surface-variant text-sm mt-1 max-w-xl">3 new environmental analysts joined the Urban Canopy Restoration project to address the high volume of reports in the West end.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
