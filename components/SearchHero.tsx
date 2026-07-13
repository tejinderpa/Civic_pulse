'use client';

import { useState } from 'react';
import LocationAutocomplete from './LocationAutocomplete';

interface SearchHeroProps {
  onLocationSelect: (lat: number, lon: number, address: string) => void;
}

export default function SearchHero({ onLocationSelect }: SearchHeroProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info');

  const handleNearMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatusTone('error');
      setStatusMsg('Geolocation is not supported in this browser. Type a place name instead.');
      return;
    }

    setIsLocating(true);
    setStatusTone('info');
    setStatusMsg('Requesting your location… allow access if prompted.');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = 'Your current location';

        try {
          // Primary reverse geocode
          const res = await fetch(
            `/api/search?lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.address) address = data.address;
          } else {
            // Fallback maps reverse
            const res2 = await fetch(
              `/api/maps/reverse?lat=${latitude}&lon=${longitude}`
            );
            if (res2.ok) {
              const data2 = await res2.json();
              address = data2.display_name || data2.name || address;
            }
          }
        } catch {
          /* keep default address */
        }

        setIsLocating(false);
        setStatusMsg(null);
        onLocationSelect(latitude, longitude, address);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        setStatusTone('error');
        const messages: Record<number, string> = {
          1: 'Location permission denied. Enable it in browser settings, or search by name.',
          2: 'Location unavailable. Check GPS/network, or search by name.',
          3: 'Location request timed out. Try again or search by name.',
        };
        setStatusMsg(
          messages[error.code] || 'Could not determine your location. Search by name instead.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60_000,
      }
    );
  };

  return (
    <section className="relative w-full max-w-4xl mx-auto">
      <div className="bg-[#0b1f17] text-white p-8 md:p-12 rounded-[28px] md:rounded-[32px] shadow-2xl shadow-emerald-950/25 relative overflow-visible ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90 mb-3">
            Find issues near you
          </p>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold mb-3 tracking-tight leading-tight">
            Map your community,
            <br />
            <span className="text-emerald-400">improve your future.</span>
          </h2>
          <p className="text-emerald-100/65 text-sm md:text-base mb-8 max-w-xl mx-auto font-medium leading-relaxed">
            Search a locality or use Near Me to open the live community map around you —
            Jalandhar and cities across India.
          </p>

          <div className="flex flex-col md:flex-row gap-3 items-stretch max-w-2xl mx-auto">
            <div className="flex-grow min-w-0 relative z-20">
              <LocationAutocomplete onSelect={onLocationSelect} />
            </div>

            <button
              type="button"
              onClick={handleNearMe}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-[#0b1f17] font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-900/30 active:scale-[0.98] disabled:opacity-70 shrink-0"
            >
              <span
                className={`material-symbols-outlined text-[22px] ${isLocating ? 'animate-spin' : ''}`}
              >
                {isLocating ? 'progress_activity' : 'my_location'}
              </span>
              <span className="uppercase text-[11px] tracking-wider whitespace-nowrap">
                {isLocating ? 'Locating…' : 'Near Me'}
              </span>
            </button>
          </div>

          {statusMsg && (
            <p
              className={`mt-4 text-sm font-medium ${
                statusTone === 'error' ? 'text-amber-200' : 'text-emerald-200/90'
              }`}
            >
              {statusMsg}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-5 text-emerald-100/50">
            {[
              { color: 'bg-red-400', label: 'Hot spots' },
              { color: 'bg-blue-400', label: 'Coverage' },
              { color: 'bg-emerald-400', label: 'Resolution' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
