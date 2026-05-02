import React from 'react';
import { Button } from '../ui/Button';

export const HeroSection = () => {
  return (
    <section className="bg-[#F9FAF8] py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="font-['Plus_Jakarta_Sans'] text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1A6B45] leading-[1.1] tracking-tight">
            Report it.<br/>Track it.<br/>Fix it.
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0 font-['DM_Sans'] font-medium">
            AI-powered civic reporting that actually gets things done.
          </p>
          <div className="mt-10 gap-4 flex flex-col sm:flex-row justify-center lg:justify-start">
            <Button variant="primary" href="/report" className="text-lg px-8 py-4 shadow-lg shadow-[#1A6B45]/20">Report an Issue</Button>
            <Button variant="outline" href="/community" className="text-lg px-8 py-4 bg-white/50 backdrop-blur-sm">See Community Issues</Button>
          </div>
        </div>
        <div className="flex-1 w-full max-w-lg lg:max-w-none flex justify-center lg:justify-end">
          <div className="relative w-full aspect-square max-w-[500px]">
            {/* SVG city/map illustration with inline colored pins */}
            <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
              {/* Map Base */}
              <rect x="20" y="20" width="360" height="360" rx="32" fill="#E8F5EE" />
              <path d="M60 120 L340 120 M120 60 L120 340 M240 60 L240 340 M60 240 L340 240" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
              <path d="M120 120 L240 240 M240 120 L340 60" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
              
              {/* Buildings / Cityscape simplified */}
              <rect x="70" y="150" width="40" height="90" rx="4" fill="#BCE0CC" />
              <rect x="140" y="80" width="50" height="160" rx="4" fill="#A1D0B7" />
              <rect x="200" y="120" width="30" height="120" rx="4" fill="#8AD7A8" />
              <rect x="260" y="160" width="60" height="80" rx="4" fill="#BCE0CC" />
              
              {/* Markers */}
              {/* Orange - Road */}
              <g transform="translate(145, 220)">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#F97316"/>
                <circle cx="12" cy="12" r="4" fill="#FFF"/>
              </g>

              {/* Green - Garbage */}
              <g transform="translate(265, 80)">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#22C55E"/>
                <circle cx="12" cy="12" r="4" fill="#FFF"/>
              </g>

              {/* Blue - Water */}
              <g transform="translate(80, 100)">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#3B82F6"/>
                <circle cx="12" cy="12" r="4" fill="#FFF"/>
              </g>

              {/* Yellow - Electricity */}
              <g transform="translate(200, 260)">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#EAB308"/>
                <circle cx="12" cy="12" r="4" fill="#FFF"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
