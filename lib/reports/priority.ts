/**
 * Priority / severity scoring for civic reports.
 * Used on submit (citizen review), APIs, and authority queue sorting.
 */

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export const SEVERITY_RANK: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const DEPARTMENT_BY_CATEGORY: Record<string, string> = {
  Road: 'PWD (Roads)',
  Garbage: 'Municipal Sanitation',
  Water: 'Water & Sewerage Board',
  Electricity: 'Electricity Department',
  Environment: 'Parks & Environment',
  Other: 'General Municipal Services',
};

/** Base score contribution by severity (0–100 scale). */
const SEVERITY_BASE: Record<SeverityLevel, number> = {
  Critical: 90,
  High: 72,
  Medium: 48,
  Low: 25,
};

const CRITICAL_KEYWORDS = [
  'fire',
  'explosion',
  'electrocution',
  'live wire',
  'collapsed',
  'collapse',
  'flooding',
  'flood',
  'drowning',
  'gas leak',
  'chemical',
  'accident',
  'injured',
  'injury',
  'death',
  'fatal',
  'emergency',
  'urgent',
  'life threatening',
  'life-threatening',
  'exposed wire',
  'transformer fire',
  'sewage overflow',
  'building collapse',
];

const HIGH_KEYWORDS = [
  'pothole',
  'danger',
  'dangerous',
  'hazard',
  'hazardous',
  'broken',
  'burst',
  'overflow',
  'overflowing',
  'blocked',
  'no water',
  'power outage',
  'blackout',
  'open manhole',
  'manhole',
  'sinkhole',
  'caving',
  'traffic jam',
  'accident risk',
  'children',
  'school',
  'hospital',
  'major',
  'severe',
  'leaking',
  'leak',
  'sparking',
  'smoke',
];

const LOW_KEYWORDS = [
  'minor',
  'small',
  'cosmetic',
  'paint',
  'graffiti',
  'noise',
  'suggestion',
  'request',
  'light flicker',
  'occasional',
  'slight',
];

export function resolveDepartment(category: string | null | undefined): string {
  const key = (category || 'Other').trim();
  if (DEPARTMENT_BY_CATEGORY[key]) return DEPARTMENT_BY_CATEGORY[key];
  const lower = key.toLowerCase();
  for (const [cat, dept] of Object.entries(DEPARTMENT_BY_CATEGORY)) {
    if (cat.toLowerCase() === lower) return dept;
  }
  return DEPARTMENT_BY_CATEGORY.Other;
}

function textBlob(
  title?: string | null,
  description?: string | null,
  category?: string | null
): string {
  return [title, description, category].filter(Boolean).join(' ').toLowerCase();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/**
 * Infer severity from free-text + optional citizen override.
 * If `preferred` is a valid severity, it is respected unless text is clearly Critical.
 */
export function inferSeverity(input: {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  preferred?: string | null;
}): SeverityLevel {
  const text = textBlob(input.title, input.description, input.category);
  const preferred = normalizeSeverity(input.preferred);

  // Safety language always escalates to Critical
  if (hasAny(text, CRITICAL_KEYWORDS)) return 'Critical';
  if (preferred === 'Critical') return 'Critical';

  if (hasAny(text, HIGH_KEYWORDS)) {
    // Citizen Low is bumped to Medium when high-risk keywords present
    if (preferred === 'Low') return 'Medium';
    if (preferred === 'High') return 'High';
    return 'High';
  }

  if (hasAny(text, LOW_KEYWORDS)) {
    if (preferred === 'High') return 'High';
    if (preferred === 'Medium') return 'Medium';
    return 'Low';
  }

  return preferred;
}

export function normalizeSeverity(value: string | null | undefined): SeverityLevel {
  const s = (value || '').trim().toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'high') return 'High';
  if (s === 'low') return 'Low';
  if (s === 'medium' || s === 'med' || s === 'moderate') return 'Medium';
  return 'Medium';
}

/**
 * Compute 0–100 priority score from severity, category risk, and optional upvotes.
 */
export function computePriorityScore(input: {
  severity: string;
  category?: string | null;
  title?: string | null;
  description?: string | null;
  upvotes?: number | null;
}): number {
  const severity = normalizeSeverity(input.severity);
  let score = SEVERITY_BASE[severity];

  const cat = (input.category || '').toLowerCase();
  // Infrastructure categories slightly boost ranking for ops
  if (['electricity', 'water', 'road'].includes(cat)) score += 4;
  if (cat === 'garbage' || cat === 'environment') score += 2;

  const text = textBlob(input.title, input.description, input.category);
  if (hasAny(text, CRITICAL_KEYWORDS)) score += 6;
  else if (hasAny(text, HIGH_KEYWORDS)) score += 3;

  const votes = typeof input.upvotes === 'number' ? input.upvotes : 0;
  score += Math.min(12, votes * 0.6);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export type ReportPriorityMeta = {
  severity: SeverityLevel;
  priority_score: number;
  department: string;
  category: string;
};

/** Full meta used when generating a report (citizen review + insert payload). */
export function buildReportPriorityMeta(input: {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  severity?: string | null;
  upvotes?: number | null;
}): ReportPriorityMeta {
  const category = (input.category || '').trim() || 'Other';
  const severity = inferSeverity({
    title: input.title,
    description: input.description,
    category,
    preferred: input.severity,
  });
  const priority_score = computePriorityScore({
    severity,
    category,
    title: input.title,
    description: input.description,
    upvotes: input.upvotes,
  });
  const department = resolveDepartment(category);

  return { severity, priority_score, department, category };
}

export function severityRank(severity: string | null | undefined): number {
  return SEVERITY_RANK[normalizeSeverity(severity)] ?? 2;
}

/** Sort comparator: higher priority first (severity → score → recency). */
export function compareByPriorityDesc(
  a: {
    severity?: string | null;
    priority_score?: number | null;
    ai_score?: number | null;
    created_at?: string | null;
  },
  b: {
    severity?: string | null;
    priority_score?: number | null;
    ai_score?: number | null;
    created_at?: string | null;
  }
): number {
  const sev = severityRank(b.severity) - severityRank(a.severity);
  if (sev !== 0) return sev;

  const scoreA = a.priority_score ?? a.ai_score ?? 0;
  const scoreB = b.priority_score ?? b.ai_score ?? 0;
  if (scoreB !== scoreA) return scoreB - scoreA;

  const tA = a.created_at ? +new Date(a.created_at) : 0;
  const tB = b.created_at ? +new Date(b.created_at) : 0;
  return tB - tA;
}

export function severityTone(
  severity: string | null | undefined
): 'critical' | 'high' | 'medium' | 'low' {
  const s = normalizeSeverity(severity);
  if (s === 'Critical') return 'critical';
  if (s === 'High') return 'high';
  if (s === 'Low') return 'low';
  return 'medium';
}

export const SEVERITY_BADGE_CLASS: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
