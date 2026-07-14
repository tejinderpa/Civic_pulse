/**
 * Lightweight classify helper (category → department + severity hints).
 */
export {
  buildReportPriorityMeta,
  resolveDepartment,
  inferSeverity,
  type ReportPriorityMeta,
} from '@/lib/reports/priority';

export const VALID_CATEGORIES = [
  'Road',
  'Garbage',
  'Water',
  'Electricity',
  'Environment',
  'Other',
] as const;

export function normalizeCategory(raw: string | null | undefined): string {
  const t = (raw || '').trim();
  if (!t) return 'Other';
  const lower = t.toLowerCase();
  for (const c of VALID_CATEGORIES) {
    if (c.toLowerCase() === lower) return c;
  }
  if (lower.includes('road') || lower.includes('pothole') || lower.includes('street')) return 'Road';
  if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash')) return 'Garbage';
  if (lower.includes('water') || lower.includes('sewage') || lower.includes('drain')) return 'Water';
  if (lower.includes('electric') || lower.includes('power') || lower.includes('light')) return 'Electricity';
  if (lower.includes('tree') || lower.includes('park') || lower.includes('environment')) return 'Environment';
  return 'Other';
}
