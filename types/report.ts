/** Canonical report / civic issue model (table: reports) */

export type ReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type ReportSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReportCategory =
  | 'Road'
  | 'Garbage'
  | 'Water'
  | 'Electricity'
  | 'Environment'
  | 'Other'
  | string;

export interface Report {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ReportCategory | null;
  location: string | null;
  image_url: string | null;
  status: ReportStatus | string;
  severity: ReportSeverity | string;
  ai_score: number | null;
  department: string | null;
  duplicate_of: string | null;
  task_force_id: string | null;
  latitude: number | null;
  longitude: number | null;
  /** @deprecated use latitude */
  lat?: number | null;
  /** @deprecated use longitude */
  lng?: number | null;
  /** @deprecated use location */
  address?: string | null;
  upvotes: number | null;
  /** @deprecated use upvotes */
  votes_count?: number | null;
  created_at: string;
  sla_deadline: string | null;
  resolved_at: string | null;
  embedding?: number[] | string | null;
  profiles?: {
    full_name: string | null;
  } | null;
}

/** Normalize legacy / free-form status strings to the canonical set. */
export function normalizeStatus(status: string | null | undefined): ReportStatus {
  const s = (status || 'Submitted').toLowerCase().trim();
  if (s === 'pending' || s === 'submitted') return 'Submitted';
  if (s === 'under review' || s === 'review') return 'Under Review';
  if (s === 'in progress' || s === 'in_progress' || s === 'progress') return 'In Progress';
  if (s === 'resolved' || s === 'closed' || s === 'done') return 'Resolved';
  if (s === 'rejected' || s === 'denied') return 'Rejected';
  return 'Submitted';
}

/** Map a report row to UI-friendly coordinate + place aliases used by older components. */
export function reportCoords(report: {
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  location?: string | null;
  address?: string | null;
}) {
  const latitude = report.latitude ?? report.lat ?? null;
  const longitude = report.longitude ?? report.lng ?? null;
  const location = report.location ?? report.address ?? null;
  return { latitude, longitude, location, lat: latitude, lng: longitude, address: location };
}

// Re-export legacy names used across the app during migration
export type Issue = Report;
export type IssueStatus = ReportStatus;
export type IssueSeverity = ReportSeverity;

export interface TaskForce {
  id: string;
  name: string;
  created_by: string;
  status: 'active' | 'completed' | 'disbanded';
  created_at: string;
  updated_at: string;
}

export interface TaskForceResult {
  taskForceId: string;
  name: string;
  issuesAssigned: number;
  statusesUpdated: number;
}

export interface ExportRequest {
  issueIds: string[];
}

export interface TaskForceRequest {
  name: string;
  issueIds: string[];
}
