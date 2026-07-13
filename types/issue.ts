/**
 * @deprecated Import from `@/types/report` instead.
 * Re-exports kept for backward compatibility during migration.
 */
export type {
  Report as Issue,
  ReportStatus as IssueStatus,
  ReportSeverity as IssueSeverity,
  Report,
  ReportStatus,
  ReportSeverity,
  ReportCategory,
  TaskForce,
  TaskForceResult,
  ExportRequest,
  TaskForceRequest,
} from './report';

export { normalizeStatus, reportCoords } from './report';
