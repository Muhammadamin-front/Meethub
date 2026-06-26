"use client";

import { Check, Loader2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { checkInEvent } from "@/server/actions/event";

/**
 * Geofenced self check-in. Reads the browser's location and asks the server to
 * mark the user ATTENDED — the server verifies they're near the venue and the
 * event is live, so this can't be faked from home.
 */
export function CheckInButton({ eventId }: { eventId: string }) {
  const t = useTranslations("Event");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();

  function checkIn() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError(t("checkIn.error.geoUnavailable"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        startTransition(async () => {
          const res = await checkInEvent(
            eventId,
            coords.latitude,
            coords.longitude,
          );
          if (res.error) setError(t(`checkIn.error.${res.error}`));
          else setDone(true);
        });
      },
      () => {
        setLocating(false);
        setError(t("checkIn.error.geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <Check className="size-4" aria-hidden />
        {t("checkIn.done")}
      </p>
    );
  }

  const busy = locating || pending;

  return (
    <div>
      <Button type="button" size="lg" onClick={checkIn} disabled={busy}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <MapPin className="size-4" aria-hidden />
        )}
        {locating ? t("checkIn.locating") : t("checkIn.button")}
      </Button>
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
}
