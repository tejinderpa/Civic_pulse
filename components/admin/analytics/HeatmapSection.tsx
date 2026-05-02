'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MapWrapper from '@/components/shared/MapWrapper';
import { MapPoint } from '@/types/analytics';
import HeatmapLayer from '@/components/shared/HeatmapLayer';
import MarkerClusterGroup from 'react-leaflet-cluster';
import IssueMarker from '@/components/shared/IssueMarker';

interface Props {
  points: MapPoint[];
}

export default function HeatmapSection({ points }: Props) {
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap'>('heatmap');
  
  // CartoDB Dark Matter
  const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="bg-white rounded-[40px] p-8 border border-[var(--outline-variant)] shadow-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight font-[var(--font-plus-jakarta)] mb-1">Issue Hotspot Intelligence</h2>
          <p className="text-sm font-medium text-slate-400">Weighted visualization based on severity, recency, and community impact.</p>
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setViewMode('pins')}
            className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'pins' ? 'bg-white shadow-xl text-primary' : 'text-slate-400'}`}
          >
            Pins View
          </button>
          <button 
            onClick={() => setViewMode('heatmap')}
            className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'heatmap' ? 'bg-white shadow-xl text-primary' : 'text-slate-400'}`}
          >
            Heatmap View
          </button>
        </div>
      </div>

      <div className="h-[520px] rounded-[32px] overflow-hidden border border-slate-200 shadow-inner translate-z-0">
        <MapWrapper 
          center={[20.5937, 78.9629]} 
          zoom={5} 
          className="h-full w-full"
          tileUrl={viewMode === 'heatmap' ? DARK_TILES : undefined}
        >
          {viewMode === 'heatmap' ? (
            <HeatmapLayer 
              // Convert MapPoint to Heatmap format [lat, lng, weight]
              issues={points.map(p => ({
                latitude: p.lat,
                longitude: p.lng,
                weight: p.weight
              }))} 
            />
          ) : (
            <MarkerClusterGroup>
              {points.map(p => (
                <IssueMarker 
                  key={p.id} 
                  issue={{
                    id: p.id,
                    latitude: p.lat,
                    longitude: p.lng,
                    severity: p.severity as any,
                    title: p.title,
                    category: p.category,
                    status: p.status,
                    upvotes: p.votes
                  } as any} 
                  role="admin"
                />
              ))}
            </MarkerClusterGroup>
          )}
        </MapWrapper>
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 items-center">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Heat</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">High Density</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Normal Volume</span>
         </div>
      </div>
    </div>
  );
}
