/**
 * Build citizen activity items from reports when a `notifications` table
 * is not available (current live schema).
 */

export type CitizenNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  href?: string;
  kind: 'report_status' | 'report_created' | 'system';
};

type ReportLike = {
  id: string;
  title?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const READ_KEY = 'civicpulse_notif_read_v1';

export function loadReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveReadIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore */
  }
}

export function buildNotificationsFromReports(
  reports: ReportLike[],
  readIds: Set<string>
): CitizenNotification[] {
  const items: CitizenNotification[] = [];

  for (const r of reports) {
    const title = r.title || 'Your report';
    const status = r.status || 'Submitted';
    const created = r.created_at || new Date().toISOString();
    const updated = r.updated_at || created;

    items.push({
      id: `created-${r.id}`,
      title: 'Report submitted',
      message: `"${title}" was filed successfully.`,
      created_at: created,
      is_read: readIds.has(`created-${r.id}`),
      href: `/my-reports`,
      kind: 'report_created',
    });

    const s = status.toLowerCase();
    if (s !== 'submitted' && s !== 'pending') {
      items.push({
        id: `status-${r.id}-${status}`,
        title: `Status: ${status}`,
        message: `"${title}" is now marked ${status}.`,
        created_at: updated,
        is_read: readIds.has(`status-${r.id}-${status}`),
        href: `/issues/${r.id}`,
        kind: 'report_status',
      });
    }
  }

  // Welcome / system tip (once)
  items.push({
    id: 'system-welcome',
    title: 'Welcome to CivicPulse',
    message: 'Track your reports, upvote community issues, and watch status updates here.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_read: readIds.has('system-welcome'),
    href: '/feed',
    kind: 'system',
  });

  return items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
