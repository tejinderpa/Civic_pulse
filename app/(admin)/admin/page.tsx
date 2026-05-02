'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Issue } from '@/types/issue';

import { MOCK_ISSUES } from '@/lib/mock-data';

import { TaskForceModal } from '@/components/admin/TaskForceModal';
import { TaskForceResult } from '@/types/issue';

// Dynamically import AdminMap to prevent SSR issues
const AdminMap = dynamic(() => import('../../../components/admin/AdminMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--surface-container-low)] animate-pulse rounded-[32px] flex items-center justify-center text-[var(--on-surface-variant)]">Initialising Operations Map...</div>
});

const supabase = createClient();

export default function AdminDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isTaskForceModalOpen, setIsTaskForceModalOpen] = useState(false);
  const [taskForceIssues, setTaskForceIssues] = useState<Issue[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('DB empty or errored, using mock data.');
        setIssues(MOCK_ISSUES as unknown as Issue[]);
      } else {
        setIssues(data as Issue[]);
      }
      setIsLoading(false);
    };

    fetchReports();
  }, []);

  // Derived Stats
  const stats = useMemo(() => {
    const active = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Rejected').length;
    const critical = issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const duplicates = issues.filter(i => i.duplicate_of !== null).length;
    const total = issues.length;
    const satisfaction = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const duplicateRate = total > 0 ? Math.round((duplicates / total) * 100) : 0;

    return [
      { label: 'Active Reports', value: active.toLocaleString(), change: '+12%', trend: 'up', color: 'primary' },
      { label: 'Critical Failure', value: critical.toLocaleString(), change: 'Stable', trend: 'neutral', color: 'error' },
      { label: 'Duplicates', value: duplicates.toLocaleString(), change: `${duplicateRate}% Rate`, trend: 'neutral', color: 'secondary' },
      { label: 'Resolution Rate', value: `${satisfaction}%`, change: '+2.4%', trend: 'up', color: 'primary' },
    ];
  }, [issues]);

  // AI Queue Data (Top 3 by priority_score or recent critical)
  const aiQueue = useMemo(() => {
    return issues
      .filter(i => i.status !== 'Resolved' && i.status !== 'Rejected')
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
      .slice(0, 3);
  }, [issues]);

  const handleOpenTaskForce = () => {
    console.log('[Dashboard] Opening Task Force Modal with AI Queue:', aiQueue);
    if (aiQueue.length === 0) {
      alert('No high-priority issues currently in queue.');
      return;
    }
    setTaskForceIssues(aiQueue);
    setIsTaskForceModalOpen(true);
  };

  const handleTaskForceSuccess = (result: TaskForceResult) => {
    setIssues(prev => prev.map(issue => {
      if (taskForceIssues.some(ti => ti.id === issue.id)) {
        return {
          ...issue,
          task_force_id: result.taskForceId,
          status: issue.status === 'Submitted' ? 'Under Review' : issue.status
        };
      }
      return issue;
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Section: Welcome and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--primary)] font-[var(--font-plus-jakarta)] mb-2">Authority Control Center</h1>
          <p className="text-[var(--on-surface-variant)] font-medium max-w-lg">Monitoring infrastructure health and citizen pulse. Your AI co-pilot has prioritized {aiQueue.length} critical issues.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/admin/issues')}
            className="px-6 py-3 rounded-2xl bg-white border border-[var(--outline-variant)] font-bold text-sm text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span> Export Report
          </button>
          <button 
            onClick={handleOpenTaskForce}
            className="px-6 py-3 rounded-2xl signature-gradient text-white font-bold text-sm shadow-xl shadow-emerald-900/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
             Establish Task Force
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="group p-6 rounded-[28px] bg-white border border-[var(--outline-variant)] hover:border-[var(--primary)]/30 transition-all duration-300 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color === 'error' ? '[#ba1a1a]' : '[#1a6b45]'} opacity-[0.02] -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] opacity-50 mb-3">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black tracking-tighter text-[var(--on-surface)]">{stat.value}</h3>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black ${
                stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
                stat.trend === 'down' ? 'bg-amber-50 text-amber-600' : 
                'bg-slate-50 text-slate-500'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {stat.trend === 'up' ? 'trending_up' : stat.trend === 'down' ? 'trending_down' : 'remove_circle'}
                </span>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid: Map and AI Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Map UI (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight font-[var(--font-plus-jakarta)]">Geospatial Intelligence</h2>
            <div className="flex gap-2 text-[10px] uppercase font-black tracking-widest opacity-40">
               {issues.length} Active Locales
            </div>
          </div>
          <div className="h-[550px] cursor-pointer" onClick={() => setIsMapExpanded(true)}>
            <AdminMap onToggleExpand={() => setIsMapExpanded(true)} />
          </div>
        </div>

        {/* AI Priority Queue (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <h2 className="text-xl font-black tracking-tight font-[var(--font-plus-jakarta)]">AI Priority Queue</h2>
            </div>
            {aiQueue.length > 0 && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">{aiQueue.length} Critical Actions</span>
            )}
          </div>

          <div className="space-y-4 flex-1">
            {aiQueue.length > 0 ? (
              aiQueue.map((item, i) => (
                <div key={i} className="group p-4 rounded-[28px] bg-white border border-[var(--outline-variant)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex items-center gap-5">
                  <span className="text-lg font-black text-[var(--on-surface-variant)] opacity-20 group-hover:opacity-40 transition-opacity">{(i+1).toString().padStart(2, '0')}</span>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-[var(--surface-container-low)]">
                     {item.image_url ? (
                       <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={item.title} />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-[var(--on-surface-variant)] opacity-20">
                         <span className="material-symbols-outlined">image</span>
                       </div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-[var(--primary)] opacity-70 tracking-tight">{item.category}</span>
                      <span className="text-[14px] text-[var(--on-surface-variant)] opacity-40">•</span>
                      <span className="text-[10px] font-medium text-[var(--on-surface-variant)] truncate max-w-[100px]">{item.address}</span>
                    </div>
                    <h4 className="font-bold text-sm truncate mb-2">{item.title}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black">{item.ai_score || '90'} Score</span>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${item.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`}>
                        <span className="material-symbols-outlined text-[14px]">priority_high</span> {item.severity}
                      </span>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-xl bg-[var(--surface-container-low)] flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-[var(--primary)] hover:text-white transition-all">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[28px] border border-[var(--outline-variant)] border-dashed opacity-40">
                <span className="material-symbols-outlined text-4xl mb-3">task_alt</span>
                <p className="text-sm font-bold uppercase tracking-widest">No Priority Alerts</p>
              </div>
            )}
            <button 
              onClick={() => router.push('/admin/issues')}
              className="w-full py-4 rounded-[24px] border-2 border-dashed border-[var(--outline-variant)] text-[var(--on-surface-variant)] font-bold text-sm hover:border-[var(--primary)]/30 hover:bg-white transition-all"
            >
              View All Global Issues (Total {issues.length})
            </button>
          </div>
        </div>
      </div>

      {/* IMMERSIVE MAP MODAL */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0D2D1C]/40 backdrop-blur-2xl" onClick={() => setIsMapExpanded(false)} />
          <div className="relative w-full h-full bg-white rounded-[40px] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[10001] bg-white/90 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 shadow-xl flex items-center gap-4">
               <h3 className="text-sm font-black uppercase text-[#0D2D1C] tracking-[0.2em]">Global Geospatial Intelligence</h3>
               <div className="w-[1px] h-4 bg-slate-200" />
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400">{issues.length} Active Records</span>
               </div>
            </div>
            <AdminMap isExpanded={true} onToggleExpand={() => setIsMapExpanded(false)} />
            <button 
              onClick={() => setIsMapExpanded(false)}
              className="absolute top-10 right-10 z-[10001] w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center group hover:scale-110 transition-all border border-slate-100"
            >
              <span className="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Department Performance */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black tracking-tight font-[var(--font-plus-jakarta)]">Department Ecosystem</h2>
          <button onClick={() => router.push('/admin/analytics')} className="text-sm font-bold text-[var(--primary)] flex items-center gap-2 hover:underline">
            Detailed Analytics <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { dept: 'Public Works', efficiency: 82, reports: issues.filter(i => i.category === 'Roads').length, icon: 'construction', color: '#835500' },
            { dept: 'Power & Grid', efficiency: 65, reports: issues.filter(i => i.category === 'Electric').length, icon: 'bolt', color: '#762f35' },
            { dept: 'Water Supply', efficiency: 71, reports: issues.filter(i => i.category === 'Water').length, icon: 'water_drop', color: '#005131' },
            { dept: 'Waste Mgmt', efficiency: 94, reports: issues.filter(i => i.category === 'Garbage').length, icon: 'delete_sweep', color: '#1a6b45' },
          ].map((item, i) => (
            <div key={i} className="group p-6 rounded-[32px] bg-white border border-[var(--outline-variant)] hover:shadow-2xl transition-all duration-500">
               <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:-translate-y-1 duration-300" style={{ backgroundColor: item.color }}>
                   <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-[var(--on-surface-variant)] opacity-50 mb-1">Reports</p>
                  <p className="text-xl font-black text-[var(--on-surface)]">{item.reports}</p>
                </div>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-[var(--on-surface)]">{item.dept}</span>
                    <span className="text-[var(--primary)]">{item.efficiency}%</span>
                 </div>
                 <div className="w-full h-2 bg-[var(--surface-container-low)] rounded-full overflow-hidden">
                    <div className="h-full signature-gradient rounded-full transition-all duration-1000" style={{ width: `${item.efficiency}%` }}></div>
                 </div>
                 <p className="text-[10px] text-[var(--on-surface-variant)] font-medium leading-relaxed">
                   Current resolution efficacy for categorized requests.
                 </p>
               </div>
            </div>
          ))}
        </div>
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
