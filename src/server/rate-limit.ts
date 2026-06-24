import "server-only";

/**
 * Basic in-memory fixed-window rate limiter. Good enough for a single instance /
 * local dev. For multi-instance (serverless) production, swap the Map for a
 * shared store (e.g. Upstash Redis) keeping the same signature.
 */
type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

/** Returns true if the action is allowed, false if the limit is exceeded. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup so the Map doesn't grow unbounded.
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
