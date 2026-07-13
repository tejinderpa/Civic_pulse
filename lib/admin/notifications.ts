/**
 * Admin operations inbox — derived from reports (notifications table may be absent).
 */

export type AdminNotifKind =
  | 'new_report'
  | 'critical'
  | 'high'
  | 'task_force'
  | 'unassigned'
  | 'status'
  | 'rejected'
  | 'resolved';

export type AdminNotification = {
  id: string;
  kind: AdminNotifKind;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  issue_id: string;
  /** Display helpers */
  severity: string;
  priority_score: number;
  status: string;
  category: string;
  location: string;
  short_location: string;
  task_force_id: string | null;
  task_force_name: string | null;
  image_url: string | null;
};

export type ReportForNotif = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  severity?: string | null;
  category?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priority_score?: number | null;
  task_force_id?: string | null;
  image_url?: string | null;
  created_at?: string | null;
  duplicate_of?: string | null;
};

const READ_KEY = 'civicpulse_admin_notif_read_v1';

export function loadAdminReadIds(): Set<string> {
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

export function saveAdminReadIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new Event('civicpulse-admin-notif-read'));
  } catch {
    /* ignore */
  }
}

export function shortLocation(loc: string | null | undefined): string {
  if (!loc) return 'Unknown location';
  const parts = loc
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Unknown location';
  return parts.slice(0, 2).join(', ').slice(0, 48);
}

function severityRank(s: string): number {
  switch (s) {
    case 'Critical':
      return 4;
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    case 'Low':
      return 1;
    default:
      return 0;
  }
}

/**
 * One primary inbox item per report — newest first by default.
 * Kind reflects the most operationally useful signal.
 */
export function buildAdminNotifications(
  reports: ReportForNotif[],
  readIds: Set<string>,
  taskForceNames: Record<string, string> = {}
): AdminNotification[] {
  const items: AdminNotification[] = [];

  for (const r of reports) {
    const title = (r.title || 'Untitled report').trim() || 'Untitled report';
    const status = r.status || 'Submitted';
    const severity = r.severity || 'Medium';
    const category = (r.category || '').trim() || 'Other';
    const location = r.location || 'Location pending';
    const score = typeof r.priority_score === 'number' ? r.priority_score : 0;
    const created = r.created_at || new Date().toISOString();
    const tfId = r.task_force_id || null;
    const tfName = tfId ? taskForceNames[tfId] || 'Task force' : null;
    const statusLower = status.toLowerCase();
    const isOpen =
      statusLower !== 'resolved' &&
      statusLower !== 'rejected' &&
      statusLower !== 'closed' &&
      statusLower !== 'done';

    let kind: AdminNotifKind = 'new_report';
    let headline = 'New citizen report';
    let message = `"${title}" · ${category} · ${shortLocation(location)}`;

    if (statusLower === 'rejected') {
      kind = 'rejected';
      headline = r.duplicate_of ? 'Duplicate auto-rejected' : 'Report rejected';
      message = `"${title}" was rejected · ${shortLocation(location)}`;
    } else if (statusLower === 'resolved' || statusLower === 'closed') {
      kind = 'resolved';
      headline = 'Report resolved';
      message = `"${title}" closed · ${shortLocation(location)}`;
    } else if (tfId) {
      kind = 'task_force';
      headline = `Assigned · ${tfName}`;
      message = `"${title}" · ${status} · ${shortLocation(location)}`;
    } else if (severity === 'Critical') {
      kind = 'critical';
      headline = 'Critical priority report';
      message = `"${title}" needs immediate attention · ${shortLocation(location)}`;
    } else if (severity === 'High') {
      kind = 'high';
      headline = 'High priority report';
      message = `"${title}" · ${status} · ${shortLocation(location)}`;
    } else if (isOpen && !tfId && statusLower === 'submitted') {
      kind = 'new_report';
      headline = 'New citizen report';
      message = `"${title}" awaiting review · ${shortLocation(location)}`;
    } else if (isOpen && !tfId) {
      kind = 'unassigned';
      headline = 'Unassigned open report';
      message = `"${title}" · ${status} · no task force`;
    } else {
      kind = 'status';
      headline = `Status: ${status}`;
      message = `"${title}" · ${shortLocation(location)}`;
    }

    const id = `report-${r.id}`;
    items.push({
      id,
      kind,
      title: headline,
      message,
      created_at: created,
      is_read: readIds.has(id),
      issue_id: r.id,
      severity,
      priority_score: score,
      status,
      category,
      location,
      short_location: shortLocation(location),
      task_force_id: tfId,
      task_force_name: tfName,
      image_url: r.image_url || null,
    });
  }

  return items;
}

