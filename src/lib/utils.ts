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

/** Format a Date for a `datetime-local` input value (local time, minutes). */
export function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Localized date+time range, e.g. "Jul 1, 2026, 18:00 – 20:00". */
export function formatEventRange(start: Date, end: Date, locale: string) {
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(start);
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  return `${date}, ${time.format(start)} – ${time.format(end)}`;
}
