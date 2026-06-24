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
 * Primary navigation links shown in the site header.
 * `key` maps to a message in the `Nav` namespace (see messages/*.json).
 */
export const NAV_LINKS = [
  { href: "/events", key: "events" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/organizations", key: "organizations" },
  { href: "/ticket", key: "ticket" },
] as const;