export type AdminNotifSort = 'newest' | 'priority' | 'location' | 'task_force' | 'status';
export type AdminNotifFilter =
  | 'all'
  | 'unread'
  | 'new_report'
  | 'critical'
  | 'task_force'
  | 'unassigned'
  | 'rejected';

export function filterAdminNotifications(
  items: AdminNotification[],
  filter: AdminNotifFilter,
  search: string
): AdminNotification[] {
  const q = search.trim().toLowerCase();
  return items.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'new_report' && n.kind !== 'new_report') return false;
    if (filter === 'critical' && n.kind !== 'critical' && n.kind !== 'high') return false;
    if (filter === 'task_force' && n.kind !== 'task_force') return false;
    if (filter === 'unassigned' && n.kind !== 'unassigned' && !(n.kind === 'new_report' && !n.task_force_id))
      return false;
    if (filter === 'rejected' && n.kind !== 'rejected') return false;

    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      n.location.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      n.status.toLowerCase().includes(q) ||
      (n.task_force_name || '').toLowerCase().includes(q) ||
      n.severity.toLowerCase().includes(q)
    );
  });
}

export function sortAdminNotifications(
  items: AdminNotification[],
  sort: AdminNotifSort
): AdminNotification[] {
  const copy = [...items];
  switch (sort) {
    case 'priority':
      return copy.sort((a, b) => {
        const d = severityRank(b.severity) - severityRank(a.severity);
        if (d !== 0) return d;
        return b.priority_score - a.priority_score || +new Date(b.created_at) - +new Date(a.created_at);
      });
    case 'location':
      return copy.sort((a, b) =>
        a.short_location.localeCompare(b.short_location) ||
        +new Date(b.created_at) - +new Date(a.created_at)
      );
    case 'task_force':
      return copy.sort((a, b) => {
        const an = a.task_force_name || 'zzz-unassigned';
        const bn = b.task_force_name || 'zzz-unassigned';
        return an.localeCompare(bn) || +new Date(b.created_at) - +new Date(a.created_at);
      });
    case 'status':
      return copy.sort(
        (a, b) => a.status.localeCompare(b.status) || +new Date(b.created_at) - +new Date(a.created_at)
      );
    case 'newest':
    default:
      return copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
}

export function kindMeta(kind: AdminNotifKind): {
  icon: string;
  color: string;
  label: string;
} {
  switch (kind) {
    case 'new_report':
      return { icon: 'fiber_new', color: 'bg-blue-100 text-blue-700', label: 'New' };
    case 'critical':
      return { icon: 'warning', color: 'bg-red-100 text-red-700', label: 'Critical' };
    case 'high':
      return { icon: 'priority_high', color: 'bg-orange-100 text-orange-700', label: 'High' };
    case 'task_force':
      return { icon: 'groups', color: 'bg-indigo-100 text-indigo-700', label: 'Task force' };
    case 'unassigned':
      return { icon: 'person_off', color: 'bg-amber-100 text-amber-800', label: 'Unassigned' };
    case 'rejected':
      return { icon: 'block', color: 'bg-rose-100 text-rose-700', label: 'Rejected' };
    case 'resolved':
      return { icon: 'check_circle', color: 'bg-emerald-100 text-emerald-700', label: 'Resolved' };
    case 'status':
    default:
      return { icon: 'update', color: 'bg-slate-100 text-slate-600', label: 'Update' };
  }
}

export function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
