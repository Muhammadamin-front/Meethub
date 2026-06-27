import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A friendly display name. Uses the first name; if the stored name is actually
 * an email (no real name from the OAuth provider), derives a nice label from
 * the part before "@" (e.g. "crazy.dev@gmail.com" -> "Crazy Dev").
 */
export function displayName(name: string) {
  const first = name.trim().split(/\s+/)[0] || name.trim();
  if (!first.includes("@")) return first;
  const local = first.split("@")[0];
  const pretty = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return pretty || "there";
}

/** Prefer the user's chosen nickname; otherwise fall back to {@link displayName}. */
export function userLabel(u: { nickname?: string | null; name: string }) {
  const nick = u.nickname?.trim();
  return nick && nick.length > 0 ? nick : displayName(u.name);
}

// Event times are always Asia/Tashkent. Uzbekistan is a fixed UTC+5 with no
// DST, so we can pin the offset rather than depend on the server/visitor zone.
// This keeps the stored instant, the displayed time and the countdown all
// consistent no matter where they're rendered.
export const EVENT_TZ = "Asia/Tashkent";
const EVENT_TZ_OFFSET = "+05:00";

/**
 * Parse a `datetime-local` value (which carries no zone) as Asia/Tashkent wall
 * time, returning the correct UTC instant. e.g. "2026-06-27T14:00" -> 09:00Z.
 */
export function parseEventDateTime(value: string): Date {
  const withSeconds = /T\d{2}:\d{2}:\d{2}/.test(value) ? value : `${value}:00`;
  return new Date(`${withSeconds}${EVENT_TZ_OFFSET}`);
}

/**
 * Render an instant as an Asia/Tashkent wall-clock `datetime-local` value, so
 * the edit form shows the same time the organizer originally entered.
 */
export function toDateTimeLocalValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * A universal maps URL. Tapping it opens the phone's map app (Google Maps /
 * Apple Maps) on iOS and Android, or the web map on desktop. Prefers exact
 * coordinates when the event has them, otherwise searches the address text.
 */
export function mapsUrl(
  location: string,
  lat?: number | null,
  lng?: number | null,
) {
  const query =
    lat != null && lng != null ? `${lat},${lng}` : location.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Localized date+time range, e.g. "Jul 1, 2026, 18:00 – 20:00". */
export function formatEventRange(start: Date, end: Date, locale: string) {
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: EVENT_TZ,
  }).format(start);
  const time = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: EVENT_TZ,
  });
  return `${date}, ${time.format(start)} – ${time.format(end)}`;
}
