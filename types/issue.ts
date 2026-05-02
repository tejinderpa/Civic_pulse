export type IssueStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected' | string;
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical' | string;

export interface Issue {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  address: string; 
  image_url: string | null;
  status: IssueStatus;
  severity: IssueSeverity;
  ai_score: number | null; 
  department: string | null;
  duplicate_of: string | null;
  task_force_id: string | null; // Added
  lat: number | null; 
  lng: number | null; 
  votes_count: number | null; 
  created_at: string;
  sla_deadline: string | null;
  resolved_at: string | null;
  profiles?: {
    full_name: string;
  } | null;
}

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
