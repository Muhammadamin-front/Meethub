"use client";

import dynamic from "next/dynamic";

// Leaflet needs `window`, so the map is client-only.
const LocationViewMap = dynamic(() => import("./location-view-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/40 h-56 w-full animate-pulse rounded-xl border" />
  ),
});

export function LocationView({ lat, lng }: { lat: number; lng: number }) {
  return <LocationViewMap lat={lat} lng={lng} />;
}
