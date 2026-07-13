'use client';

import React from 'react';
import { Badge } from './Badge';
import { StatusPill } from './StatusPill';
import Image from 'next/image';
import Link from 'next/link';

export type IssueCardProps = {
  id: string;
  category?: string;
  status?: string;
  title?: string;
  description?: string;
  location?: string | null;
  address?: string | null;
  upvotes?: number | null;
  votes_count?: number | null;
  imageUrl?: string | null;
  image_url?: string | null;
  timeAgo?: string;
  created_at?: string;
  severity?: string;
  duplicate_of?: string | null;
  onVote?: (id: string) => void;
  href?: string;
};

const categoryVariant = (category: string) => {
  const map: Record<string, 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'neutral'> = {
    Road: 'warning',
    Garbage: 'success',
    Water: 'primary',
    Electricity: 'secondary',
    Environment: 'success',
    Other: 'neutral',
  };
  return map[category] || 'neutral';
};

export const IssueCard: React.FC<IssueCardProps> = ({
  id,
  category = 'Other',
  status = 'Submitted',
  title,
  description,
  location,
  address,
  upvotes,
  votes_count,
  imageUrl,
  image_url,
  timeAgo,
  created_at,
  duplicate_of,
  onVote,
  href,
}) => {
  const displayTitle = title || description || 'Untitled report';
  const displayLocation = location || address || 'Unknown area';
  const displayVotes = upvotes ?? votes_count ?? 0;
  const displayImage = imageUrl || image_url;
  const displayTime =
    timeAgo || (created_at ? new Date(created_at).toLocaleDateString() : '');

  const body = (
    <div className="group dash-card-hover overflow-hidden flex flex-col w-full h-full !p-0">
      <div className="relative h-[168px] w-full overflow-hidden bg-surface-container-low">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline/25">
            <span className="material-symbols-outlined text-5xl">image</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant={categoryVariant(category)}>{category}</Badge>
        </div>
        <div className="absolute top-3 right-3">
          <StatusPill status={status} />
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-headline font-bold text-on-surface text-[15px] leading-snug line-clamp-2 min-h-[2.6rem] mb-2">
          {displayTitle}
        </h3>

        {duplicate_of && (
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2 block">
            Merged from multiple reports
          </span>
        )}

        <p className="text-xs text-on-surface-variant flex items-start gap-1 mb-4 line-clamp-1">
          <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5 text-primary/70">
            location_on
          </span>
          <span className="truncate">{displayLocation}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-[var(--outline-variant)]">
          <span className="text-[11px] font-medium text-on-surface-variant">{displayTime}</span>
          <div className="flex items-center gap-2">
            {onVote && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVote(id);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2.5 py-1.5 text-xs font-bold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                {displayVotes}
              </button>
            )}
            {!onVote && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                {displayVotes}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-2xl">
        {body}
      </Link>
    );
  }

  return body;
};
