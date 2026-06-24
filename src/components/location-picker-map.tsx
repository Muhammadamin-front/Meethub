"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Default Leaflet markers load images by URL that bundlers rewrite/break, so we
// use a self-contained HTML pin instead (no external image dependency).
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-100%)">
    <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0Z" fill="#7c3aed"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [30, 42],
  iconAnchor: [0, 0],
});

// Default view: Tashkent.
const FALLBACK: [number, number] = [41.3111, 69.2797];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ view }: { view: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (view) map.flyTo([view.lat, view.lng], Math.max(map.getZoom(), 14));
  }, [view, map]);
  return null;
}

export default function LocationPickerMap({
  marker,
  view,
  onPick,
}: {
  marker: { lat: number; lng: number } | null;
  view: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const center = marker ?? (view ? { lat: view.lat, lng: view.lng } : null);

  return (
    <MapContainer
      center={center ? [center.lat, center.lng] : FALLBACK}
      zoom={center ? 14 : 11}
      scrollWheelZoom
      className="h-64 w-full rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter view={view} />
      {marker && <Marker position={[marker.lat, marker.lng]} icon={pinIcon} />}
    </MapContainer>
  );
}
