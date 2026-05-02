'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isGood: boolean;
  };
  accentColor?: string;
  icon?: string;
  isLoading?: boolean;
}

export const StatCard = ({ label, value, trend, accentColor = 'var(--primary)', icon, isLoading }: StatCardProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[28px] p-6 border border-[var(--outline-variant)] flex flex-col gap-4 animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-100 rounded-md" />
          <div className="h-10 w-32 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-[28px] p-6 border border-[var(--outline-variant)] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden group"
      style={{ borderLeftColor: accentColor, borderLeftWidth: '6px' }}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--on-surface-variant)] opacity-60">
              {label}
            </span>
            {icon && (
              <span className="material-symbols-outlined text-[var(--on-surface-variant)] opacity-20 group-hover:opacity-100 transition-opacity">
                {icon}
              </span>
            )}
          </div>
          <h2 className="text-[2.5rem] font-black tracking-tight leading-none font-[var(--font-plus-jakarta)]">
            {value}
          </h2>
        </div>

        {trend && (
          <div className="mt-4 flex items-center justify-between">
             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
               trend.isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
             }`}>
               <span className="material-symbols-outlined text-[16px]">
                 {trend.isGood ? 'trending_up' : 'trending_down'}
               </span>
               {Math.abs(trend.value)}%
             </div>
             <span className="text-[10px] font-bold opacity-40">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};
