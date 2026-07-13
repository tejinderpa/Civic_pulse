import L from 'leaflet';
import { normalizeStatus, type ReportStatus } from '@/types/report';

export type MapStatusKey =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

/** Visual design: shape + color by workflow status */
export function getStatusVisual(status: string | null | undefined): {
  key: MapStatusKey;
  label: string;
  color: string;
  shape: 'dot' | 'ring' | 'diamond' | 'check' | 'cross';
} {
  const s = normalizeStatus(status);
  switch (s) {
    case 'Submitted':
      return { key: 'Submitted', label: 'Pending', color: '#F59E0B', shape: 'dot' };
    case 'Under Review':
      return { key: 'Under Review', label: 'Under Review', color: '#3B82F6', shape: 'ring' };
    case 'In Progress':
      return { key: 'In Progress', label: 'In Progress', color: '#8B5CF6', shape: 'diamond' };
    case 'Resolved':
      return { key: 'Resolved', label: 'Resolved', color: '#16A34A', shape: 'check' };
    case 'Rejected':
      return { key: 'Rejected', label: 'Rejected', color: '#DC2626', shape: 'cross' };
    default:
      return { key: 'Submitted', label: 'Pending', color: '#F59E0B', shape: 'dot' };
  }
}

function shapeHtml(shape: string, color: string): string {
  const shadow = 'box-shadow:0 2px 8px rgba(0,0,0,0.28)';
  switch (shape) {
    case 'dot':
      // Pending — solid circle
      return `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid #fff;${shadow}"></div>`;
    case 'ring':
      // Under review — hollow circle
      return `<div style="width:16px;height:16px;border-radius:50%;background:#fff;border:3.5px solid ${color};${shadow}"></div>`;
    case 'diamond':
      // In progress — diamond
      return `<div style="width:14px;height:14px;background:${color};border:2.5px solid #fff;transform:rotate(45deg);${shadow}"></div>`;
    case 'check':
      // Resolved — green circle with check
      return `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;${shadow}">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>`;
    case 'cross':
      // Rejected — red circle with X
      return `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;${shadow}">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
      </div>`;
    default:
      return `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff"></div>`;
  }
}

/** Leaflet divIcon keyed by status (and optional severity ring). */
export function createStatusIcon(status: string | null | undefined, severity?: string | null): L.DivIcon {
  const visual = getStatusVisual(status);
  const criticalPulse =
    severity === 'Critical' && visual.key !== 'Resolved' && visual.key !== 'Rejected'
      ? 'animation:civic-pulse 1.4s ease-in-out infinite;'
      : '';

  return L.divIcon({
    className: 'civic-status-marker',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;${criticalPulse}">
        ${shapeHtml(visual.shape, visual.color)}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
  });
}

/** Match filter chips to status groups */
export function statusMatchesFilter(status: string | null | undefined, filter: string): boolean {
  if (filter === 'all') return true;
  const s = normalizeStatus(status).toLowerCase();
  if (filter === 'pending') {
    return s === 'submitted' || s === 'under review' || s === 'pending';
  }
  if (filter === 'active') {
    return s === 'in progress' || s === 'under review';
  }
  if (filter === 'resolved') {
    return s === 'resolved';
  }
  if (filter === 'rejected') {
    return s === 'rejected';
  }
  return s === filter.toLowerCase();
}

export const STATUS_LEGEND: Array<{
  key: string;
  label: string;
  color: string;
  shape: 'dot' | 'ring' | 'diamond' | 'check' | 'cross';
}> = [
  { key: 'pending', label: 'Pending', color: '#F59E0B', shape: 'dot' },
  { key: 'review', label: 'Under Review', color: '#3B82F6', shape: 'ring' },
  { key: 'progress', label: 'In Progress', color: '#8B5CF6', shape: 'diamond' },
  { key: 'resolved', label: 'Resolved', color: '#16A34A', shape: 'check' },
  { key: 'rejected', label: 'Rejected', color: '#DC2626', shape: 'cross' },
];
