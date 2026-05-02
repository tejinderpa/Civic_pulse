'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Issue } from '@/types/issue';

interface HeatmapPoint {
  lat: number | null;
  lng: number | null;
  weight?: number;
  severity?: string;
  created_at?: string;
  votes_count?: number | null;
}

interface HeatmapLayerProps {
  issues: HeatmapPoint[];
}

const getSeverityScore = (severity: string) => {
  switch (severity) {
    case 'Critical': return 4;
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': return 1;
    default: return 1;
  }
};

const getRecencyDecay = (createdAt: string) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 30 ? 0.5 : 1.0;
};

export default function HeatmapLayer({ issues }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || issues.length === 0) return;

    const points = issues
      .filter(i => i.lat && i.lng)
      .map(i => {
        const weight = i.weight ?? (getSeverityScore(i.severity || 'Medium') * ((i.votes_count || 0) + 1) * getRecencyDecay(i.created_at || new Date().toISOString()));
        return [i.lat, i.lng, weight] as [number, number, number];
      });

    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: '#3b82f6', // low - blue
        0.6: '#fbbf24', // med - yellow
        0.8: '#f97316', // high - orange
        1.0: '#ef4444'  // critical - red
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, issues]);

  return null;
}
