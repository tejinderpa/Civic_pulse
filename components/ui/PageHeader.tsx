import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  /** Hide when shell already shows the page title */
  hideTitle?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
  hideTitle = false,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 ${className}`}
    >
      <div className="min-w-0">
        {!hideTitle && (
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className={`text-sm md:text-base text-on-surface-variant font-body max-w-2xl leading-relaxed ${hideTitle ? '' : 'mt-1.5'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}
