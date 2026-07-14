'use client';

import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 md:py-24 px-6 bg-surface-container-low rounded-[24px] border border-dashed border-outline-variant/40">
      <span className="material-symbols-outlined text-5xl text-outline/40 mb-4 block">{icon}</span>
      <h3 className="text-xl font-headline font-extrabold text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-on-surface-variant font-body max-w-sm mx-auto mb-8">{description}</p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Button href={actionHref}>{actionLabel}</Button>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
