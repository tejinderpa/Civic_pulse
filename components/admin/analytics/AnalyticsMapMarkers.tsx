'use client';

import React, { useMemo } from 'react';
import { CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { MapPoint, HotspotZone } from '@/types/analytics';

function severityColor(severity: string, isRejected?: boolean, isDuplicate?: boolean): string {
  if (isRejected) return '#DC2626';
  if (isDuplicate) return '#7C3AED';
  switch (severity) {
    case 'Critical':
      return '#EF4444';
    case 'High':
      return '#F97316';
    case 'Medium':
      return '#EAB308';
    case 'Low':
      return '#22C55E';
    default:
      return '#3B82F6';
  }
}

/** Minimal × marker — no place text */
function makeCrossIcon(color: string) {
  return L.divIcon({
    className: 'civic-status-marker analytics-cross-marker',
    html: `
      <div style="width:18px;height:18px;position:relative;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.35));">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <div style="width:14px;height:3px;background:${color};border-radius:2px;transform:rotate(45deg);position:absolute;"></div>
          <div style="width:14px;height:3px;background:${color};border-radius:2px;transform:rotate(-45deg);position:absolute;"></div>
        </div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Minimal dot — no place text */
function makeDotIcon(color: string, size = 12) {
  return L.divIcon({
    className: 'civic-status-marker analytics-dot-marker',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 0 0 1px ${color}44, 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Zone badge: count only (no place name — avoids double labelling) */
function makeHotspotIcon(count: number) {
  const size = Math.min(40, 22 + count * 3);
  return L.divIcon({
    className: 'civic-status-marker analytics-hotspot-marker',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:radial-gradient(circle at 30% 30%, #fca5a5, #dc2626 75%);
        border:2.5px solid rgba(255,255,255,0.95);
        box-shadow:0 0 0 3px rgba(220,38,38,0.2), 0 3px 10px rgba(0,0,0,0.28);
        display:flex;align-items:center;justify-content:center;
        color:#fff;font:900 ${Math.max(11, size * 0.36)}px/1 system-ui,sans-serif;
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function PointPopup({ p }: { p: MapPoint }) {
  return (
    <div className="min-w-[180px] max-w-[240px] space-y-1.5 p-0.5">
      <p className="font-bold text-sm text-slate-900 leading-snug">{p.title || 'Report'}</p>
      <p className="text-xs text-slate-500 leading-snug">{p.location}</p>
      <div className="flex flex-wrap gap-1 pt-0.5">
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100">
          {p.category}
        </span>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100">
          {p.status}
        </span>
        <span
          className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-white"
          style={{ background: severityColor(p.severity, p.isRejected, p.isDuplicate) }}
        >
          {p.severity}
        </span>
      </div>
      {p.isRejected && (
        <p className="text-[11px] font-bold text-red-600">✕ Rejected</p>
      )}
      {p.isDuplicate && (
        <p className="text-[11px] font-bold text-violet-600">Flagged as duplicate</p>
      )}
    </div>
  );
}

type Props = {
  points: MapPoint[];
  hotspots?: HotspotZone[];
  mode: 'pins' | 'heatmap';
  /** Optional place names under pins (off by default) */
  showLabels?: boolean;
  /** Concentration zone count badges (off by default — list is in sidebar) */
  showZones?: boolean;
};

export default function AnalyticsMapMarkers({
  points,
  hotspots = [],
  mode,
  showLabels = false,
  showZones = false,
}: Props) {
  const icons = useMemo(() => {
    return points.map((p) => {
      const color = severityColor(p.severity, p.isRejected, p.isDuplicate);
      const rejected = p.isRejected || p.status === 'Rejected';
      return {
        id: p.id,
        icon: rejected
          ? makeCrossIcon(color)
          : makeDotIcon(color, p.severity === 'Critical' ? 14 : 11),
        point: p,
      };
    });
  }, [points]);

  return (
    <>
      {/* Heatmap mode: small dots only — details on click */}
      {mode === 'heatmap' &&
        points.map((p) => (
          <CircleMarker
            key={`hm-${p.id}`}
            center={[p.lat, p.lng]}
            radius={p.severity === 'Critical' ? 6 : 4.5}
            pathOptions={{
              color: '#fff',
              weight: 1.5,
              fillColor: severityColor(p.severity, p.isRejected, p.isDuplicate),
              fillOpacity: 0.92,
            }}
          >
            {showLabels && (
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <span className="text-[10px] font-bold">{p.shortLabel}</span>
              </Tooltip>
            )}
            <Popup>
              <PointPopup p={p} />
            </Popup>
          </CircleMarker>
        ))}

      {/* Pins mode: clean dots / crosses */}
      {mode === 'pins' &&
        icons.map(({ id, icon, point: p }) => (
          <Marker key={`pin-${id}`} position={[p.lat, p.lng]} icon={icon}>
            {showLabels && (
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent>
                <span className="text-[10px] font-bold">{p.shortLabel}</span>
              </Tooltip>
            )}
            <Popup>
              <PointPopup p={p} />
            </Popup>
          </Marker>
        ))}

      {/* Optional zone counts only (no place names) */}
      {showZones &&
        hotspots
          .filter((h) => h.count >= 1)
          .slice(0, 6)
          .map((h) => (
            <Marker
              key={`hs-${h.id}`}
              position={[h.lat, h.lng]}
              icon={makeHotspotIcon(h.openCount || h.count)}
              zIndexOffset={400}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1.5">
                  <p className="font-black text-sm">{h.label}</p>
                  <p className="text-xs text-slate-600">
                    {h.count} reports · {h.openCount} open
                    {h.criticalCount > 0 ? ` · ${h.criticalCount} high/crit` : ''}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-700 leading-snug">
                    {h.recommendation}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
    </>
  );
}
