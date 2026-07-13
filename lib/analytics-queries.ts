import { SupabaseClient } from '@supabase/supabase-js';
import {
  AnalyticsResponse,
  MapPoint,
  HotspotZone,
  DuplicateCluster,
} from '../types/analytics';
import { MOCK_ISSUES } from './mock-data';
import { useMockData } from './mock';

function getLat(r: Record<string, unknown>): number | null {
  const v = r.latitude ?? r.lat;
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function getLng(r: Record<string, unknown>): number | null {
  const v = r.longitude ?? r.lng;
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function getVotes(r: Record<string, unknown>): number {
  const v = r.upvotes ?? r.votes_count ?? r.priority_score ?? r.ai_score;
  return typeof v === 'number' ? v : parseInt(String(v || 0), 10) || 0;
}

function getAiScore(r: Record<string, unknown>): number {
  const v = r.priority_score ?? r.ai_score;
  return typeof v === 'number' ? v : parseInt(String(v || 0), 10) || 0;
}

function getLocation(r: Record<string, unknown>): string {
  return String(r.location ?? r.address ?? 'Unknown location');
}

/** Short place label for map pins (city / locality). */
export function shortPlaceLabel(location: string): string {
  const parts = location
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Unknown';
  // Prefer first two segments (locality, city) — skip very long first segments
  if (parts.length === 1) return parts[0].slice(0, 28);
  return `${parts[0]}${parts[1] ? `, ${parts[1]}` : ''}`.slice(0, 36);
}

function isOpenStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s !== 'resolved' && s !== 'rejected' && s !== 'closed' && s !== 'done';
}

function isRejectedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'rejected' || s === 'denied';
}

function isResolvedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'resolved' || s === 'closed' || s === 'done';
}

/** ~11km grid cells for hotspot clustering */
function geoKey(lat: number, lng: number, precision = 1): string {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
}

function mapZoomForSpread(points: { lat: number; lng: number }[]): {
  center: [number, number];
  zoom: number;
} {
  if (points.length === 0) return { center: [30.7, 75.5], zoom: 6 };
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const span = Math.max(latSpan, lngSpan);
  let zoom = 6;
  if (span < 0.15) zoom = 12;
  else if (span < 0.5) zoom = 10;
  else if (span < 2) zoom = 8;
  else if (span < 8) zoom = 6;
  else zoom = 5;
  return { center: [midLat, midLng], zoom };
}

/**
 * Pure analytics build — safe to run on the client from the reports cache.
 */
