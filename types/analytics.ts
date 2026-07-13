export interface KPIStats {
  totalIssues: number;
  openIssues: number;
  resolvedPercent: number;
  avgResolutionHours: number;
  slaCompliancePercent: number;
  /** Share of all reports flagged as duplicates (duplicate_of set) */
  duplicateRate: number;
  /** Count of reports flagged as duplicates */
  duplicatesFlagged: number;
  /** Duplicates auto-rejected by the system (Rejected + duplicate_of) */
  duplicatesAutoRejected: number;
  /** All rejected reports (any reason) */
  totalRejected: number;
  trends: {
    totalIssues: number;
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
  total: number;
  resolved: number;
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
  location: string;
  shortLabel: string;
  isDuplicate: boolean;
  isRejected: boolean;
}

export interface PriorityInsight {
  id: string;
  title: string;
  address: string;
  aiScore: number;
  severity: string;
  status: string;
}

export interface DuplicateCluster {
  duplicateOf: string;
  mainTitle: string;
  address: string;
  category: string;
  count: number;
  autoRejected: number;
  open: number;
}

/** Geographic concentration for task-force planning */
export interface HotspotZone {
  id: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  openCount: number;
  criticalCount: number;
  categories: string[];
  recommendation: string;
}

export interface AnalyticsResponse {
  kpis: KPIStats;
  volumeTrend: VolumeTrendPoint[];
  categoryStats: CategoryStat[];
  departmentStats: DepartmentStat[];
  resolutionRateTrend: ResolutionTrendPoint[];
  topAreas: { address: string; count: number; openCount: number; lat: number; lng: number }[];
  allIssuePoints: MapPoint[];
  priorityIssues: PriorityInsight[];
  duplicateClusters: DuplicateCluster[];
  hotspotZones: HotspotZone[];
  mapCenter: [number, number];
  mapZoom: number;
}
