'use client';

import { useState } from 'react';
import LocationAutocomplete from './LocationAutocomplete';

interface SearchHeroProps {
  onLocationSelect: (lat: number, lon: number, address: string) => void;
}

export default function SearchHero({ onLocationSelect }: SearchHeroProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/search?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          onLocationSelect(latitude, longitude, data.address || "Your Current Location");
        } catch (error) {
          onLocationSelect(latitude, longitude, "Your Current Location");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        alert("Could not determine your location. Please search manually.");
      }
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto mb-12">
      <div className="bg-[#0D2D1C] text-white p-8 md:p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Map Your Community, <br/> 
            <span className="text-emerald-400">Improve Your Future.</span>
          </h1>
          <p className="text-emerald-100/60 text-sm md:text-lg mb-10 max-w-xl mx-auto font-medium">
            Discover issues in Jalandhar and beyond. Real-time geospatial analytics for a smarter, cleaner neighborhood.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-stretch max-w-2xl mx-auto">
            <div className="flex-grow">
              <LocationAutocomplete onSelect={onLocationSelect} />
            </div>
            
            <button 
              onClick={handleNearMe}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-70"
            >
              <span className={`material-symbols-outlined ${isLocating ? 'animate-spin' : ''}`}>
                {isLocating ? 'progress_activity' : 'my_location'}
              </span>
              <span className="uppercase text-[11px] tracking-wider whitespace-nowrap">
                {isLocating ? 'Locating...' : 'Near Me'}
              </span>
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 opacity-40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Hot Spots</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Service Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Resolution Speed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
