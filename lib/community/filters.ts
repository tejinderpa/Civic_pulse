/**
 * Community page filter helpers — maps UI chips to real DB values.
 */

import { normalizeStatus } from '@/types/report';

export type CommunityCategory =
  | 'All'
  | 'Road'
  | 'Garbage'
  | 'Water'
  | 'Electricity'
  | 'Environment'
  | 'Other';

export type CommunityStatus = 'All' | 'Pending' | 'In Progress' | 'Resolved';

export type CommunitySort = 'Most Voted' | 'Most Recent' | 'Critical First';

/** Status values stored on reports for each UI chip */
export function statusValuesForFilter(status: CommunityStatus): string[] | null {
  if (status === 'All') return null;
  if (status === 'Pending') {
    // UI "Pending" = newly filed / not yet being worked
    return ['Submitted', 'Pending', 'Under Review', 'submitted', 'pending', 'Under review'];
  }
  if (status === 'In Progress') {
    return ['In Progress', 'in progress', 'In progress', 'in_progress', 'Progress'];
  }
  if (status === 'Resolved') {
    return ['Resolved', 'resolved', 'Closed', 'closed', 'Done', 'done'];
  }
  return null;
}

/** Category aliases used in seed/legacy data */
export function categoryValuesForFilter(category: CommunityCategory): string[] | null {
  if (category === 'All') return null;
  const map: Record<Exclude<CommunityCategory, 'All'>, string[]> = {
    Road: ['Road', 'Roads', 'road', 'roads', 'Pothole', 'Roads & Potholes'],
    Garbage: ['Garbage', 'garbage', 'Waste', 'Sanitation', 'Waste & Sanitation'],
    Water: ['Water', 'water', 'Sewage', 'Water & Sewage'],
    Electricity: ['Electricity', 'Electric', 'electricity', 'electric', 'Power', 'Power & Light'],
    Environment: ['Environment', 'environment', 'Parks', 'Trees', 'Parks & Trees'],
    Other: ['Other', 'other', 'General', 'General Issue'],
  };
  return map[category] || [category];
}

export function matchesCategory(
  issueCategory: string | null | undefined,
  filter: CommunityCategory
): boolean {
  if (filter === 'All') return true;
  const allowed = categoryValuesForFilter(filter);
  if (!allowed) return true;
  const c = (issueCategory || '').trim();
  if (allowed.some((a) => a.toLowerCase() === c.toLowerCase())) return true;
  // soft contains
  return allowed.some((a) => c.toLowerCase().includes(a.toLowerCase()));
}

export function matchesStatus(
  issueStatus: string | null | undefined,
  filter: CommunityStatus
): boolean {
  if (filter === 'All') return true;
  const normalized = normalizeStatus(issueStatus);
  if (filter === 'Pending') {
    return normalized === 'Submitted' || normalized === 'Under Review';
  }
  if (filter === 'In Progress') {
    return normalized === 'In Progress';
  }
  if (filter === 'Resolved') {
    return normalized === 'Resolved';
  }
  return true;
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function severityRank(severity: string | null | undefined): number {
  return SEVERITY_RANK[(severity || 'medium').toLowerCase()] ?? 2;
}

export function sortIssues<T extends {
  created_at?: string;
  upvotes?: number | null;
  votes_count?: number | null;
  priority_score?: number | null;
  ai_score?: number | null;
  severity?: string | null;
}>(items: T[], sort: CommunitySort): T[] {
  const copy = [...items];
  if (sort === 'Most Recent') {
    return copy.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }
  if (sort === 'Most Voted') {
    return copy.sort((a, b) => {
      const va = a.upvotes ?? a.votes_count ?? a.priority_score ?? a.ai_score ?? 0;
      const vb = b.upvotes ?? b.votes_count ?? b.priority_score ?? b.ai_score ?? 0;
      return Number(vb) - Number(va);
    });
  }
  // Critical First
  return copy.sort((a, b) => {
    const diff = severityRank(b.severity) - severityRank(a.severity);
    if (diff !== 0) return diff;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}
