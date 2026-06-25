/**
 * Achievement badges, derived entirely from a user's existing stats (no extra
 * storage). Each badge maps to a `Badges.<id>` i18n entry (title + desc).
 */

export type BadgeStats = {
  attended: number;
  longestStreak: number;
  reviews: number;
  organized: number;
  reputation: number;
  verifiedOrg: boolean;
};

export type BadgeId =
  | "newcomer"
  | "regular"
  | "veteran"
  | "streak3"
  | "streak7"
  | "reviewer"
  | "host"
  | "superhost"
  | "verified"
  | "trusted";

export type Badge = {
  id: BadgeId;
  emoji: string;
  earned: boolean;
};

export function computeBadges(s: BadgeStats): Badge[] {
  return [
    { id: "newcomer", emoji: "🌱", earned: s.attended >= 1 },
    { id: "regular", emoji: "⭐", earned: s.attended >= 5 },
    { id: "veteran", emoji: "🏆", earned: s.attended >= 15 },
    { id: "streak3", emoji: "🔥", earned: s.longestStreak >= 3 },
    { id: "streak7", emoji: "⚡", earned: s.longestStreak >= 7 },
    { id: "reviewer", emoji: "✍️", earned: s.reviews >= 1 },
    { id: "host", emoji: "🎤", earned: s.organized >= 1 },
    { id: "superhost", emoji: "🚀", earned: s.organized >= 5 },
    { id: "verified", emoji: "✅", earned: s.verifiedOrg },
    { id: "trusted", emoji: "💎", earned: s.reputation >= 100 },
  ];
}
