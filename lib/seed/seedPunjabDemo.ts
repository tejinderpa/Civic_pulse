/**
 * CLI: insert Punjab demo reports into Supabase.
 *
 * Usage:
 *   npm run seed:punjab
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { buildPunjabDemoRows, PUNJAB_DEMO_REPORTS } from './punjabDemoReports';

function loadEnvLocal() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      '❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
    console.error('   Or run supabase/seed_punjab_demo.sql in the Supabase SQL Editor.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`🌱 Seeding ${PUNJAB_DEMO_REPORTS.length} Punjab demo reports…`);

  // Prefer attaching to an existing admin/citizen profile if present
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role')
    .limit(5);

  const ownerId =
    profiles?.find((p) => p.role === 'citizen')?.id ||
    profiles?.find((p) => p.role === 'admin' || p.role === 'authority')?.id ||
    profiles?.[0]?.id ||
    null;

  const rows = buildPunjabDemoRows({
    userId: ownerId || undefined,
    fixedIds: false,
  }).map((r) => {
    const { id: _drop, ...rest } = r;
    return rest;
  });

  // Remove previous demo batch by title
  const titles = PUNJAB_DEMO_REPORTS.map((r) => r.title);
  await supabase.from('reports').delete().in('title', titles);

  const { data, error } = await supabase.from('reports').insert(rows).select('id, title, location');

  if (error) {
    console.error('❌ Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${data?.length || 0} reports`);
  data?.forEach((r) => console.log(`   • ${r.title} — ${r.location}`));
  console.log('Done. Open citizen feed + admin dashboard to verify analytics.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
