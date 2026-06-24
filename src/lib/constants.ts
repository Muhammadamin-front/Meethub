/**
 * App-wide constants. Keep values here that are referenced from multiple
 * places (metadata, emails, UI) so there is a single source of truth.
 */

export const APP_NAME = "MeetHub";

export const APP_DESCRIPTION =
  "Discover local meetups, join events hosted by trusted organizations, and connect with people who share your interests.";

/**
 * Starting reputation score for every new user (see Phase 4 reputation logic).
 */
export const DEFAULT_REPUTATION = 100;

/** Minimum and maximum reputation values. */
export const MIN_REPUTATION = 0;
export const MAX_REPUTATION = 100;

/** Reputation lost when an organization marks a registration as NO_SHOW. */
export const NO_SHOW_REPUTATION_PENALTY = 15;

/** XP earned per event attended (drives the leaderboard). */
export const XP_PER_ATTENDED = 10;

/**
 * Bonus XP for each extra day in an attendance streak. A streak is a run of
 * consecutive calendar days on which the user attended at least one event, so a
 * 3-day streak grants 2 × STREAK_BONUS_XP on top of the per-event XP.
 */
export const STREAK_BONUS_XP = 5;

/**
 * Auto-block thresholds (used by the daily no-show cron job in Phase 4).
 * 3+ no-shows within the trailing 30 days => auto-block.
 */
export const NO_SHOW_WINDOW_DAYS = 30;
export const NO_SHOW_BLOCK_THRESHOLD = 3;

/** How long an auto-block / manual block lasts. */
export const BLOCK_DURATION_DAYS = 30;

/**
 * Suggested locations for the event form (autocomplete). Free text is still
 * allowed — these are just quick picks.
 */
export const LOCATION_SUGGESTIONS = [
  "IT Park, Toshkent",
  "Hub Space, Toshkent",
  "Creative Hub, Toshkent",
  "Impact Hub, Toshkent",
  "Ground Zero, Toshkent",
  "TUIT, Toshkent",
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Namangan",
  "Farg‘ona",
  "Online",
] as const;

/**
 * Selectable event categories shown in the create/edit form and used as the
 * filter chips on the events page. Stored verbatim on Event.category and
 * displayed as-is (no translation), so keep them short and language-neutral.
 */
export const EVENT_CATEGORIES = [
  "IT",
  "Sport",
  "Speaking",
  "Business",
  "Startup",
  "Marketing",
  "Design",
  "Music",
  "Art",
  "Photography",
  "Film",
  "Gaming",
  "Education",
  "Science",
  "Health",
  "Fitness",
  "Food",
  "Travel",
  "Networking",
  "Finance",
  "Language",
  "Literature",
  "Volunteering",
  "Fashion",
  "Dance",
  "Theater",
  "Comedy",
  "Wellness",
  "Crafts",
  "Outdoors",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/**
 * Major Uzbek cities with approximate coordinates. Powers the "near me" filter
 * on the events page: the browser's geolocation is matched to the closest city,
 * then events whose `location` contains that city name are shown. Plain data
 * (no server-only deps) so it is safe to import into client components.
 */
export const UZ_CITIES = [
  { name: "Toshkent", lat: 41.3111, lng: 69.2797 },
  { name: "Samarqand", lat: 39.6542, lng: 66.9597 },
  { name: "Buxoro", lat: 39.768, lng: 64.421 },
  { name: "Andijon", lat: 40.7821, lng: 72.3442 },
  { name: "Namangan", lat: 40.9983, lng: 71.6726 },
  { name: "Farg‘ona", lat: 40.3864, lng: 71.7864 },
  { name: "Nukus", lat: 42.46, lng: 59.6166 },
  { name: "Qarshi", lat: 38.8606, lng: 65.7891 },
  { name: "Urganch", lat: 41.55, lng: 60.6333 },
  { name: "Jizzax", lat: 40.1158, lng: 67.8422 },
  { name: "Navoiy", lat: 40.0844, lng: 65.3792 },
  { name: "Termiz", lat: 37.2242, lng: 67.2783 },
  { name: "Guliston", lat: 40.4897, lng: 68.7842 },
] as const;

/**
 * Primary navigation links shown in the site header.
 * `key` maps to a message in the `Nav` namespace (see messages/*.json).
 */
export const NAV_LINKS = [
  { href: "/events", key: "events" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/organizations", key: "organizations" },
  { href: "/ticket", key: "ticket" },
] as const;
