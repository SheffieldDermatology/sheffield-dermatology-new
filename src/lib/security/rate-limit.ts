/**
 * Database-backed fixed-window rate limiter — works identically on PGlite in
 * development and shared PostgreSQL in production (multi-instance safe).
 */
import { eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

export interface RateLimitRule {
  /** Max requests per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  mfa: { limit: 8, windowSeconds: 15 * 60 },
  passwordReset: { limit: 5, windowSeconds: 60 * 60 },
  booking: { limit: 20, windowSeconds: 60 * 60 },
  messaging: { limit: 30, windowSeconds: 60 * 60 },
  upload: { limit: 30, windowSeconds: 60 * 60 },
  registration: { limit: 10, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Returns true when the request is allowed. `key` should combine the rule
 * name with a stable client identifier (IP or account id).
 */
export async function checkRateLimit(rule: RateLimitRule, key: string): Promise<boolean> {
  const db = getDb();
  const now = new Date();
  const windowStart = new Date(now.getTime() - rule.windowSeconds * 1000);

  const rows = await db.select().from(rateLimits).where(eq(rateLimits.bucket, key)).limit(1);
  const row = rows[0];

  if (!row || row.windowStartsAt < windowStart) {
    await db
      .insert(rateLimits)
      .values({ bucket: key, windowStartsAt: now, count: 1 })
      .onConflictDoUpdate({
        target: rateLimits.bucket,
        set: { windowStartsAt: now, count: 1 },
      });
    return true;
  }
  if (row.count >= rule.limit) return false;
  await db
    .update(rateLimits)
    .set({ count: row.count + 1 })
    .where(eq(rateLimits.bucket, key));
  return true;
}

/** Housekeeping job: drop stale windows. */
export async function purgeExpiredRateLimits(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.delete(rateLimits).where(lt(rateLimits.windowStartsAt, cutoff));
}
