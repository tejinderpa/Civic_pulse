export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin, isAdminFailure } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildPunjabDemoRows,
  PUNJAB_DEMO_REPORTS,
} from '@/lib/seed/punjabDemoReports';
import { REPORT_LIST_SELECT, normalizeReportRows } from '@/lib/reports/columns';

/**
 * POST /api/admin/seed-demo
 * Inserts ~15 Punjab demo reports (with Unsplash images) into `reports`.
 * Available to both citizen (public read) and authority views.
 *
 * Body: { force?: boolean } — if force, insert even when demo titles already exist.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    // Prefer service role so inserts are not blocked by RLS quirks
    let db = auth.supabase;
    try {
      db = createAdminClient();
    } catch {
      // Fall back to admin session client
      db = auth.supabase;
    }

    // Avoid duplicates unless force
    if (!force) {
      const sampleTitle = PUNJAB_DEMO_REPORTS[0]?.title;
      if (sampleTitle) {
        const { count } = await db
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('title', sampleTitle);
        if ((count || 0) > 0) {
          const { data: existing } = await db
            .from('reports')
            .select(REPORT_LIST_SELECT)
            .ilike('location', '%Punjab%')
            .order('created_at', { ascending: false })
            .limit(20);

          return NextResponse.json({
            ok: true,
            seeded: 0,
            skipped: true,
            message:
              'Punjab demo reports already present. Pass { "force": true } to insert another batch.',
            reports: normalizeReportRows((existing as Record<string, unknown>[]) || []),
          });
        }
      }
    }

    const rows = buildPunjabDemoRows({
      userId: auth.user.id,
      fixedIds: false,
    }).map((r) => {
      // Do not send mock string ids to Postgres uuid column
      const { id: _id, ...rest } = r;
      return rest;
    });

    const { data, error } = await db.from('reports').insert(rows).select(REPORT_LIST_SELECT);

    if (error) {
      // Retry without optional columns that may not exist on older schemas
      console.warn('[seed-demo] insert error, retrying minimal payload:', error.message);
      const minimal = rows.map((r) => ({
        user_id: r.user_id,
        title: r.title,
        description: r.description,
        category: r.category,
        location: r.location,
        latitude: r.latitude,
        longitude: r.longitude,
        status: r.status,
        severity: r.severity,
        priority_score: r.priority_score,
        department: r.department,
        image_url: r.image_url,
        created_at: r.created_at,
      }));
      const retry = await db.from('reports').insert(minimal).select(REPORT_LIST_SELECT);
      if (retry.error) {
        return NextResponse.json(
          { error: retry.error.message, code: 'DB_ERROR' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        ok: true,
        seeded: retry.data?.length || 0,
        reports: normalizeReportRows((retry.data as Record<string, unknown>[]) || []),
        message: `Seeded ${retry.data?.length || 0} Punjab demo reports.`,
      });
    }

    // Best-effort timeline seeds
    if (data?.length) {
      const history = data.map((row: { id: string; created_at?: string }) => ({
        issue_id: row.id,
        action_type: 'submission',
        old_value: null,
        new_value: 'Submitted',
        user_name: auth.fullName || 'Demo Seed',
        user_id: auth.user.id,
        created_at: row.created_at || new Date().toISOString(),
      }));
      try {
        await db.from('issue_history').insert(history);
      } catch {
        /* optional table */
      }
    }

    return NextResponse.json({
      ok: true,
      seeded: data?.length || 0,
      reports: normalizeReportRows((data as Record<string, unknown>[]) || []),
      message: `Seeded ${data?.length || 0} Punjab demo reports across Chandigarh, Ludhiana, Amritsar, Jalandhar, Mohali, Patiala & Phagwara.`,
    });
  } catch (err) {
    console.error('[seed-demo]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Seed failed', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}

/** GET — preview demo payload count without inserting */
export async function GET() {
  const auth = await requireAdmin();
  if (isAdminFailure(auth)) return auth.error;

  return NextResponse.json({
    count: PUNJAB_DEMO_REPORTS.length,
    region: 'Punjab, India',
    cities: [
      'Chandigarh',
      'Ludhiana',
      'Amritsar',
      'Jalandhar',
      'Mohali',
      'Patiala',
      'Phagwara',
    ],
    titles: PUNJAB_DEMO_REPORTS.map((r) => r.title),
  });
}
