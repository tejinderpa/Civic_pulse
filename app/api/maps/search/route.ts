import { NextResponse } from 'next/server';
import { searchLocation } from '@/lib/maps/geocode';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const data = await searchLocation(q.trim());
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch location suggestions' }, { status: 500 });
  }
}
