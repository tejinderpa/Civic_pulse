import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ExportRequest } from '@/types/issue';

export async function POST(req: Request) {
  try {
    const { issueIds }: ExportRequest = await req.json();

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty issueIds' }, { status: 400 });
    }

    if (issueIds.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 issues can be exported at once' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch issues
    const { data: issues, error } = await supabase
      .from('reports')
      .select(`
        id, title, category, severity, status, department,
        ai_score, address, created_at, sla_deadline, resolved_at,
        duplicate_of, votes_count
      `)
      .in('id', issueIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Export API] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch issues for export' }, { status: 500 });
    }

    if (!issues || issues.length === 0) {
      return NextResponse.json({ error: 'No issues found matching the provided IDs' }, { status: 404 });
    }

    // SLA Status logic
    const getSlaStatus = (issue: any) => {
      const now = new Date();
      const resolvedAt = issue.resolved_at ? new Date(issue.resolved_at) : null;
      const slaDeadline = issue.sla_deadline ? new Date(issue.sla_deadline) : null;

      if (resolvedAt && slaDeadline) {
        return resolvedAt <= slaDeadline ? 'Within SLA' : 'Breached';
      }
      if (!resolvedAt && slaDeadline) {
        return slaDeadline < now ? 'Breached (Open)' : 'Active';
      }
      return 'N/A';
    };

    // Format Dates (DD/MM/YYYY HH:MM IST approximation)
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      }).replace(',', '');
    };

    // Build CSV
    const headers = [
      'Issue ID', 'Title', 'Category', 'Severity', 'Status', 'Department',
      'AI Score', 'Votes', 'Address', 'Created At', 'SLA Deadline', 
      'Resolved At', 'SLA Status', 'Duplicate Of'
    ];

    const rows = issues.map(i => [
      i.id,
      i.title,
      i.category,
      i.severity,
      i.status,
      i.department || '',
      i.ai_score || '0',
      i.votes_count || '0',
      i.address,
      formatDate(i.created_at),
      formatDate(i.sla_deadline),
      formatDate(i.resolved_at),
      getSlaStatus(i),
      i.duplicate_of || ''
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const filename = `civicpulse-report-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (err) {
    console.error('[Export API] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred during export' }, { status: 500 });
  }
}
