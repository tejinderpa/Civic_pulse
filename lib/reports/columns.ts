/**
 * Column set that matches the live Supabase `reports` table.
 * Avoid selecting columns that do not exist (PostgREST 400).
 *
 * Live schema: id, user_id, title, description, category, location,
 * image_url, status, severity, created_at, latitude, longitude, priority_score,
 * department, task_force_id, embedding, duplicate_of, upvotes
 *
 * Optional / may be absent: ai_score, sla_deadline, resolved_at
 */
export const REPORT_LIST_SELECT =
  'id, user_id, title, description, category, location, image_url, status, severity, latitude, longitude, created_at, duplicate_of, department, task_force_id, priority_score, upvotes';

/** Fallback if `upvotes` column is missing on older DBs */
export const REPORT_LIST_SELECT_NO_UPVOTES =
  'id, user_id, title, description, category, location, image_url, status, severity, latitude, longitude, created_at, duplicate_of, department, task_force_id, priority_score';

export const REPORT_DETAIL_SELECT = REPORT_LIST_SELECT;

/** Admin list/export select — only columns known to exist on production. */
export const REPORT_ADMIN_SELECT = REPORT_LIST_SELECT;

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

export type NormalizedReportRow = {
  category: string;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lng: number | null;
  upvotes: number;
  votes_count: number;
  ai_score: number;
  priority_score: number;
  severity: string;
  status: string;
  department: unknown;
  duplicate_of: unknown;
  task_force_id: unknown;
};

/** Map a raw DB row to UI-friendly Report shape (upvotes/ai_score/address aliases). */
export function normalizeReportRow<T extends Record<string, unknown>>(
  row: T
): T & NormalizedReportRow {
  const priority =
    asNumber(row.priority_score) ?? asNumber(row.ai_score) ?? 0;

  const upvotes =
    asNumber(row.upvotes) ?? asNumber(row.votes_count) ?? 0;

  const location =
    (typeof row.location === 'string' && row.location) ||
    (typeof row.address === 'string' && row.address) ||
    null;

  const categoryRaw = typeof row.category === 'string' ? row.category.trim() : '';
  const category = categoryRaw || 'Other';

  const latitude = asNumber(row.latitude) ?? asNumber(row.lat);
  const longitude = asNumber(row.longitude) ?? asNumber(row.lng);

  return {
    ...row,
    category,
    location,
    address: location,
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    upvotes,
    votes_count: upvotes,
    ai_score: priority,
    priority_score: priority,
    severity: (typeof row.severity === 'string' && row.severity) || 'Medium',
    status: (typeof row.status === 'string' && row.status) || 'Submitted',
    department: row.department ?? null,
    duplicate_of: row.duplicate_of ?? null,
    task_force_id: row.task_force_id ?? null,
  };
}

export function normalizeReportRows(
  rows: Record<string, unknown>[] | null | undefined
) {
  return (rows || []).map((row) => normalizeReportRow(row));
}
