import React from 'react';
import { normalizeStatus } from '@/types/report';

type StatusPillProps = {
  status: string;
  className?: string;
};

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  const normalized = normalizeStatus(status);

  const colors: Record<string, string> = {
    Submitted: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40',
    'Under Review': 'bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary/20',
    'In Progress': 'bg-blue-50 text-blue-700 border border-blue-100',
    Resolved: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/20',
    Rejected: 'bg-error-container text-on-error-container border border-error/20',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${colors[normalized] || colors.Submitted} ${className}`}
    >
      {normalized}
    </span>
  );
};
