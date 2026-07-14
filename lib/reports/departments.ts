/**
 * Canonical municipal departments for assignment + AI prompts.
 */

export const DEPARTMENTS = [
  'PWD (Roads)',
  'PWD (Buildings)',
  'Municipal Sanitation',
  'Solid Waste Management',
  'Water & Sewerage Board',
  'Drainage & Storm Water',
  'Electricity Department',
  'Street Lighting',
  'Parks & Environment',
  'Horticulture',
  'Traffic Police',
  'Transport / RTA',
  'Fire & Emergency Services',
  'Health & Sanitation',
  'Public Health Engineering',
  'Urban Development / Town Planning',
  'Housing Board',
  'Education / School Safety',
  'Animal Control / Veterinary',
  'Disaster Management',
  'Pollution Control Board',
  'General Municipal Services',
] as const;

export type DepartmentName = (typeof DEPARTMENTS)[number] | string;

/** Map category → default department */
export const CATEGORY_DEFAULT_DEPARTMENT: Record<string, string> = {
  Road: 'PWD (Roads)',
  Garbage: 'Municipal Sanitation',
  Water: 'Water & Sewerage Board',
  Electricity: 'Electricity Department',
  Environment: 'Parks & Environment',
  Other: 'General Municipal Services',
};

export function normalizeDepartment(raw: string | null | undefined): string {
  const t = (raw || '').trim();
  if (!t) return 'General Municipal Services';
  const lower = t.toLowerCase();
  for (const d of DEPARTMENTS) {
    if (d.toLowerCase() === lower) return d;
  }
  // Fuzzy aliases
  if (lower.includes('pwd') && lower.includes('road')) return 'PWD (Roads)';
  if (lower.includes('sanit') || lower.includes('garbage') || lower.includes('waste'))
    return 'Municipal Sanitation';
  if (lower.includes('water') || lower.includes('sewer')) return 'Water & Sewerage Board';
  if (lower.includes('electric') || lower.includes('power')) return 'Electricity Department';
  if (lower.includes('park') || lower.includes('tree') || lower.includes('environment'))
    return 'Parks & Environment';
  if (lower.includes('traffic')) return 'Traffic Police';
  if (lower.includes('fire')) return 'Fire & Emergency Services';
  if (lower.includes('drain')) return 'Drainage & Storm Water';
  if (lower.includes('light')) return 'Street Lighting';
  return t;
}
