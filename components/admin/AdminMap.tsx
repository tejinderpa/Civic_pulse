'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { Issue } from '@/types/issue';
import { MOCK_ISSUES } from '@/lib/mock-data';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import MapWrapper from '@/components/shared/MapWrapper';
import IssueMarker from '@/components/shared/IssueMarker';
import HeatmapLayer from '@/components/shared/HeatmapLayer';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MapSearchControl from '@/components/shared/MapSearchControl';

const supabase = createClient();

interface AdminMapProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function AdminMap({ isExpanded, onToggleExpand }: AdminMapProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap'>('pins');

  const fetchIssues = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .neq('status', 'Resolved')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Map DB fetch empty or errored. Using mock data.');
      setIssues(MOCK_ISSUES.filter(i => i.status !== 'Resolved') as unknown as Issue[]);
    } else {
      setIssues(data as Issue[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchIssues();

    // Real-time subscription
    const channel = supabase
      .channel(`admin-map-updates-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchIssues]);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id);
    
    if (error) console.error('Update status error:', error);
  };

  const handleDepartmentChange = async (id: string, department: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ department })
      .eq('id', id);
    
    if (error) console.error('Update department error:', error);
  };

  return (
    <div className={`w-full h-full relative group ${isExpanded ? 'rounded-none' : ''}`}>
      <MapWrapper 
        center={[20.5937, 78.9629]} 
        zoom={isExpanded ? 6 : 5} 
        className="h-full w-full"
      >
        {isExpanded && <MapSearchControl />}
        
        {viewMode === 'pins' ? (
          <MarkerClusterGroup>
            {issues.map(issue => (
              <IssueMarker 
                key={issue.id} 
                issue={issue} 
                role="admin"
                onStatusChange={handleStatusChange}
                onDepartmentChange={handleDepartmentChange}
              />
            ))}
          </MarkerClusterGroup>
        ) : (
          <HeatmapLayer issues={issues} />
        )}
      </MapWrapper>

      {/* Admin Map Controls Overlay */}
      <div className={`absolute ${isExpanded ? 'top-10 left-10' : 'top-6 left-6'} z-[1000] flex flex-col gap-3 pointer-events-none`}>
         <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[32px] border border-white/50 shadow-2xl w-48 pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                 <p className="text-[10px] font-black uppercase text-[var(--on-surface)] tracking-widest">Live</p>
               </div>
               <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
                    <button 
                      onClick={() => setViewMode('pins')}
                      className={`p-1 rounded-md transition-all ${viewMode === 'pins' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                    </button>
                    <button 
                      onClick={() => setViewMode('heatmap')}
                      className={`p-1 rounded-md transition-all ${viewMode === 'heatmap' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">blur_on</span>
                    </button>
                  </div>
                  {onToggleExpand && (
                    <button 
                      onClick={onToggleExpand}
                      className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isExpanded ? 'close_fullscreen' : 'open_in_full'}
                      </span>
                    </button>
                  )}
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold opacity-60">Active Signal</span>
                  <span className="text-xs font-black">{issues.length}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold opacity-60">SLA Risks</span>
                  <span className="text-xs font-black text-red-500">
                    {issues.filter(i => i.severity === 'Critical').length}
                  </span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
