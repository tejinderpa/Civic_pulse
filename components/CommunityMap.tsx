'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { StatusLegend } from '@/components/maps/StatusLegend';
import { statusMatchesFilter, getStatusVisual } from '@/lib/maps/status-icons';

const MapWrapper = dynamic(() => import('./shared/MapWrapper'), { ssr: false });
const IssueMarker = dynamic(() => import('./shared/IssueMarker'), { ssr: false });
const FitBounds = dynamic(() => import('./maps/FitBounds'), { ssr: false });

interface CommunityMapProps {
  items: Array<{
    id: string;
    status?: string | null;
    severity?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
    title?: string;
    [key: string]: unknown;
  }>;
  onItemClick?: (item: unknown) => void;
  center?: [number, number];
  onVote?: (id: string) => void;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' },
] as const;

export default function CommunityMap({
  items,
  onItemClick,
  center,
  onVote,
}: CommunityMapProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredItems = useMemo(
    () => items.filter((item) => statusMatchesFilter(item.status, filter)),
    [items, filter]
  );

  const mappableItems = useMemo(
    () =>
      filteredItems.filter((item) => {
        const lat = item.latitude ?? item.lat;
        const lng = item.longitude ?? item.lng;
        return (
          lat != null &&
          lng != null &&
          !Number.isNaN(Number(lat)) &&
          !Number.isNaN(Number(lng))
        );
      }),
    [filteredItems]
  );

  const points = useMemo(
    () =>
      mappableItems.map((item) => ({
        lat: Number(item.latitude ?? item.lat),
        lng: Number(item.longitude ?? item.lng),
      })),
    [mappableItems]
  );

  const stats = useMemo(() => {
    const pending = items.filter((i) => statusMatchesFilter(i.status, 'pending')).length;
    const active = items.filter((i) => statusMatchesFilter(i.status, 'active')).length;
    const resolved = items.filter((i) => statusMatchesFilter(i.status, 'resolved')).length;
    const rejected = items.filter((i) => statusMatchesFilter(i.status, 'rejected')).length;
    return {
      total: items.length,
      mappable: mappableItems.length,
      pending,
      active,
      resolved,
      rejected,
      critical: items.filter((i) => i.severity === 'Critical').length,
    };
  }, [items, mappableItems.length]);

  const defaultCenter = center || (points[0] ? ([points[0].lat, points[0].lng] as [number, number]) : [31.326, 75.576]);

  return (
    <div className="w-full h-full relative group rounded-[28px] overflow-hidden border border-outline-variant/20">
      <MapWrapper
        center={defaultCenter}
        zoom={points.length ? 13 : 12}
        className="h-full w-full"
        autoFly={!points.length}
      >
        {points.length > 0 && <FitBounds points={points} />}
        {mappableItems.map((item) => (
          <IssueMarker
            key={item.id}
            issue={{
              ...item,
              lat: item.latitude ?? item.lat,
              lng: item.longitude ?? item.lng,
              latitude: item.latitude ?? item.lat,
              longitude: item.longitude ?? item.lng,
            } as never}
            role="citizen"
            onVote={onVote}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </MapWrapper>

      {/* Status filters */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none max-w-[200px]">
        <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl border border-outline-variant/30 shadow-xl pointer-events-auto">
          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2 px-1">
            Filter
          </p>
          <div className="flex flex-col gap-1">
            {FILTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={`text-[11px] font-bold py-2 px-3 rounded-xl text-left transition-colors ${
                  filter === s.id
                    ? 'bg-primary text-white shadow-md'
                    : 'hover:bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-auto">
          <StatusLegend />
        </div>
      </div>

      {/* Stats strip */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#0D2D1C]/92 text-white p-4 rounded-2xl shadow-xl backdrop-blur-md min-w-[160px]">
        <p className="text-[9px] font-black uppercase text-white/50 tracking-wider mb-2">
          Map summary
        </p>
        <div className="space-y-1.5 text-[11px] font-bold">
          <div className="flex justify-between gap-4">
            <span className="opacity-70">On map</span>
            <span>
              {stats.mappable}/{stats.total}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-amber-300">
            <span>Pending</span>
            <span>{stats.pending}</span>
          </div>
          <div className="flex justify-between gap-4 text-violet-300">
            <span>In progress</span>
            <span>{stats.active}</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-300">
            <span>Resolved</span>
            <span>{stats.resolved}</span>
          </div>
        </div>
      </div>

      {mappableItems.length === 0 && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-outline-variant/30 text-center max-w-xs pointer-events-auto">
            <p className="font-bold text-primary text-sm mb-1">No mappable reports</p>
            <p className="text-xs text-on-surface-variant">
              {items.length === 0
                ? 'There are no reports yet.'
                : filter !== 'all'
                  ? 'No reports match this status filter, or they lack coordinates.'
                  : 'Reports need latitude/longitude to appear on the map.'}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-outline-variant/20 shadow-lg">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getStatusVisual('Submitted').color }}
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface">
            Status markers · live map
          </span>
        </div>
      </div>
    </div>
  );
}
