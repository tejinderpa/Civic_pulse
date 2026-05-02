export interface KPIStats {
  totalIssues: number;
  resolvedPercent: number;
  avgResolutionHours: number;
  slaCompliancePercent: number;
  duplicateRate: number;
  trends: {
    totalIssues: number; // % change vs previous
    resolvedPercent: number;
    slaCompliancePercent: number;
  };
}

export interface VolumeTrendPoint {
  date: string;
  count: number;
  bySeverity: Record<string, number>;
}

export interface CategoryStat {
  category: string;
  count: number;
  percent: number;
}

export interface DepartmentStat {
  department: string;
  avgResolutionHours: number;
  slaCompliancePercent: number;
}

export interface ResolutionTrendPoint {
  date: string;
  compliancePercent: number;
  total: number;
}

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  weight: number;
  severity: string;
  title: string;
  category: string;
  status: string;
  votes: number;
}

export interface PriorityInsight {
  id: string;
  title: string;
  address: string;
  aiScore: number;
  severity: string;
}

export interface DuplicateCluster {
  duplicateOf: string;
  mainTitle: string;
  address: string;
  category: string;
  count: number;
}

export interface AnalyticsResponse {
  kpis: KPIStats;
  volumeTrend: VolumeTrendPoint[];
  categoryStats: CategoryStat[];
  departmentStats: DepartmentStat[];
  resolutionRateTrend: ResolutionTrendPoint[];
  topAreas: { address: string; count: number; lat: number; lng: number }[];
  allIssuePoints: MapPoint[];
  priorityIssues: PriorityInsight[];
  duplicateClusters: DuplicateCluster[];
}
