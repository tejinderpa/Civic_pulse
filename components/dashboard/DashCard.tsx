'use client';

import React from 'react';

export function DashCard({
  children,
  className = '',
  hover = false,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}) {
  return (
    <div className={`${hover ? 'dash-card-hover' : 'dash-card'} ${padding ? 'p-5 md:p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function DashCardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="dash-section-title text-base">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm dash-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
