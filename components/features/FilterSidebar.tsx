'use client';

import React from 'react';
import type {
  CommunityCategory,
  CommunityStatus,
  CommunitySort,
} from '@/lib/community/filters';

interface FilterSidebarProps {
  category: CommunityCategory;
  setCategory: (c: CommunityCategory) => void;
  status: CommunityStatus;
  setStatus: (s: CommunityStatus) => void;
  sort: CommunitySort;
  setSort: (s: CommunitySort) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const CATEGORIES: { label: CommunityCategory; color: string }[] = [
  { label: 'All', color: '#0f6b45' },
  { label: 'Road', color: '#F97316' },
  { label: 'Garbage', color: '#22C55E' },
  { label: 'Water', color: '#3B82F6' },
  { label: 'Electricity', color: '#EAB308' },
  { label: 'Environment', color: '#14B8A6' },
  { label: 'Other', color: '#6B7280' },
];

const STATUSES: { value: CommunityStatus; hint: string }[] = [
  { value: 'All', hint: 'Any status' },
  { value: 'Pending', hint: 'Submitted & under review' },
  { value: 'In Progress', hint: 'Being worked on' },
  { value: 'Resolved', hint: 'Closed / fixed' },
];

const SORTS: CommunitySort[] = ['Most Recent', 'Most Voted', 'Critical First'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  category,
  setCategory,
  status,
  setStatus,
  sort,
  setSort,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <aside className="space-y-7 sticky top-24">
      <div>
        <h2 className="text-xl font-headline font-bold text-on-surface mb-3">Community issues</h2>
        <div className="relative">
          <input
            type="search"
            placeholder="Search title, place, category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dash-input w-full !pl-10"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
        </div>
      </div>

      <div>
        <h3 className="dash-label mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = category === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setCategory(cat.label)}
                style={active ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color } : {}}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? 'shadow-md'
                    : 'bg-white text-on-surface-variant border-[var(--outline-variant)] hover:border-primary/40 hover:text-primary'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="dash-label mb-3">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((stat) => {
            const active = status === stat.value;
            return (
              <button
                key={stat.value}
                type="button"
                title={stat.hint}
                onClick={() => setStatus(stat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/15'
                    : 'bg-white text-on-surface-variant border-[var(--outline-variant)] hover:border-primary/40 hover:text-primary'
                }`}
              >
                {stat.value}
              </button>
            );
          })}
        </div>
        {status === 'Pending' && (
          <p className="mt-2 text-[11px] text-on-surface-variant">
            Includes Submitted & Under Review
          </p>
        )}
      </div>

      <div>
        <h3 className="dash-label mb-3">Sort by</h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as CommunitySort)}
          className="dash-input w-full font-medium"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {(category !== 'All' || status !== 'All' || searchQuery.trim() || sort !== 'Most Recent') && (
        <button
          type="button"
          onClick={() => {
            setCategory('All');
            setStatus('All');
            setSort('Most Recent');
            setSearchQuery('');
          }}
          className="dash-btn-secondary w-full !text-xs"
        >
          Reset filters
        </button>
      )}
    </aside>
  );
};
