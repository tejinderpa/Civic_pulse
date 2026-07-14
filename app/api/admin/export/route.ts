export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import type { ExportRequest } from '@/types/report';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const { issueIds }: ExportRequest = await req.json();

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty issueIds', code: 'BAD_REQUEST' }, { status: 400 });
    }

    if (issueIds.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 issues can be exported at once', code: 'BAD_REQUEST' }, { status: 400 });
    }

    // Service role only after admin check
    const supabase = createAdminClient();

    const { data: issues, error } = await supabase
      .from('reports')
      .select(`
        id, title, category, severity, status, department,
        priority_score, location, created_at, duplicate_of
      `)
      .in('id', issueIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Export API] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch issues for export', code: 'DB_ERROR' }, { status: 500 });
    }

    if (!issues || issues.length === 0) {
      return NextResponse.json({ error: 'No issues found matching the provided IDs', code: 'NOT_FOUND' }, { status: 404 });
    }

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }).replace(',', '');
    };

    const headers = [
      'Issue ID', 'Title', 'Category', 'Severity', 'Status', 'Department',
      'Priority Score', 'Location', 'Created At', 'Duplicate Of',
    ];

    const rows = issues.map((i) => [
      i.id,
      i.title,
      i.category || 'Other',
      i.severity,
      i.status,
      i.department || '',
      (i as { priority_score?: number }).priority_score ?? 0,
      i.location || '',
      formatDate(i.created_at),
      i.duplicate_of || '',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const filename = `civicpulse-report-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[Export API] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred during export', code: 'INTERNAL' }, { status: 500 });
  }
}
