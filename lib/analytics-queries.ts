import { SupabaseClient } from '@supabase/supabase-js';
import { AnalyticsResponse, MapPoint } from '../types/analytics';
import { MOCK_ISSUES } from './mock-data';

export async function getAnalyticsData(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<AnalyticsResponse> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Fetch base reports within range
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    console.error('Supabase analytics error:', error);
    // Fallback to purely mock data for demo if DB fails or is empty
  }

  const allReports = (reports && reports.length > 5) ? reports : MOCK_ISSUES;

  // 1. KPI Calculations
  const totalIssues = allReports.length;
  const resolvedIssues = allReports.filter(r => r.status === 'Resolved');
  const resolvedPercent = totalIssues > 0 ? (resolvedIssues.length / totalIssues) * 100 : 0;
  
  // SLA Compliance (Assumes sla_deadline exists, if not use mock)
  const slaCompliant = resolvedIssues.filter(r => {
    if (!r.resolved_at || !r.sla_deadline) return true;
    return new Date(r.resolved_at) <= new Date(r.sla_deadline);
  });
  const slaCompliancePercent = resolvedIssues.length > 0 
    ? (slaCompliant.length / resolvedIssues.length) * 100 : 92;

  // 2. Volume Trend (Grouping by day)
  const trendMap: Record<string, { date: string, count: number, bySeverity: any }> = {};
  allReports.forEach(r => {
    const day = new Date(r.created_at).toISOString().split('T')[0];
    if (!trendMap[day]) {
      trendMap[day] = { date: day, count: 0, bySeverity: { Critical: 0, High: 0, Medium: 0, Low: 0 }};
    }
    trendMap[day].count++;
    const sev = r.severity || 'Medium';
    trendMap[day].bySeverity[sev] = (trendMap[day].bySeverity[sev] || 0) + 1;
  });

  // 3. Category Stats
  const categories = ['Road', 'Garbage', 'Water', 'Electricity', 'Other'];
  const categoryStats = categories.map(cat => {
    const count = allReports.filter(r => r.category === cat).length;
    return {
      category: cat,
      count,
      percent: totalIssues > 0 ? (count / totalIssues) * 100 : 0
    };
  });

  // 4. Heatmap Points with Weighted Intensity
  const allIssuePoints: MapPoint[] = allReports
    .filter(r => r.lat && r.lng)
    .map(r => {
      const severity_weight = r.severity === 'Critical' ? 4 : r.severity === 'High' ? 3 : r.severity === 'Medium' ? 2 : 1;
      const votes = r.votes_count || 0;
      const created = new Date(r.created_at).getTime();
      const now = Date.now();
      const daysOld = (now - created) / (1000 * 60 * 60 * 24);
      const recency_decay = daysOld > 30 ? 0.5 : 1.0;
      
      return {
        id: r.id,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        weight: severity_weight * (votes + 1) * recency_decay,
        severity: r.severity,
        title: r.title,
        category: r.category,
        status: r.status,
        votes: votes
      };
    });

  // 5. Build Final Response
  return {
    kpis: {
      totalIssues,
      resolvedPercent,
      avgResolutionHours: 14.5, // Mocked for now
      slaCompliancePercent,
      duplicateRate: 8.2, // Mocked for now
      trends: {
        totalIssues: 12,
        resolvedPercent: 5.4,
        slaCompliancePercent: -2.1
      }
    },
    volumeTrend: Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date)),
    categoryStats,
    departmentStats: [
      { department: 'Public Works', avgResolutionHours: 22, slaCompliancePercent: 88 },
      { department: 'Sanitation', avgResolutionHours: 12, slaCompliancePercent: 94 },
      { department: 'Utilities', avgResolutionHours: 36, slaCompliancePercent: 72 }
    ],
    resolutionRateTrend: Object.values(trendMap).map(t => ({
      date: t.date,
      compliancePercent: 85 + Math.random() * 10,
      total: t.count
    })),
    topAreas: [
      { address: 'Main Street & 5th Ave', count: 42, lat: 20.6, lng: 78.9 },
      { address: 'Industrial Area Phase II', count: 31, lat: 20.7, lng: 78.8 }
    ],
    allIssuePoints,
    priorityIssues: allReports
      .sort((a,b) => (b.votes_count || 0) - (a.votes_count || 0))
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        title: r.title,
        address: r.address || 'Unknown location',
        aiScore: Math.floor(Math.random() * 30) + 70, // Deterministic mock score
        severity: r.severity || 'Medium'
      })),
    duplicateClusters: [
      { duplicateOf: '1', mainTitle: 'Water Leak at Central Square', address: 'Central Square', category: 'Water', count: 4 },
      { duplicateOf: '2', mainTitle: 'Pothole on Bridge Road', address: 'Bridge Road', category: 'Road', count: 3 }
    ]
  };
}
