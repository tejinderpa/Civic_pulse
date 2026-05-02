'use client';

import React, { useState } from 'react';
import { useMap } from 'react-leaflet';

export default function MapSearchControl() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        map.flyTo([parseFloat(lat), parseFloat(lon)], 14, {
          duration: 2,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute top-6 right-6 z-[1001] pointer-events-auto">
      <form 
        onSubmit={handleSearch}
        className="flex items-center bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-1.5 w-64 md:w-80 group transition-all focus-within:w-80 md:focus-within:w-96"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location (City, Street...)"
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-[#0D2D1C] placeholder:text-slate-400 pl-3"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="w-10 h-10 rounded-xl signature-gradient text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[20px]">search</span>
          )}
        </button>
      </form>
    </div>
  );
}
