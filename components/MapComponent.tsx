'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';

// Fix for Leaflet default icon issues in Next.js
const initLeaflet = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

interface MapComponentProps {
  items: any[];
  onItemClick?: (item: any) => void;
  center?: [number, number];
  zoom?: number;
}

// Sub-component to handle map centering/zooming
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ 
  items, 
  onItemClick, 
  center = [31.3260, 75.5760], // Default: Jalandhar
  zoom = 13 
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    initLeaflet();
    setIsMounted(true);
  }, []);

  // Status-based markers (pending dots, resolved checks, etc.)
  const customIcon = (status?: string, severity?: string) => {
    // Lazy import shape logic inline to keep this component standalone
    const s = (status || 'Submitted').toLowerCase();
    let color = '#F59E0B';
    let html = '';
    if (s.includes('resolv') || s === 'closed' || s === 'done') {
      color = '#16A34A';
      html = `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:900">✓</div>`;
    } else if (s.includes('reject') || s.includes('denied')) {
      color = '#DC2626';
      html = `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:900">✕</div>`;
    } else if (s.includes('progress')) {
      color = '#8B5CF6';
      html = `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;transform:rotate(45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`;
    } else if (s.includes('review')) {
      color = '#3B82F6';
      html = `<div style="width:16px;height:16px;border-radius:50%;background:white;border:3.5px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`;
    } else {
      // Pending / submitted — solid dot
      color = severity === 'Critical' ? '#EF4444' : '#F59E0B';
      html = `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`;
    }

    return L.divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px">${html}</div>`,
      className: 'civic-status-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  if (!isMounted) return (
    <div className="w-full h-full bg-[#F3F4F6] animate-pulse rounded-[32px] flex items-center justify-center">
      <p className="text-gray-400 font-medium">Initializing Live Systems...</p>
    </div>
  );

  return (
    <div className="w-full h-full rounded-[40px] overflow-hidden border border-[#D1FAE5]/30 shadow-2xl relative bg-white">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#F8FAFC' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {items.map((item) => {
          const lat = item.latitude || item.lat;
          const lon = item.longitude || item.lon || item.lng;

          if (!lat || !lon) return null;

          return (
            <Marker 
              key={item.id} 
              position={[lat, lon]} 
              icon={customIcon(item.status, item.severity)}
            >
              <Popup className="custom-popup">
                <div className="w-64 p-0">
                  <div className="relative h-28 bg-emerald-50 overflow-hidden rounded-t-xl">
                    {(item.image_url || item.imageUrl) ? (
                      <Image 
                        src={item.image_url || item.imageUrl} 
                        alt="preview" 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-emerald-200">
                        <span className="material-symbols-outlined text-4xl mb-1">map</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image Proof</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-b-xl border-t border-gray-100">
                    <h4 className="font-bold text-[#0D2D1C] text-sm leading-tight mb-1 truncate">
                      {item.title || item.description}
                    </h4>
                    <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      <p className="text-[10px] font-medium truncate">{item.location}</p>
                    </div>
                    
                    <button 
                      onClick={() => onItemClick?.(item)}
                      className="w-full py-2.5 bg-[#0D2D1C] hover:bg-[#1A4D31] text-white text-[11px] font-bold rounded-xl transition-all shadow-lg active:scale-95"
                    >
                      Analyze Report
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Controls Placeholder */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl border border-white/40 shadow-xl">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-sm">sensors</span>
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-800 leading-none">Status: Live</p>
                <p className="text-[8px] text-gray-500 font-bold tracking-tighter uppercase mt-0.5">Geo-Spatial Analysis</p>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 20px !important; overflow: hidden; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important; }
        .leaflet-popup-content { margin: 0 !important; width: 256px !important; }
        .leaflet-container { font-family: var(--font-plus-jakarta), sans-serif !important; border-radius: 40px; }
        .custom-popup .leaflet-popup-tip { background: white; }
      `}} />
    </div>
  );
}
