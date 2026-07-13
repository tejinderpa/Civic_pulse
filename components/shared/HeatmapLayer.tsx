'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapPoint {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  weight?: number;
  severity?: string;
  created_at?: string;
  votes_count?: number | null;
  upvotes?: number | null;
}

interface HeatmapLayerProps {
  issues: HeatmapPoint[];
}

const getSeverityScore = (severity: string) => {
  switch (severity) {
    case 'Critical':
      return 4;
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    case 'Low':
      return 1;
    default:
      return 1;
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
      .map((i) => {
        const lat = i.latitude ?? i.lat;
        const lng = i.longitude ?? i.lng;
        if (lat == null || lng == null) return null;
        const votes = i.upvotes ?? i.votes_count ?? 0;
        const weight =
          i.weight ??
          getSeverityScore(i.severity || 'Medium') *
            (votes + 1) *
            getRecencyDecay(i.created_at || new Date().toISOString());
        return [Number(lat), Number(lng), weight] as [number, number, number];
      })
      .filter(Boolean) as [number, number, number][];

    if (points.length === 0) return;

    // @ts-expect-error leaflet.heat has no types
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: '#3b82f6',
        0.6: '#fbbf24',
        0.8: '#f97316',
        1.0: '#ef4444',
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, issues]);

  return null;
}
