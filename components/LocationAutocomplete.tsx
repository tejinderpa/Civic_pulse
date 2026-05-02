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
      if (query.length >= 3) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <span className="absolute left-5 material-symbols-outlined text-emerald-400 text-xl">
          search_spark
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter locality, street, or city (e.g. NIT Jalandhar)"
          className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-md border border-emerald-500/20 text-white placeholder-emerald-100/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-sm md:text-base"
        />
        {isLoading && (
          <div className="absolute right-5 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white shadow-2xl rounded-2xl z-[2000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => {
                onSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
                setQuery(s.display_name);
                setShowDropdown(false);
              }}
              className="w-full px-5 py-4 text-left hover:bg-emerald-50 transition-colors flex items-start gap-4 border-b border-gray-50 last:border-0 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#0D2D1C]/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-sm">location_on</span>
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm leading-tight mb-1 truncate group-hover:text-[#0D2D1C]">
                  {s.display_name.split(',')[0]}
                </p>
                <p className="text-gray-500 text-[10px] truncate max-w-[280px]">
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
