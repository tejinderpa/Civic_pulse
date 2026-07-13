'use client';

import React, { useMemo, useState } from 'react';
import MapWrapper from '@/components/shared/MapWrapper';
import FitBounds from '@/components/maps/FitBounds';
import { MapPoint, HotspotZone } from '@/types/analytics';
import HeatmapLayer from '@/components/shared/HeatmapLayer';
import AnalyticsMapMarkers from '@/components/admin/analytics/AnalyticsMapMarkers';

interface Props {
  points: MapPoint[];
  hotspots?: HotspotZone[];
  mapCenter?: [number, number];
  mapZoom?: number;
}

export default function HeatmapSection({
  points,
  hotspots = [],
  mapCenter = [30.7, 75.5],
  mapZoom = 6,
}: Props) {
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap'>('pins');
  const [showLabels, setShowLabels] = useState(false);
  const [showZones, setShowZones] = useState(false);

  const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const fitPoints = useMemo(
    () => points.map((p) => ({ lat: p.lat, lng: p.lng })),
    [points]
  );

  const openCount = points.filter(
    (p) => p.status !== 'Resolved' && p.status !== 'Rejected'
  ).length;

  return (
    <div className="bg-white rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border border-[var(--outline-variant)] shadow-sm relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[22px]">map</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-[var(--font-plus-jakarta)]">
              Geographic intelligence
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500 max-w-xl">
            Dots and crosses mark report locations. Click a point for title, place, and status.
            Use the side list for where to deploy task forces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('pins')}
              className={`px-3.5 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all inline-flex items-center gap-1.5 ${
                viewMode === 'pins' ? 'bg-white shadow text-primary' : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              Pins
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`px-3.5 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all inline-flex items-center gap-1.5 ${
                viewMode === 'heatmap' ? 'bg-white shadow text-primary' : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">blur_on</span>
              Heatmap
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            className={`h-9 px-3 rounded-xl text-[11px] font-bold border transition-all inline-flex items-center gap-1.5 ${
              showLabels
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle place names on the map"
          >
            <span className="material-symbols-outlined text-[16px]">label</span>
            Labels
          </button>

          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className={`h-9 px-3 rounded-xl text-[11px] font-bold border transition-all inline-flex items-center gap-1.5 ${
              showZones
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Show zone count badges on the map"
          >
            <span className="material-symbols-outlined text-[16px]">bubble_chart</span>
            Zones
          </button>

          <div className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            {points.length} mapped · {openCount} open
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 h-[420px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-200 relative">
          {points.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">map</span>
              <p className="text-sm font-semibold">No geocoded reports in this range</p>
            </div>
          ) : (
            <MapWrapper
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full !rounded-2xl !border-0"
              tileUrl={viewMode === 'heatmap' ? DARK_TILES : LIGHT_TILES}
              autoFly={false}
            >
              <FitBounds points={fitPoints} />
              {viewMode === 'heatmap' && (
                <HeatmapLayer
                  issues={points.map((p) => ({
                    lat: p.lat,
                    lng: p.lng,
                    latitude: p.lat,
                    longitude: p.lng,
                    weight: p.weight,
                    severity: p.severity,
                  }))}
                />
              )}
              <AnalyticsMapMarkers
                points={points}
                hotspots={hotspots}
                mode={viewMode}
                showLabels={showLabels}
                showZones={showZones}
              />
            </MapWrapper>
          )}

          <p className="absolute bottom-3 left-3 z-[500] rounded-lg bg-white/90 backdrop-blur px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 border border-slate-100 shadow-sm pointer-events-none">
            Click a point for location details
          </p>
        </div>

        <div className="xl:col-span-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Deploy task forces here
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{hotspots.length} zones</span>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
            {hotspots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 font-medium">
                No concentration zones yet. As reports cluster by location, deployment tips appear
                here.
              </div>
            ) : (
              hotspots.map((h, i) => (
                <div
                  key={h.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 hover:border-primary/20 hover:bg-white transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                        h.openCount >= 2
                          ? 'bg-red-100 text-red-700'
                          : h.openCount === 1
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{h.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {h.count} total · {h.openCount} open
                        {h.criticalCount > 0 ? ` · ${h.criticalCount} high/crit` : ''}
                      </p>
                      {h.categories.length > 0 && (
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">
                          {h.categories.join(' · ')}
                        </p>
                      )}
                      <p className="text-[11px] font-semibold text-emerald-800 mt-2 leading-snug">
                        {h.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 items-center pt-4 border-t border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">
          Legend
        </span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-white shadow" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Critical / High
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-400 ring-2 ring-white shadow" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Medium
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Low
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative h-3 w-3">
            <span className="absolute inset-x-0 top-1/2 h-0.5 bg-red-600 rotate-45" />
            <span className="absolute inset-x-0 top-1/2 h-0.5 bg-red-600 -rotate-45" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Rejected (×)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium ml-auto">
          Labels & zones are optional — off by default
        </span>
      </div>
    </div>
  );
}
