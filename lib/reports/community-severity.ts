/**
 * Severity influenced by local community support (upvotes) and issue scope
 * (neighbourhood / city / state). People living in the area "vote" urgency up.
 */

import {
  normalizeSeverity,
  type SeverityLevel,
  SEVERITY_RANK,
} from '@/lib/reports/priority';

export type IssueScope = 'local' | 'city' | 'state';

const STATE_KEYWORDS = [
  'statewide',
  'state highway',
  'nh-',
  'nh ',
  'national highway',
  'across punjab',
  'entire state',
  'multiple districts',
  'inter-city',
  'intercity',
  'gt road',
  'grand trunk',
];

const CITY_KEYWORDS = [
  'city-wide',
  'citywide',
  'across the city',
  'whole city',
  'municipal',
  'corporation limit',
  'multiple sectors',
  'several wards',
];

/**
 * Infer geographic scope from free text (title/description/location).
 */
export function inferIssueScope(input: {
  title?: string | null;
  description?: string | null;
  location?: string | null;
  category?: string | null;
}): IssueScope {
  const text = [input.title, input.description, input.location, input.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (STATE_KEYWORDS.some((k) => text.includes(k))) return 'state';
  if (CITY_KEYWORDS.some((k) => text.includes(k))) return 'city';

  // Multi-city mentions in one report → state-ish
  const cities = [
    'chandigarh',
    'ludhiana',
    'amritsar',
    'jalandhar',
    'patiala',
    'mohali',
    'bathinda',
    'phagwara',
    'pathankot',
    'hoshiarpur',
  ];
  const hits = cities.filter((c) => text.includes(c)).length;
  if (hits >= 2) return 'state';
  if (hits === 1 || text.includes('sector') || text.includes('colony')) return 'city';

  return 'local';
}

/**
 * Thresholds: more local consensus needed for broader (state) issues
 * before elevating severity.
 */
const ESCALATION: Record<
  IssueScope,
  { medium: number; high: number; critical: number }
> = {
  local: { medium: 3, high: 8, critical: 20 },
  city: { medium: 8, high: 18, critical: 40 },
  state: { medium: 15, high: 35, critical: 70 },
};

/**
 * Merge AI/base severity with community upvotes from people in the area.
 * Never decreases below base (AI or reporter choice); only escalates.
 */
export function severityFromCommunity(input: {
  baseSeverity?: string | null;
  upvotes?: number | null;
  scope?: IssueScope;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  category?: string | null;
}): {
  severity: SeverityLevel;
  scope: IssueScope;
  communityBoost: boolean;
  reason: string;
} {
  const base = normalizeSeverity(input.baseSeverity);
  const upvotes = Math.max(0, Math.floor(input.upvotes || 0));
  const scope =
    input.scope ||
    inferIssueScope({
      title: input.title,
      description: input.description,
      location: input.location,
      category: input.category,
    });

  const t = ESCALATION[scope];
  let fromVotes: SeverityLevel = 'Low';
  if (upvotes >= t.critical) fromVotes = 'Critical';
  else if (upvotes >= t.high) fromVotes = 'High';
  else if (upvotes >= t.medium) fromVotes = 'Medium';
  else fromVotes = 'Low';

  const baseRank = SEVERITY_RANK[base] ?? 2;
  const voteRank = SEVERITY_RANK[fromVotes] ?? 1;
  const severity = voteRank > baseRank ? fromVotes : base;
  const communityBoost = voteRank > baseRank;

  const reason = communityBoost
    ? `Escalated to ${severity} by local support (${upvotes} upvotes, ${scope} scope).`
    : `Severity ${severity} (base ${base}; ${upvotes} local upvotes, ${scope} scope).`;

  return { severity, scope, communityBoost, reason };
}

/** Priority score bump from community engagement (0–15). */
export function communityPriorityBonus(upvotes: number, scope: IssueScope): number {
  const raw = Math.min(15, Math.floor(upvotes * (scope === 'local' ? 0.8 : scope === 'city' ? 0.5 : 0.3)));
  return raw;
}
