"use client";

import { MapPin, Navigation, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { UZ_CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const chip =
  "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted";
const chipActive =
  "border-primary bg-primary text-primary-foreground hover:bg-primary";

/** Great-circle distance (km) between two lat/lng points. */
function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function EventsFilter({
  categories,
  q,
  category,
  near,
}: {
  categories: string[];
  q: string;
  category: string;
  near: string;
}) {
  const t = useTranslations("Event");
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(q);
  const [locating, setLocating] = useState(false);

  function push(nextSearch: string, nextCategory: string, nextNear: string) {
    const params = new URLSearchParams();
    if (nextSearch) params.set("q", nextSearch);
    if (nextCategory) params.set("category", nextCategory);
    if (nextNear) params.set("near", nextNear);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  // Detect the user's nearest city via the browser and filter by it.
  function findNearMe() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        let best: (typeof UZ_CITIES)[number] = UZ_CITIES[0];
        let bestD = Infinity;
        for (const c of UZ_CITIES) {
          const d = distanceKm(coords.latitude, coords.longitude, c.lat, c.lng);
          if (d < bestD) {
            bestD = d;
            best = c;
          }
        }
        setLocating(false);
        push(search, category, best.name);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  // Debounce the search box; chips/select navigate immediately.
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => push(search, category, near), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <button
          type="button"
          onClick={findNearMe}
          disabled={locating}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors hover:bg-muted disabled:opacity-60",
            near && "border-primary text-primary",
          )}
        >
          <Navigation className="size-4" aria-hidden />
          {locating ? t("locating") : t("nearMe")}
        </button>

        <div className="relative shrink-0">
          <MapPin
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <select
            value={near}
            onChange={(e) => push(search, category, e.target.value)}
            className="border-input bg-background h-9 rounded-md border pr-3 pl-9 text-sm"
          >
            <option value="">{t("allCities")}</option>
            {UZ_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => push(search, "", near)}
            className={cn(chip, !category && chipActive)}
          >
            {t("allCategories")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => push(search, c, near)}
              className={cn(chip, category === c && chipActive)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
