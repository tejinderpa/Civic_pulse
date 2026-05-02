'use client';

import React from 'react';
import { Badge } from './Badge';
import { StatusPill } from './StatusPill';
import Link from 'next/link';
import Image from 'next/image';


export type IssueCardProps = {
  id: string;
  category: 'Road' | 'Garbage' | 'Water' | 'Electricity' | 'Other';
  status: 'Pending' | 'In Progress' | 'Resolved';
  title: string;
  location: string;
  upvotes: number;
  imageUrl: string;
  timeAgo: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  duplicate_of?: string | null;
  onVote?: (id: string) => void;
};

export const IssueCard: React.FC<IssueCardProps> = ({ 
  id, 
  category, 
  status, 
  title, 
  location, 
  upvotes, 
  imageUrl, 
  timeAgo,
  severity = 'medium',
  duplicate_of,
  onVote
}) => {
  const categoryVariants: Record<string, 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'neutral' | 'critical'> = {
    Road: 'warning',
    Garbage: 'success',
    Water: 'primary',
    Electricity: 'secondary',
    Other: 'neutral'
  };

  return (
    <div className="group bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E2E8E4] w-full max-w-[400px]">
      <div className="relative h-[180px] w-full overflow-hidden">
        <Image 
          src={imageUrl} 
          alt={title} 
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute top-3 left-3">
          <Badge variant={categoryVariants[category] || 'neutral'}>{category}</Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-gray-900 text-lg leading-tight line-clamp-2 min-h-[3.5rem] mb-2">
          {title}
        </h3>
        
        {duplicate_of && (
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mb-3 block">
            Merged from multiple reports
          </span>
        )}

        <div className="flex flex-col gap-2 mb-4 mt-2">
          <p className="flex items-center text-gray-500 text-sm font-medium">
            <span className="mr-1.5 text-lg">📍</span> {location}
          </p>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            {timeAgo}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <StatusPill status={status} />
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              onVote && onVote(id);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5EE] text-[#1A6B45] font-bold text-sm transition-colors hover:bg-[#1A6B45] hover:text-white"
          >
            <span className="text-base">👍</span>
            <span>{upvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

