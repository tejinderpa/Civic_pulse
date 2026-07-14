export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { searchLocation, reverseGeocode } from '@/lib/maps/geocode';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Reverse Geocoding Mode
  if (lat && lon) {
    const address = await reverseGeocode(parseFloat(lat), parseFloat(lon));
    return NextResponse.json({ address });
  }

  // Search/Autocomplete Mode
  if (query) {
    const suggestions = await searchLocation(query);
    return NextResponse.json(suggestions);
  }

  return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
}
