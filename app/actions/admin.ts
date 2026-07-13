'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import type { Report } from '@/types/report';
import {
  REPORT_ADMIN_SELECT,
  normalizeReportRow,
} from '@/lib/reports/columns';

export async function fetchAdminIssues(searchQuery: string = ''): Promise<Report[]> {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) {
    console.warn('[fetchAdminIssues] Admin auth failed — returning empty list');
    return [];
  }

  try {
    const supabase = createAdminClient();
    let query = supabase.from('reports').select(REPORT_ADMIN_SELECT);

    if (searchQuery) {
      const q = searchQuery.replace(/[%_,]/g, '').trim();
      if (q) {
        query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`);
      }
    }

    query = query.order('created_at', { ascending: false }).limit(200);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin issues (server action):', error);
      // Fallback: try minimal columns if optional ones cause issues
      const fallback = await supabase
        .from('reports')
        .select('id, user_id, title, description, category, location, image_url, status, severity, latitude, longitude, created_at, duplicate_of, department, task_force_id, priority_score')
        .order('created_at', { ascending: false })
        .limit(200);

      if (fallback.error) {
        console.error('Fallback admin issues fetch also failed:', fallback.error);
        return [];
      }

      return (fallback.data || []).map(
        (row) => normalizeReportRow(row as Record<string, unknown>) as unknown as Report
      );
    }

    return (data || []).map(
      (row) => normalizeReportRow(row as Record<string, unknown>) as unknown as Report
    );
  } catch (err) {
    console.error('fetchAdminIssues unexpected error:', err);
    return [];
  }
}
