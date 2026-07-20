/**
 * Database-backed sessions. The cookie holds a random token; the database
 * stores its SHA-256 hash. Idle timeout 30 minutes for staff / 60 for
 * patients, absolute lifetime 12 hours. Staff sessions additionally require
 * completed MFA before they grant access.
 */
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, users, userRoles, patients } from "@/lib/db/schema";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { isProduction } from "@/lib/env";
import type { Role } from "@/lib/rbac/permissions";
import { isStaffRole } from "@/lib/rbac/permissions";

export const SESSION_COOKIE = "sd_session";
const ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000;
const STAFF_IDLE_MS = 30 * 60 * 1000;
const PATIENT_IDLE_MS = 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  kind: "staff" | "patient";
  status: "invited" | "active" | "locked" | "disabled";
  roles: Role[];
  mfaVerified: boolean;
  /** Present when kind === "patient" and a patient row is linked. */
  patientId?: string;
  sessionTokenHash: string;
}

export async function createSession(userId: string, mfaVerified: boolean): Promise<string> {
  const db = getDb();
  const token = generateToken(32);
  const hdrs = await headers();
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    mfaVerified,
    absoluteExpiresAt: new Date(Date.now() + ABSOLUTE_LIFETIME_MS),
    ipAddress: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: hdrs.get("user-agent")?.slice(0, 400) ?? null,
  });
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_LIFETIME_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function revokeSession(tokenHash: string): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, tokenHash));
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/** Marks the current session MFA-verified (after TOTP challenge succeeds). */
export async function markSessionMfaVerified(tokenHash: string): Promise<void> {
  const db = getDb();
  await db.update(sessions).set({ mfaVerified: true }).where(eq(sessions.tokenHash, tokenHash));
}

/**
 * Resolves the current session user, enforcing idle/absolute expiry and
 * account status. Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const db = getDb();

  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const now = Date.now();
  const { session, user } = row;
  if (session.revokedAt) return null;
  if (session.absoluteExpiresAt.getTime() < now) return null;
  if (user.status === "disabled" || user.status === "locked") return null;

  const idleLimit = user.kind === "staff" ? STAFF_IDLE_MS : PATIENT_IDLE_MS;
  if (session.lastSeenAt.getTime() + idleLimit < now) {
    await revokeSession(tokenHash);
    return null;
  }

  // Sliding idle window (throttled to once a minute to reduce writes).
  if (now - session.lastSeenAt.getTime() > 60_000) {
    await db
      .update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.tokenHash, tokenHash));
  }

  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));
  const roles = roleRows.map((r) => r.role) as Role[];

  let patientId: string | undefined;
  if (user.kind === "patient") {
    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);
    patientId = patientRows[0]?.id;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    kind: user.kind,
    status: user.status,
    roles,
    mfaVerified: session.mfaVerified,
    patientId,
    sessionTokenHash: tokenHash,
  };
});

/** True when the user holds any staff role and has completed MFA. */
export function isVerifiedStaff(user: SessionUser | null): user is SessionUser {
  return (
    !!user && user.kind === "staff" && user.mfaVerified && user.roles.some((r) => isStaffRole(r))
  );
}
