/**
 * XP + attendance-streak math. XP is *derived* from a user's attended events
 * (we don't store a running total), so the same helper is used on the dashboard
 * and the leaderboard to keep the numbers consistent.
 */

import { STREAK_BONUS_XP, XP_PER_ATTENDED } from "@/lib/constants";

/** Whole-day number (UTC) for a date, so calendar days compare as integers. */
function dayNumber(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000,
  );
}

export type Streaks = {
  /** Run of consecutive days ending at the most recent attended day (0 if it
   *  ended more than a day ago — i.e. the streak has lapsed). */
  current: number;
  /** Best run of consecutive attended days, ever. */
  longest: number;
};

/** Current and longest consecutive-day attendance streaks from event dates. */
export function computeStreaks(dates: Date[]): Streaks {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const days = [...new Set(dates.map(dayNumber))].sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Trailing run ending at the most recent attended day.
  let current = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i] === days[i - 1] + 1) current++;
    else break;
  }
  // A streak only "counts" as active if its last day is today or yesterday.
  const today = dayNumber(new Date());
  if (today - days[days.length - 1] > 1) current = 0;

  return { current, longest };
}

export type XpBreakdown = {
  attended: number;
  base: number;
  streakBonus: number;
  total: number;
  currentStreak: number;
  longestStreak: number;
};

/**
 * Total XP for a user from the dates of the events they attended:
 * base XP per event + a bonus for each extra day in their best streak.
 */
export function computeXp(dates: Date[]): XpBreakdown {
  const { current, longest } = computeStreaks(dates);
  const base = dates.length * XP_PER_ATTENDED;
  const streakBonus = Math.max(0, longest - 1) * STREAK_BONUS_XP;
  return {
    attended: dates.length,
    base,
    streakBonus,
    total: base + streakBonus,
    currentStreak: current,
    longestStreak: longest,
  };
}
