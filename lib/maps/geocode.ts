import { LocationSuggestion, GeocodeResult } from './location-type';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Searches for location suggestions based on a query string.
 */
export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          'User-Agent': 'CivicPulse-App (contact: civicpulse@example.com)', // Recommended by Nominatim Usage Policy
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch from Nominatim');

    return await response.json();
  } catch (error) {
    console.error('Geocoding search error:', error);
    return [];
  }
}

/**
 * Converts coordinates into a human-readable address.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CivicPulse-App (contact: civicpulse@example.com)',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch from Nominatim');

    const data = await response.json();
    return data.display_name || 'Unknown Location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Unknown Location';
  }
}
