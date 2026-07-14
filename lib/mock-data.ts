import {
  buildPunjabDemoRows,
  PUNJAB_DEMO_REPORTS,
  type DemoReportSeed,
} from '@/lib/seed/punjabDemoReports';

export type MockIssue = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  status: string;
  severity: string;
  priority_score: number;
  ai_score: number;
  department: string;
  image_url: string;
  upvotes: number;
  votes_count: number;
  created_at: string;
  duplicate_of: string | null;
  task_force_id: null;
  resolved_at: string | null;
};

/**
 * In-app mock reports (Punjab region, Unsplash images).
 * Used when NEXT_PUBLIC_USE_MOCK_DATA=true or DB is empty in demo mode.
 */
export const MOCK_ISSUES: MockIssue[] = buildPunjabDemoRows({ fixedIds: true }).map((row) => {
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  const priority = Number(row.priority_score) || 0;
  const upvotes = Number(row.upvotes) || 0;
  const location = String(row.location || '');

  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    category: String(row.category || 'Other'),
    location,
    address: location,
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    status: String(row.status || 'Submitted'),
    severity: String(row.severity || 'Medium'),
    priority_score: priority,
    ai_score: priority,
    department: String(row.department || ''),
    image_url: String(row.image_url || ''),
    upvotes,
    votes_count: upvotes,
    created_at: String(row.created_at || new Date().toISOString()),
    duplicate_of: (row.duplicate_of as string | null) ?? null,
    task_force_id: null,
    resolved_at: (row.resolved_at as string | null) ?? null,
  };
});

export { PUNJAB_DEMO_REPORTS };
export type { DemoReportSeed };
