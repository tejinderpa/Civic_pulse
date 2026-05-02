'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapWrapperProps {
  center: [number, number];
  zoom: number;
  children?: React.ReactNode;
  className?: string;
  scrollWheelZoom?: boolean;
  tileUrl?: string;
}

// Helper to update map view when center/zoom props change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      animate: true
    });
  }, [center, zoom, map]);
  return null;
}

export default function MapWrapper({
  center,
  zoom,
  children,
  className = "h-[500px] w-full",
  scrollWheelZoom = true,
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
}: MapWrapperProps) {
  return (
    <div className={`relative ${className} overflow-hidden rounded-[32px] border border-[var(--outline-variant)] shadow-inner group z-0`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={scrollWheelZoom}
        zoomControl={false} // We can add custom zoom controls later for premium feel
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        <ChangeView center={center} zoom={zoom} />
        {children}
      </MapContainer>
    </div>
  );
}
