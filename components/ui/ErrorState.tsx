'use client';

import React from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-16 px-6 bg-error-container/30 rounded-[24px] border border-error/20">
      <span className="material-symbols-outlined text-5xl text-error mb-4 block">error</span>
      <h3 className="text-xl font-headline font-extrabold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant font-body max-w-sm mx-auto mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
