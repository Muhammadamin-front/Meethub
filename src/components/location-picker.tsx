"use client";

import { LocateFixed, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCATION_SUGGESTIONS } from "@/lib/constants";

// Leaflet touches `window`, so the map must be client-only (no SSR).
const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/40 h-64 w-full animate-pulse rounded-lg border" />
  ),
});

type Coords = { lat: number; lng: number };

export function LocationPicker({
  defaultLocation,
  defaultLat,
  defaultLng,
  error,
}: {
  defaultLocation?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  error?: string | false;
}) {
  const t = useTranslations("Event.form");
  const locale = useLocale();

  const [address, setAddress] = useState(defaultLocation ?? "");
  const [marker, setMarker] = useState<Coords | null>(
    defaultLat != null && defaultLng != null
      ? { lat: defaultLat, lng: defaultLng }
      : null,
  );
  const [view, setView] = useState<Coords | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // Address text from coordinates (Nominatim reverse geocoding).
  async function reverse(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${locale}`,
      );
      const data = await res.json();
      if (data?.display_name) setAddress(data.display_name as string);
    } catch {
      // Network/geocoder hiccup — keep the user's typed address.
    }
  }

  // Map click or "my location": move marker and back-fill the address.
  function pick(lat: number, lng: number, recenter = false) {
    setMarker({ lat, lng });
    if (recenter) setView({ lat, lng });
    void reverse(lat, lng);
  }

  // Search an address/place and drop the marker on the best match.
  async function runSearch() {
    const q = search.trim();
    if (!q || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=${locale}&q=${encodeURIComponent(q)}`,
      );
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      const hit = data[0];
      if (hit) {
        const lat = Number(hit.lat);
        const lng = Number(hit.lon);
        setMarker({ lat, lng });
        setView({ lat, lng });
        setAddress(hit.display_name);
      }
    } catch {
      // Ignore — the user can still type the address by hand.
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(false);
        pick(coords.latitude, coords.longitude, true);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location">{t("location")}</Label>

      {/* Address text — picked from the map, but always editable. */}
      <Input
        id="location"
        list="location-suggestions"
        name="location"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={t("locationPlaceholder")}
      />
      <datalist id="location-suggestions">
        {LOCATION_SUGGESTIONS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      {/* Coordinates submitted with the form (set by the picker). */}
      <input type="hidden" name="latitude" value={marker?.lat ?? ""} />
      <input type="hidden" name="longitude" value={marker?.lng ?? ""} />

      {/* Map search + my-location. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder={t("mapSearchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void runSearch()}
        >
          {busy ? t("searching") : t("mapSearch")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={useMyLocation}
        >
          <LocateFixed className="size-4" aria-hidden />
          {t("useMyLocation")}
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">{t("mapHint")}</p>

      <LocationPickerMap
        marker={marker}
        view={view}
        onPick={(lat, lng) => pick(lat, lng)}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
