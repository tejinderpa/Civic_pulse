/**
 * Priority helpers re-exported for API routes / Gemini layer.
 * Scoring is heuristic-first so reports never block on AI availability.
 */
export {
  buildReportPriorityMeta,
  computePriorityScore,
  inferSeverity,
  normalizeSeverity,
  resolveDepartment,
  type ReportPriorityMeta,
  type SeverityLevel,
} from '@/lib/reports/priority';
