'use client';

import { useState, useEffect, useRef } from 'react';
import { LocationSuggestion } from '@/lib/maps/location-type';

interface LocationAutocompleteProps {
  onSelect: (lat: number, lon: number, address: string) => void;
}

export default function LocationAutocomplete({ onSelect }: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        setNoResults(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setNoResults(false);

      try {
        // Prefer dedicated maps search; fall back to /api/search
        let data: LocationSuggestion[] = [];
        const res = await fetch(`/api/maps/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          data = Array.isArray(json) ? json : [];
        }

        if (data.length === 0) {
          const res2 = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          if (res2.ok) {
            const json2 = await res2.json();
            data = Array.isArray(json2) ? json2 : [];
          }
        }

        setSuggestions(data);
        setShowDropdown(true);
        setNoResults(data.length === 0);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search unavailable. Try again in a moment.');
        setSuggestions([]);
        setShowDropdown(true);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (s: LocationSuggestion) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError('Invalid coordinates for this place.');
      return;
    }
    onSelect(lat, lon, s.display_name);
    setQuery(s.display_name.split(',').slice(0, 3).join(','));
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <div className="relative flex items-center">
        <span className="absolute left-4 material-symbols-outlined text-emerald-400 text-xl pointer-events-none">
          search
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || noResults || error) setShowDropdown(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions[0]) {
              e.preventDefault();
              handleSelect(suggestions[0]);
            }
          }}
          placeholder="Enter locality, street, or city (e.g. NIT Jalandhar)"
          className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-emerald-400/25 text-white placeholder-emerald-100/35 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/40 transition-all font-medium text-sm md:text-base"
          autoComplete="off"
          aria-label="Search locality"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {isLoading && (
          <div className="absolute right-4 flex items-center">
            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && (suggestions.length > 0 || noResults || error) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/[0.06] shadow-2xl rounded-2xl z-[3000] overflow-hidden max-h-72 overflow-y-auto">
          {error && (
            <p className="px-5 py-4 text-sm text-red-600 font-medium">{error}</p>
          )}
          {!error && noResults && (
            <p className="px-5 py-4 text-sm text-slate-500 font-medium">
              No places found. Try a broader name (city or area).
            </p>
          )}
          {suggestions.map((s) => (
            <button
              key={String(s.place_id) + s.lat + s.lon}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-3.5 text-left hover:bg-emerald-50 transition-colors flex items-start gap-3 border-b border-slate-100 last:border-0 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white text-primary transition-all">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
              </div>
              <div className="min-w-0">
                <p className="text-slate-900 font-bold text-sm leading-tight truncate">
                  {s.display_name.split(',')[0]}
                </p>
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                  {s.display_name.split(',').slice(1).join(',').trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
