'use client';

import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'neutral' | 'critical';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge = ({ children, variant = 'primary', className = '', dot = false }: BadgeProps) => {
  const styles: Record<BadgeVariant, string> = {
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    secondary: 'bg-slate-50 text-slate-700 border-slate-100',
    error: 'bg-red-50 text-red-700 border-red-100',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    critical: 'bg-red-600 text-white border-red-700',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'critical' ? 'bg-white' : 'bg-current opacity-50'}`} />}
      {children}
    </span>
  );
};
