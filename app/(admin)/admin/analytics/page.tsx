'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import IssueVolumeChart from '@/components/admin/analytics/IssueVolumeChart';
import CategoryPieChart from '@/components/admin/analytics/CategoryPieChart';
import DepartmentBarChart from '@/components/admin/analytics/DepartmentBarChart';
import ResolutionAreaChart from '@/components/admin/analytics/ResolutionAreaChart';
import TopAreasChart from '@/components/admin/analytics/TopAreasChart';
import HeatmapSection from '@/components/admin/analytics/HeatmapSection';
import { AnalyticsResponse } from '@/types/analytics';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Days

  const fetchAnalytics = async (days: string) => {
    setIsLoading(true);
    try {
      const start = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date().toISOString();
      const res = await fetch(`/api/admin/analytics?startDate=${start}&endDate=${end}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  const handleExport = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Issues,${data.kpis.totalIssues}\n`
      + `SLA Compliance,${data.kpis.slaCompliancePercent}%\n`
      + `Resolved Rate,${data.kpis.resolvedPercent}%\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civicpulse_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
      {/* STICKY HEADER */}
      <header className="sticky top-[-1px] z-40 bg-[var(--surface)]/80 backdrop-blur-3xl py-6 border-b border-[var(--outline-variant)] -mx-6 px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-[var(--font-plus-jakarta)] mb-1">Intelligence & Insights</h1>
          <p className="text-sm font-medium text-slate-400">Comprehensive city-wide infrastructure performance analysis.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
            {['7', '30', '90'].map(days => (
              <button 
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${dateRange === days ? 'bg-primary text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {days}D
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 text-sm font-black uppercase tracking-widest text-[#0D2D1C]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </header>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          label="Total Issues" 
          value={data?.kpis.totalIssues || 0} 
          trend={{ value: data?.kpis.trends.totalIssues || 0, isGood: false }}
          accentColor="#3B82F6"
          isLoading={isLoading}
        />
        <StatCard 
          label="SLA Compliance" 
          value={`${data?.kpis.slaCompliancePercent.toFixed(1) || 0}%`} 
          trend={{ value: data?.kpis.trends.slaCompliancePercent || 0, isGood: true }}
          accentColor="#F59E0B"
          isLoading={isLoading}
        />
        <StatCard 
          label="Resolved Rate" 
          value={`${data?.kpis.resolvedPercent.toFixed(1) || 0}%`} 
          trend={{ value: data?.kpis.trends.resolvedPercent || 0, isGood: true }}
          accentColor="#10B981"
          isLoading={isLoading}
        />
        <StatCard 
          label="Avg Resp Time" 
          value="14.5h" 
          accentColor="#8B5CF6"
          isLoading={isLoading}
        />
        <StatCard 
          label="Duplicate Rate" 
          value="8.2%" 
          accentColor="#64748B"
          isLoading={isLoading}
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
          <IssueVolumeChart data={data?.volumeTrend || []} />
        </div>
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
          <CategoryPieChart data={data?.categoryStats || []} />
        </div>
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
          <DepartmentBarChart data={data?.departmentStats || []} />
        </div>
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
          <ResolutionAreaChart data={data?.resolutionRateTrend || []} />
        </div>
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
          <TopAreasChart data={data?.topAreas || []} />
        </div>
      </div>

      {/* HEATMAP HERO */}
      <HeatmapSection points={data?.allIssuePoints || []} />

      {/* BOTTOM INTELLIGENCE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Priority Insights */}
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                 <span className="material-symbols-outlined">psychology</span>
               </div>
               <h3 className="text-xl font-black tracking-tight">AI Priority Insights</h3>
            </div>
            <Badge variant="warning" dot>Urgent Signal</Badge>
          </div>
          
          <div className="space-y-4">
            {(data?.priorityIssues || []).map((issue, i) => (
              <div key={issue.id} className="p-4 rounded-[28px] border border-slate-100 flex items-center gap-5 group hover:bg-slate-50 transition-all cursor-pointer">
                 <span className="text-xl font-black text-slate-200">{i + 1}</span>
                 <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{issue.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{issue.address}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black">{issue.aiScore}/100</div>
                    <Badge variant={issue.severity === 'Critical' ? 'critical' : 'warning'}>{issue.severity}</Badge>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duplicate Clusters */}
        <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-sm">
           <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                 <span className="material-symbols-outlined">dynamic_feed</span>
               </div>
               <h3 className="text-xl font-black tracking-tight">Duplicate Clusters</h3>
            </div>
            <Badge variant="neutral">Auto-Grouped</Badge>
          </div>

          <div className="space-y-4">
             {(data?.duplicateClusters || []).map((cluster) => (
               <div key={cluster.duplicateOf} className="p-4 rounded-[24px] bg-slate-50 border border-slate-200 flex items-center justify-between group">
                  <div className="min-w-0 flex-1 pr-4">
                    <h4 className="font-bold text-sm truncate mb-1">{cluster.mainTitle}</h4>
                    <p className="text-xs text-slate-400">{cluster.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{cluster.count} Reports</span>
                    <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
