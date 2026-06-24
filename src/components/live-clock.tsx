"use client";

import { Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Current date + time in the visitor's own locale and timezone (resolved by the
 * browser from their location settings). Renders after mount to avoid hydration
 * mismatches, since the value differs per client.
 */
export function LiveClock({ className }: { className?: string }) {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set the time on mount (not before) so server and client first paint match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    // Reserve space so the hero layout doesn't shift when the clock appears.
    return <span className={className}>&nbsp;</span>;
  }

  const date = now.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <span className={className}>
      <Clock className="text-primary size-4" aria-hidden />
      <span className="text-muted-foreground tabular-nums">
        {date} · {time}
      </span>
    </span>
  );
}
