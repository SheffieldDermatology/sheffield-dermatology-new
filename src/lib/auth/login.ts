/**
 * Credential verification with progressive lockout, shared by patient and
 * staff sign-in actions. Responses never reveal whether the account exists.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, credentials } from "@/lib/db/schema";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";
import { recordAudit } from "@/lib/audit";

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;

export type LoginResult =
  | { ok: true; userId: string; kind: "staff" | "patient" }
  | { ok: false; reason: "invalid" | "locked" | "disabled" };

export async function verifyCredentials(email: string, password: string): Promise<LoginResult> {
  const db = getDb();
  const rows = await db
    .select({ user: users, cred: credentials })
    .from(users)
    .innerJoin(credentials, eq(credentials.userId, users.id))
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  const row = rows[0];

  if (!row) {
    // Constant-time-ish: burn a hash verification even for unknown accounts.
    await verifyPassword(password, await unknownAccountHash());
    return { ok: false, reason: "invalid" };
  }

  const { user, cred } = row;
  if (user.status === "disabled") return { ok: false, reason: "disabled" };
  if (cred.lockedUntil && cred.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  const valid = await verifyPassword(password, cred.passwordHash);
  if (!valid) {
    const failed = cred.failedAttempts + 1;
    await db
      .update(credentials)
      .set({
        failedAttempts: failed,
        lockedUntil:
          failed >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : null,
      })
      .where(eq(credentials.userId, user.id));
    await recordAudit({
      actorId: user.id,
      action: failed >= MAX_FAILED_ATTEMPTS ? "auth.locked" : "auth.login_failed",
      detail: { failedAttempts: failed },
    });
    return { ok: false, reason: "invalid" };
  }

  if (cred.failedAttempts > 0 || cred.lockedUntil) {
    await db
      .update(credentials)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(credentials.userId, user.id));
  }
  return { ok: true, userId: user.id, kind: user.kind };
}

let cachedUnknownHash: string | null = null;
async function unknownAccountHash(): Promise<string> {
  if (!cachedUnknownHash) {
    cachedUnknownHash = await hashPassword("timing-equalisation-placeholder");
  }
  return cachedUnknownHash;
}