export function buildAnalyticsFromReports(
  reportsIn: Record<string, unknown>[],
  options?: { startDate?: string; endDate?: string; historyDupRejects?: number }
): AnalyticsResponse {
  const startMs = options?.startDate ? new Date(options.startDate).getTime() : 0;
  const endMs = options?.endDate ? new Date(options.endDate).getTime() : Number.POSITIVE_INFINITY;

  let allReports = reportsIn.filter((r) => {
    const t = new Date(String(r.created_at || 0)).getTime();
    return Number.isFinite(t) && t >= startMs && t <= endMs;
  });

  if (allReports.length === 0 && useMockData()) {
    allReports = MOCK_ISSUES as unknown as Record<string, unknown>[];
  }

  const historyDupRejects = options?.historyDupRejects ?? 0;

  const totalIssues = allReports.length;
  const resolvedIssues = allReports.filter((r) => isResolvedStatus(String(r.status || '')));
  const openIssues = allReports.filter((r) => isOpenStatus(String(r.status || ''))).length;
  const totalRejected = allReports.filter((r) =>
    isRejectedStatus(String(r.status || ''))
  ).length;

  const duplicatesFlagged = allReports.filter((r) => r.duplicate_of != null).length;
  const duplicatesAutoRejected = allReports.filter(
    (r) => r.duplicate_of != null && isRejectedStatus(String(r.status || ''))
  ).length;
  // Prefer explicit duplicate rejections; if none flagged but history has signals, surface those
  const autoRejectedDisplay =
    duplicatesAutoRejected > 0
      ? duplicatesAutoRejected
      : historyDupRejects > 0
        ? historyDupRejects
        : totalRejected; // fallback: total rejected when no dup metadata yet

  const resolvedPercent = totalIssues > 0 ? (resolvedIssues.length / totalIssues) * 100 : 0;
  const duplicateRate = totalIssues > 0 ? (duplicatesFlagged / totalIssues) * 100 : 0;

  const withSla = resolvedIssues.filter((r) => r.resolved_at && r.sla_deadline);
  const slaCompliant = withSla.filter(
    (r) => new Date(String(r.resolved_at)) <= new Date(String(r.sla_deadline))
  );
  const slaCompliancePercent =
    withSla.length > 0
      ? (slaCompliant.length / withSla.length) * 100
      : resolvedIssues.length > 0
        ? 100
        : 0;

  let avgResolutionHours = 0;
  const resolvedWithTimes = resolvedIssues.filter((r) => r.created_at && r.resolved_at);
  if (resolvedWithTimes.length > 0) {
    const totalHours = resolvedWithTimes.reduce((sum, r) => {
      const start = new Date(String(r.created_at)).getTime();
      const end = new Date(String(r.resolved_at)).getTime();
      return sum + (end - start) / 3600000;
    }, 0);
    avgResolutionHours = totalHours / resolvedWithTimes.length;
  } else if (resolvedIssues.length > 0) {
    // Estimate from created_at → now for demo if resolved_at missing
    const est = resolvedIssues.reduce((sum, r) => {
      const start = new Date(String(r.created_at)).getTime();
      return sum + Math.max(1, (Date.now() - start) / 3600000) * 0.35;
    }, 0);
    avgResolutionHours = est / resolvedIssues.length;
  }

  const trendMap: Record<
    string,
    { date: string; count: number; bySeverity: Record<string, number> }
  > = {};
  allReports.forEach((r) => {
    const day = new Date(String(r.created_at)).toISOString().split('T')[0];
    if (!trendMap[day]) {
      trendMap[day] = {
        date: day,
        count: 0,
        bySeverity: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      };
    }
    trendMap[day].count++;
    const sev = String(r.severity || 'Medium');
    trendMap[day].bySeverity[sev] = (trendMap[day].bySeverity[sev] || 0) + 1;
  });

  const categories = ['Road', 'Garbage', 'Water', 'Electricity', 'Environment', 'Other'];
  const categoryStats = categories.map((cat) => {
    const count = allReports.filter((r) => {
      const c = String(r.category || '').trim() || 'Other';
      return c === cat;
    }).length;
    return {
      category: cat,
      count,
      percent: totalIssues > 0 ? (count / totalIssues) * 100 : 0,
    };
  });

  const allIssuePoints: MapPoint[] = allReports
    .map((r) => {
      const lat = getLat(r);
      const lng = getLng(r);
      if (lat == null || lng == null) return null;
      const severity_weight =
        r.severity === 'Critical' ? 4 : r.severity === 'High' ? 3 : r.severity === 'Medium' ? 2 : 1;
      const votes = getVotes(r);
      const created = new Date(String(r.created_at)).getTime();
      const daysOld = (Date.now() - created) / (1000 * 60 * 60 * 24);
      const recency_decay = daysOld > 30 ? 0.5 : 1.0;
      const location = getLocation(r);
      const status = String(r.status || 'Submitted');

      return {
        id: String(r.id),
        lat,
        lng,
        weight: severity_weight * (votes + 1) * recency_decay,
        severity: String(r.severity || 'Medium'),
        title: String(r.title || ''),
        category: String(r.category || '').trim() || 'Other',
        status,
        votes,
        location,
        shortLabel: shortPlaceLabel(location),
        isDuplicate: r.duplicate_of != null,
        isRejected: isRejectedStatus(status),
      };
    })
    .filter(Boolean) as MapPoint[];

  const deptMap: Record<
    string,
    { total: number; resolved: number; hours: number; hoursN: number }
  > = {};
  allReports.forEach((r) => {
    const dept = String(r.department || 'Unassigned');
    if (!deptMap[dept]) deptMap[dept] = { total: 0, resolved: 0, hours: 0, hoursN: 0 };
    deptMap[dept].total++;
    if (isResolvedStatus(String(r.status || ''))) {
      deptMap[dept].resolved++;
      if (r.created_at && r.resolved_at) {
        const h =
          (new Date(String(r.resolved_at)).getTime() - new Date(String(r.created_at)).getTime()) /
          3600000;
        deptMap[dept].hours += h;
        deptMap[dept].hoursN++;
      }
    }
  });

  const departmentStats = Object.entries(deptMap).map(([department, d]) => ({
    department,
    total: d.total,
    resolved: d.resolved,
    avgResolutionHours: d.hoursN > 0 ? d.hours / d.hoursN : 0,
    slaCompliancePercent: d.total > 0 ? (d.resolved / d.total) * 100 : 0,
  }));

  // Top areas — group by short place label
  const areaMap: Record<
    string,
    { count: number; openCount: number; lat: number; lng: number; full: string }
  > = {};
  allReports.forEach((r) => {
    const full = getLocation(r);
    const key = shortPlaceLabel(full);
    const lat = getLat(r);
    const lng = getLng(r);
    if (!areaMap[key]) {
      areaMap[key] = {
        count: 0,
        openCount: 0,
        lat: lat || 30.7,
        lng: lng || 75.5,
        full,
      };
    }
    areaMap[key].count++;
    if (isOpenStatus(String(r.status || ''))) areaMap[key].openCount++;
    if (lat != null && lng != null) {
      // Running average of coordinates
      const n = areaMap[key].count;
      areaMap[key].lat = (areaMap[key].lat * (n - 1) + lat) / n;
      areaMap[key].lng = (areaMap[key].lng * (n - 1) + lng) / n;
    }
  });
  const topAreas = Object.entries(areaMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([address, v]) => ({
      address,
      count: v.count,
      openCount: v.openCount,
      lat: v.lat,
      lng: v.lng,
    }));

  // Geographic hotspots for task-force deployment
  const cellMap: Record<
    string,
    {
      lat: number;
      lng: number;
      count: number;
      openCount: number;
      criticalCount: number;
      labels: Record<string, number>;
      categories: Record<string, number>;
    }
  > = {};
  allIssuePoints.forEach((p) => {
    const key = geoKey(p.lat, p.lng, 1);
    if (!cellMap[key]) {
      cellMap[key] = {
        lat: p.lat,
        lng: p.lng,
        count: 0,
        openCount: 0,
        criticalCount: 0,
        labels: {},
        categories: {},
      };
    }
    const c = cellMap[key];
    c.count++;
    c.lat = (c.lat * (c.count - 1) + p.lat) / c.count;
    c.lng = (c.lng * (c.count - 1) + p.lng) / c.count;
    if (isOpenStatus(p.status)) c.openCount++;
    if (p.severity === 'Critical' || p.severity === 'High') c.criticalCount++;
    c.labels[p.shortLabel] = (c.labels[p.shortLabel] || 0) + 1;
    c.categories[p.category] = (c.categories[p.category] || 0) + 1;
  });

  const hotspotZones: HotspotZone[] = Object.entries(cellMap)
    .map(([id, c]) => {
      const label =
        Object.entries(c.labels).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Hotspot zone';
      const cats = Object.entries(c.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k);
      let recommendation = 'Monitor — low volume';
      if (c.openCount >= 3 || c.criticalCount >= 2) {
        recommendation = 'Deploy task force — high open / severity load';
      } else if (c.openCount >= 1) {
        recommendation = 'Schedule field unit — open reports present';
      } else if (c.count >= 2) {
        recommendation = 'Review resolved cluster for prevention';
      }
      return {
        id,
        label,
        lat: c.lat,
        lng: c.lng,
        count: c.count,
        openCount: c.openCount,
        criticalCount: c.criticalCount,
        categories: cats,
        recommendation,
      };
    })
    .sort((a, b) => b.openCount - a.openCount || b.count - a.count)
    .slice(0, 8);

  // Duplicate clusters grouped by parent id
  const dupParentMap: Record<string, DuplicateCluster> = {};
  allReports
    .filter((r) => r.duplicate_of)
    .forEach((r) => {
      const parent = String(r.duplicate_of);
      if (!dupParentMap[parent]) {
        const original = allReports.find((x) => String(x.id) === parent);
        dupParentMap[parent] = {
          duplicateOf: parent,
          mainTitle: String(original?.title || r.title || 'Original report'),
          address: getLocation(original || r),
          category: String((original || r).category || 'Other'),
          count: 0,
          autoRejected: 0,
          open: 0,
        };
      }
      dupParentMap[parent].count++;
      if (isRejectedStatus(String(r.status || ''))) dupParentMap[parent].autoRejected++;
      if (isOpenStatus(String(r.status || ''))) dupParentMap[parent].open++;
    });
  const duplicateClusters = Object.values(dupParentMap).slice(0, 10);

  const volumeTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
  const { center: mapCenter, zoom: mapZoom } = mapZoomForSpread(allIssuePoints);

  return {
    kpis: {
      totalIssues,
      openIssues,
      resolvedPercent: Math.round(resolvedPercent * 10) / 10,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
      slaCompliancePercent: Math.round(slaCompliancePercent * 10) / 10,
      duplicateRate: Math.round(duplicateRate * 10) / 10,
      duplicatesFlagged,
      duplicatesAutoRejected: autoRejectedDisplay,
      totalRejected,
      trends: {
        totalIssues: 0,
        resolvedPercent: 0,
        slaCompliancePercent: 0,
      },
    },
    volumeTrend,
    categoryStats,
    departmentStats,
    resolutionRateTrend: volumeTrend.map((t) => {
      const dayReports = allReports.filter(
        (r) => new Date(String(r.created_at)).toISOString().split('T')[0] === t.date
      );
      const dayResolved = dayReports.filter((r) =>
        isResolvedStatus(String(r.status || ''))
      ).length;
      return {
        date: t.date,
        compliancePercent: dayReports.length > 0 ? (dayResolved / dayReports.length) * 100 : 0,
        total: t.count,
      };
    }),
    topAreas,
    allIssuePoints,
    priorityIssues: [...allReports]
      .filter((r) => isOpenStatus(String(r.status || '')))
      .sort((a, b) => getAiScore(b) - getAiScore(a) || getVotes(b) - getVotes(a))
      .slice(0, 6)
      .map((r) => ({
        id: String(r.id),
        title: String(r.title || ''),
        address: getLocation(r),
        aiScore: getAiScore(r),
        severity: String(r.severity || 'Medium'),
        status: String(r.status || 'Submitted'),
      })),
    duplicateClusters,
    hotspotZones,
    mapCenter,
    mapZoom,
  };
}

/** Server path: one light select, no history table (was a second slow query). */
export async function getAnalyticsData(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<AnalyticsResponse> {
  const { data: reports, error } = await supabase
    .from('reports')
    .select(
      'id, title, description, category, location, status, severity, latitude, longitude, created_at, department, duplicate_of, priority_score'
    )
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Supabase analytics error:', error);
  }

  let allReports: Record<string, unknown>[] = (reports as Record<string, unknown>[]) || [];

  if ((error || allReports.length === 0) && useMockData()) {
    allReports = MOCK_ISSUES as unknown as Record<string, unknown>[];
  }

  return buildAnalyticsFromReports(allReports, { startDate, endDate });
}
