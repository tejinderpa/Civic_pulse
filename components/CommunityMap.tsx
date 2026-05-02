'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const MapWrapper = dynamic(() => import('./shared/MapWrapper'), { ssr: false });
const IssueMarker = dynamic(() => import('./shared/IssueMarker'), { ssr: false });

interface CommunityMapProps {
  items: any[];
  onItemClick?: (item: any) => void;
  center?: [number, number];
  onVote?: (id: string) => void;
}

export default function CommunityMap({ items, onItemClick, center, onVote }: CommunityMapProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => (item.status || '').toLowerCase() === filter.toLowerCase());

  // Analysis Data
  const stats = {
    total: filteredItems.length,
    critical: filteredItems.filter(i => i.severity === 'Critical').length,
    pending: filteredItems.filter(i => (i.status || '').toLowerCase() === 'pending').length
  };

  const markers = filteredItems.map(item => ({
    id: item.id,
    lat: item.latitude || (center ? center[0] : 20.5937) + (Math.random() - 0.5) * 0.02,
    lng: item.longitude || (center ? center[1] : 78.9629) + (Math.random() - 0.5) * 0.02,
    title: item.title || item.description,
    severity: item.severity,
    status: item.status
  }));

  return (
    <div className="w-full h-full relative group">
      <MapWrapper 
        center={center || [20.5937, 78.9629]}
        zoom={center ? 14 : 5}
        className="h-full w-full"
      >
        {filteredItems.map((item) => (
          <IssueMarker 
            key={item.id} 
            issue={item} 
            role="citizen" 
            onVote={onVote}
          />
        ))}
      </MapWrapper>

      {/* Analysis & Filter Overlay */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
         <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[32px] border border-white/50 shadow-2xl w-48 pointer-events-auto">
            <p className="text-[9px] font-black uppercase text-[var(--on-surface-variant)] tracking-wider mb-3 opacity-40">Filter Status</p>
            <div className="flex flex-col gap-1.5">
               {['all', 'pending', 'resolved'].map((s) => (
                 <button 
                   key={s}
                   onClick={() => setFilter(s)}
                   className={`text-[10px] font-bold py-2.5 px-4 rounded-xl text-left capitalize transition-all ${filter === s ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]'}`}
                 >
                   {s}
                 </button>
               ))}
            </div>
         </div>

         <div className="bg-[#0D2D1C] text-white p-5 rounded-[32px] shadow-2xl w-48 pointer-events-auto">
            <p className="text-[9px] font-black uppercase text-white/50 tracking-wider mb-2">Area Analysis</p>
            <div className="space-y-1">
               <div className="flex justify-between items-end">
                  <span className="text-[20px] font-black">{stats.total}</span>
                  <span className="text-[9px] font-bold opacity-60 pb-1">Total Signals</span>
               </div>
               <div className="flex justify-between items-center text-orange-400">
                  <span className="text-[10px] font-bold">⚠️ Critical</span>
                  <span className="text-[10px] font-black">{stats.critical}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 shadow-xl pointer-events-none">
         <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--on-surface)]">Live Intelligence Feed</span>
         </div>
      </div>
    </div>
  );
}
