"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

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
type Suggestion = { label: string; secondary?: string; lat?: number; lng?: number };

// Bias results toward Tashkent so local places rank first.
const BIAS = { lat: 41.311, lng: 69.279 };

/**
 * Photon (komoot, built on OpenStreetMap) — free, no API key, designed for
 * type-ahead autocomplete (unlike Nominatim, which forbids autocomplete use).
 */
async function photonSearch(
  q: string,
  signal: AbortSignal,
): Promise<Suggestion[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
    `&limit=6&lat=${BIAS.lat}&lon=${BIAS.lng}`;
  const res = await fetch(url, { signal });
  const data = (await res.json()) as {
    features?: Array<{
      properties?: Record<string, string>;
      geometry?: { coordinates?: [number, number] };
    }>;
  };
  return (data.features ?? []).map((f) => {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [];
    const primary = p.name || p.street || p.city || p.state || p.country || q;
    const rest = [p.city, p.state, p.country].filter(
      (x): x is string => !!x && x !== primary,
    );
    return {
      label: primary,
      secondary: [...new Set(rest)].join(", "),
      lat,
      lng,
    };
  });
}

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
  const [busy, setBusy] = useState(false);

  // Autocomplete dropdown state.
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // True right after a pick, so we don't immediately re-search the filled text.
  const justPicked = useRef(false);

  // Debounced search as the user types (Photon for >=2 chars, otherwise the
  // static quick-picks for Tashkent venues).
  useEffect(() => {
    if (!open) return;
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = address.trim();
    if (q.length < 2) {
      setSuggestions(LOCATION_SUGGESTIONS.map((l) => ({ label: l })));
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        setSuggestions(await photonSearch(q, ctrl.signal));
      } catch {
        // Aborted or offline — leave the previous list.
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [address, open]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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

  function selectSuggestion(s: Suggestion) {
    justPicked.current = true;
    setAddress(s.secondary ? `${s.label}, ${s.secondary}` : s.label);
    if (s.lat != null && s.lng != null) {
      setMarker({ lat: s.lat, lng: s.lng });
      setView({ lat: s.lat, lng: s.lng });
    }
    setOpen(false);
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

      {/* Address input with a live autocomplete dropdown (Luma-style). */}
      <div ref={boxRef} className="relative">
        <MapPin
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id="location"
          name="location"
          required
          autoComplete="off"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("locationPlaceholder")}
          className="pl-9"
        />

        {open && (loading || suggestions.length > 0) && (
          <ul className="bg-popover absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border p-1 shadow-lg">
            {loading && suggestions.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">
                {t("searching")}
              </li>
            ) : (
              suggestions.map((s, i) => (
                <li key={`${s.label}-${i}`}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="hover:bg-accent flex w-full items-start gap-2 rounded-md px-3 py-2 text-left"
                  >
                    <MapPin
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {s.label}
                      </span>
                      {s.secondary && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {s.secondary}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Coordinates submitted with the form (set by the picker). */}
      <input type="hidden" name="latitude" value={marker?.lat ?? ""} />
      <input type="hidden" name="longitude" value={marker?.lng ?? ""} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">{t("mapHint")}</p>
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

      {/* `isolate` confines Leaflet's internal z-indexes (panes/controls go up
          to ~1000) to this subtree, so the search dropdown above renders on top
          of the map instead of being covered by it. */}
      <div className="relative z-0 isolate">
        <LocationPickerMap
          marker={marker}
          view={view}
          onPick={(lat, lng) => pick(lat, lng)}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
