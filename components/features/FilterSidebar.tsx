import React from 'react';

type Category = 'All' | 'Road' | 'Garbage' | 'Water' | 'Electricity' | 'Other';
type Status = 'All' | 'Pending' | 'In Progress' | 'Resolved';
type Sort = 'Most Voted' | 'Most Recent' | 'Critical First';

interface FilterSidebarProps {
  category: Category;
  setCategory: (c: Category) => void;
  status: Status;
  setStatus: (s: Status) => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const CATEGORIES: { label: Category; color: string }[] = [
  { label: 'All', color: '#1A6B45' },
  { label: 'Road', color: '#F97316' },
  { label: 'Garbage', color: '#22C55E' },
  { label: 'Water', color: '#3B82F6' },
  { label: 'Electricity', color: '#EAB308' },
  { label: 'Other', color: '#6B7280' },
];

const STATUSES: Status[] = ['All', 'Pending', 'In Progress', 'Resolved'];
const SORTS: Sort[] = ['Most Voted', 'Most Recent', 'Critical First'];

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
    <aside className="space-y-8 sticky top-24">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-[#1A6B45] mb-4">Community Issues</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A6B45]/20 focus:border-[#1A6B45] transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategory(cat.label)}
              style={category === cat.label ? { backgroundColor: cat.color, color: 'white' } : {}}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border border-gray-100 ${
                category === cat.label 
                  ? 'shadow-lg shadow-black/5' 
                  : 'bg-white text-gray-600 hover:border-[#1A6B45] hover:text-[#1A6B45]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((stat) => (
            <button
              key={stat}
              onClick={() => setStatus(stat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
                status === stat
                  ? 'bg-[#1A6B45] text-white border-[#1A6B45] shadow-lg shadow-[#1A6B45]/10'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-[#1A6B45] hover:text-[#1A6B45]'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A6B45]/20 focus:border-[#1A6B45] bg-white font-medium text-gray-700"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </aside>
  );
};
