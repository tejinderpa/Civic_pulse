'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Issue } from '@/types/issue';

/**
 * Hook for reverse geocoding via our internal API
 */
export function useReverseGeocode(lat: number | null, lng: number | null) {
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;

    async function fetchAddress() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/maps/reverse?lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error('Reverse Geocode Hook Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAddress();
  }, [lat, lng]);

  return { address, isLoading };
}

/**
 * Hook for fetching nearby issues from Supabase
 * Uses a simple bounding box calculation for performance
 */
export function useNearbyIssues(lat: number | null, lng: number | null, radiusMeters: number = 300) {
  const [nearbyIssues, setNearbyIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!lat || !lng) return;

    async function fetchNearby() {
      setIsLoading(true);
      // Approximately: 1 degree latitude = 111,000 meters
      // 1 degree longitude at equator = 111,000 meters (decreases with lat)
      const latDelta = radiusMeters / 111000;
      const lngDelta = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .gte('latitude', lat - latDelta)
        .lte('latitude', lat + latDelta)
        .gte('longitude', lng - lngDelta)
        .lte('longitude', lng + lngDelta);

      if (error) {
        console.error('Nearby Issues Hook Error:', error);
      } else {
        setNearbyIssues(data as Issue[] || []);
      }
      setIsLoading(false);
    }

    fetchNearby();
  }, [lat, lng, radiusMeters, supabase]);

  return { nearbyIssues, isLoading };
}
