'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers based on severity
const getIcon = (severity?: string) => {
  const color = 
    severity === 'Critical' ? '#ba1a1a' :
    severity === 'High' ? '#f4a623' :
    severity === 'Medium' ? '#ffd43b' :
    severity === 'Low' ? '#1a6b45' : 
    '#005131';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id?: string;
    lat: number;
    lng: number;
    title?: string;
    severity?: string;
    status?: string;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

// Component to update center when props change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
    });
  }, [center, zoom, map]);
  return null;
}

// Component to handle map clicks
function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const MapComponent: React.FC<MapProps> = ({
  center = [20.5937, 78.9629], // Default to center of India or any relevant default
  zoom = 13,
  markers = [],
  onMapClick,
  className = "h-full w-full",
}) => {
  return (
    <div className={`relative ${className} overflow-hidden rounded-[24px] border border-[var(--outline-variant)] shadow-inner group`}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={center} zoom={zoom} />
        <MapEvents onMapClick={onMapClick} />
        
        {markers.map((marker, idx) => (
          <Marker 
            key={marker.id || idx} 
            position={[marker.lat, marker.lng]}
            icon={getIcon(marker.severity)}
          >
            {marker.title && (
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm mb-1">{marker.title}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-60">{marker.severity} Priority</p>
                  {marker.status && (
                    <div className="mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-center">
                      {marker.status}
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Glassmorphic Overlay for Map Interactions */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button 
          title="Use my location"
          onClick={() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (onMapClick) onMapClick(pos.coords.latitude, pos.coords.longitude);
              },
              (err) => console.error(err)
            );
          }}
          className="w-10 h-10 rounded-xl bg-white shadow-lg border border-[var(--outline-variant)] flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">my_location</span>
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
