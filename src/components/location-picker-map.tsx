"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

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

type Coords = { lat: number; lng: number } | null;

/**
 * Interactive picker map. Plain Leaflet (not react-leaflet) with an init guard
 * + cleanup so a remount / Strict Mode / Fast Refresh never leaves two maps
 * stacked. Click to drop a pin; `marker`/`view` drive the marker and recenter.
 */
export default function LocationPickerMap({
  marker,
  view,
  onPick,
}: {
  marker: Coords;
  view: Coords;
  onPick: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Keep the latest onPick without re-initializing the map.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Initialize once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start = marker ?? view;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
      start ? [start.lat, start.lng] : FALLBACK,
      start ? 14 : 11,
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });
    if (marker) {
      markerRef.current = L.marker([marker.lat, marker.lng], {
        icon: pinIcon,
      }).addTo(map);
    }
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync the marker when it changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (marker) {
      if (markerRef.current) markerRef.current.setLatLng([marker.lat, marker.lng]);
      else
        markerRef.current = L.marker([marker.lat, marker.lng], {
          icon: pinIcon,
        }).addTo(map);
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [marker?.lat, marker?.lng]);

  // Recenter when a search/geolocation sets a new view.
  useEffect(() => {
    const map = mapRef.current;
    if (map && view) map.flyTo([view.lat, view.lng], Math.max(map.getZoom(), 14));
  }, [view?.lat, view?.lng]);

  return <div ref={containerRef} className="h-64 w-full rounded-lg border" />;
}
