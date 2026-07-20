/**
 * Server-side authorisation guards. Every server action, route handler and
 * protected page calls one of these — UI hiding is never the only control.
 * Denials are audited.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser, isVerifiedStaff, type SessionUser } from "@/lib/auth/session";
import { rolesHavePermission, type Permission, type Role } from "@/lib/rbac/permissions";
import { recordAudit } from "@/lib/audit";

export class PermissionDeniedError extends Error {
  constructor(public readonly permission?: Permission) {
    super("Permission denied");
    this.name = "PermissionDeniedError";
  }
}

async function requestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const hdrs = await headers();
  return {
    ipAddress: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: hdrs.get("user-agent")?.slice(0, 400) ?? null,
  };
}

/** Page guard: redirects to sign-in when there is no patient session. */
export async function requirePatient(): Promise<SessionUser & { patientId: string }> {
  const user = await getSessionUser();
  if (!user || user.kind !== "patient" || !user.patientId) {
    redirect("/patient/sign-in");
  }
  return user as SessionUser & { patientId: string };
}

/** Page guard: redirects to staff sign-in (or MFA step) when not verified. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff") redirect("/staff/sign-in");
  if (!user.mfaVerified) redirect("/staff/sign-in/mfa");
  if (!isVerifiedStaff(user)) redirect("/staff/sign-in");
  return user;
}

/**
 * Action guard: verified staff session holding `permission`. Throws
 * PermissionDeniedError (rendered as a permission-denied state) and audits
 * the denial.
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff" || !user.mfaVerified) {
    throw new PermissionDeniedError(permission);
  }
  if (!rolesHavePermission(user.roles, permission)) {
    const meta = await requestMeta();
    await recordAudit({
      actorId: user.id,
      action: "authz.denied",
      detail: { permission },
      ...meta,
    });
    throw new PermissionDeniedError(permission);
  }
  return user;
}

/** Convenience: any of the listed roles (rarely needed; prefer permissions). */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff" || !user.mfaVerified) {
    throw new PermissionDeniedError();
  }
  if (!user.roles.some((r) => roles.includes(r))) {
    throw new PermissionDeniedError();
  }
  return user;
}

/** Audits a successful sensitive action with request metadata attached. */
export async function auditAction(
  user: SessionUser | null,
  action: string,
  entityType?: string,
  entityId?: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const meta = await requestMeta();
  await recordAudit({
    actorId: user?.id ?? null,
    actorType: user ? (user.kind === "patient" ? "patient" : "user") : "system",
    action,
    entityType,
    entityId,
    detail,
    ...meta,
  });
}
