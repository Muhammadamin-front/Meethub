"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

// Self-contained HTML pin (no external image dependency).
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

/**
 * Read-only map. Plain Leaflet (not react-leaflet) with an init guard +
 * cleanup, so a remount / Strict Mode / Fast Refresh can never leave two map
 * instances stacked in the same container.
 */
export default function LocationViewMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [lat, lng],
      15,
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Init once; the effect below keeps the view in sync if coords change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);

  return <div ref={containerRef} className="h-56 w-full rounded-xl border" />;
}
