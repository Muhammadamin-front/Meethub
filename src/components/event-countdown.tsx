"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Live countdown until an event starts. Shows "Live now" while it is ongoing
 * and renders nothing once it has ended. Time-based, so it only renders after
 * mount to avoid an SSR/client hydration mismatch.
 */
export function EventCountdown({
  startsAt,
  endsAt,
  className,
  showLabel = false,
}: {
  startsAt: string | Date;
  endsAt: string | Date;
  className?: string;
  /** Prefix the remaining time with a "Starts in" label (used on the detail page). */
  showLabel?: boolean;
}) {
  const t = useTranslations("Event");
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Set the time on mount (not before) so server and client first paint match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null || now >= end) return null;

  const base = cn(
    "inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm tabular-nums",
    className,
  );

  if (now >= start) {
    return (
      <span className={base}>
        <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
        {t("live")}
      </span>
    );
  }

  const diff = start - now;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  const value =
    d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

  return (
    <span className={base}>
      <Clock className="size-3" aria-hidden />
      {showLabel ? `${t("startsIn")} ${value}` : value}
    </span>
  );
}
