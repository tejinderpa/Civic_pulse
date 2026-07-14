import { LocationSuggestion } from './location-type';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/** Soft focus around Jalandhar / Punjab (lon_min, lat_min, lon_max, lat_max) */
const INDIA_VIEWBOX = '68.0,6.5,97.5,35.5';

const DEFAULT_HEADERS = {
  'User-Agent': 'CivicPulse-App/1.0 (civicpulse.local)',
  Accept: 'application/json',
};

/**
 * Searches for location suggestions. Biased to India, unbounded so other
 * cities still work.
 */
export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'in',
      viewbox: INDIA_VIEWBOX,
      bounded: '0',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: DEFAULT_HEADERS,
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`Nominatim search failed: ${response.status}`);

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Geocoding search error:', error);
    // Fallback without country bias
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        addressdetails: '1',
        limit: '6',
      });
      const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: DEFAULT_HEADERS,
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
}

/**
 * Converts coordinates into a human-readable address.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: DEFAULT_HEADERS,
    });

    if (!response.ok) throw new Error(`Nominatim reverse failed: ${response.status}`);

    const data = await response.json();
    return data.display_name || data.name || 'Your current location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Your current location';
  }
}
