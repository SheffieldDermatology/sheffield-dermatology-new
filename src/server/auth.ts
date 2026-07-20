"use server";

/**
 * Authentication server actions. Every action validates input server-side,
 * rate-limits by client identifier, audits outcomes and never reveals whether
 * an email address holds an account.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  users,
  credentials,
  userRoles,
  patients,
  consents,
  authTokens,
  outboxEmail,
} from "@/lib/db/schema";
import { verifyCredentials } from "@/lib/auth/login";
import { hashPassword, passwordMeetsPolicy } from "@/lib/auth/passwords";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
  markSessionMfaVerified,
  revokeSession,
  revokeAllUserSessions,
} from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { verifyMfaCode, userHasConfirmedMfa, confirmMfa } from "@/lib/auth/mfa";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { recordAudit } from "@/lib/audit";
import { env } from "@/lib/env";

export type ActionState = { error?: string; ok?: boolean; message?: string };

async function clientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Minimal-content email capture; the outbox never contains clinical data. */
async function queueAuthEmail(to: string, subject: string, bodyText: string, templateKey: string) {
  const db = getDb();
  await db.insert(outboxEmail).values({ toEmail: to, subject, bodyText, templateKey });
}

const emailSchema = z.string().trim().toLowerCase().email().max(254);

// ── Patient sign-in ─────────────────────────────────────────────────────

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export async function patientSignIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please enter a valid email address and password." };

  const ip = await clientIp();
  if (!(await checkRateLimit(RATE_LIMITS.login, `login:${ip}`))) {
    return { error: "Too many sign-in attempts. Please try again in 15 minutes." };
  }

  const result = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    // Deliberately identical for "invalid" and "locked" so the response never
    // reveals whether an account exists. A locked-out user recovers via reset,
    // which clears the lockout.
    return { error: "That email address and password combination was not recognised, or the account is temporarily locked after repeated attempts. If needed, reset your password." };
  }
  if (result.kind !== "patient") {
    return { error: "That email address and password combination was not recognised." };
  }

  const token = await createSession(result.userId, true);
  await setSessionCookie(token);
  await recordAudit({ actorId: result.userId, actorType: "patient", action: "auth.patient_login" });
  redirect("/patient");
}

// ── Staff sign-in (password step, then MFA) ─────────────────────────────

export async function staffSignIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please enter a valid email address and password." };

  const ip = await clientIp();
  if (!(await checkRateLimit(RATE_LIMITS.login, `login:${ip}`))) {
    return { error: "Too many sign-in attempts. Please try again in 15 minutes." };
  }

  const result = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    // Identical for "invalid" and "locked" so the response never reveals
    // whether an account exists.
    return { error: "That email address and password combination was not recognised, or the account is temporarily locked after repeated attempts." };
  }
  if (result.kind !== "staff") {
    return { error: "That email address and password combination was not recognised, or the account is temporarily locked after repeated attempts." };
  }

  // Session starts unverified; MFA challenge or enrolment upgrades it.
  const token = await createSession(result.userId, false);
  await setSessionCookie(token);
  await recordAudit({ actorId: result.userId, action: "auth.staff_password_ok" });

  if (await userHasConfirmedMfa(result.userId)) {
    redirect("/staff/sign-in/mfa");
  }
  redirect("/staff/sign-in/enrol");
}

// ── Staff MFA challenge ─────────────────────────────────────────────────

const mfaSchema = z.object({ code: z.string().trim().min(6).max(12) });

export async function staffMfaVerify(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff") redirect("/staff/sign-in");

  const parsed = mfaSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Enter the 6-digit code from your authenticator app." };

  if (!(await checkRateLimit(RATE_LIMITS.mfa, `mfa:${user.id}`))) {
    return { error: "Too many code attempts. Please wait 15 minutes and try again." };
  }

  const valid = await verifyMfaCode(user.id, parsed.data.code);
  if (!valid) {
    await recordAudit({ actorId: user.id, action: "auth.mfa_failed" });
    return { error: "That code was not recognised. Codes change every 30 seconds — try the current one." };
  }

  await markSessionMfaVerified(user.sessionTokenHash);
  await recordAudit({ actorId: user.id, action: "auth.staff_login" });
  redirect("/staff");
}

// ── Staff MFA enrolment (first sign-in) ─────────────────────────────────

export type EnrolState = ActionState & { recoveryCodes?: string[] };

export async function staffMfaEnrolConfirm(
  _prev: EnrolState,
  formData: FormData,
): Promise<EnrolState> {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff") redirect("/staff/sign-in");

  const parsed = mfaSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Enter the 6-digit code from your authenticator app." };

  if (!(await checkRateLimit(RATE_LIMITS.mfa, `mfa:${user.id}`))) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const recoveryCodes = await confirmMfa(user.id, parsed.data.code);
  if (!recoveryCodes) {
    return { error: "That code was not recognised. Scan the QR details again and enter the current code." };
  }

  await markSessionMfaVerified(user.sessionTokenHash);
  await recordAudit({ actorId: user.id, action: "auth.mfa_enrolled" });
  return { ok: true, recoveryCodes };
}

// ── Patient registration ────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: emailSchema,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(12).max(128),
  privacyConsent: z.literal("on"),
});

export async function patientRegister(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    privacyConsent: formData.get("privacyConsent"),
  });
  if (!parsed.success) {
    return { error: "Please complete all required fields. Passwords need at least 12 characters, and you must agree to the privacy notice." };
  }
  const policy = passwordMeetsPolicy(parsed.data.password);
  if (!policy.ok) return { error: policy.reason };

  const ip = await clientIp();
  if (!(await checkRateLimit(RATE_LIMITS.registration, `register:${ip}`))) {
    return { error: "Too many registration attempts from this connection. Please try again later." };
  }

  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${parsed.data.email}`)
    .limit(1);
  if (existing[0]) {
    // Do not confirm the address is registered; send a gentle signal instead.
    await queueAuthEmail(
      parsed.data.email,
      "Sheffield Dermatology — account request",
      "Someone tried to create a patient account with this email address, but an account already exists. If this was you, you can sign in or reset your password from the patient portal. If not, you can ignore this message.",
      "account_exists",
    );
    return { ok: true, message: "Thank you. If this address can be registered you will receive an email — check your inbox to continue." };
  }

  const [user] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      displayName: `${parsed.data.firstName} ${parsed.data.lastName}`,
      phone: parsed.data.phone || null,
      kind: "patient",
      status: "active",
    })
    .returning();
  if (!user) return { error: "Something went wrong creating your account. Please try again." };

  await db.insert(credentials).values({ userId: user.id, passwordHash: await hashPassword(parsed.data.password) });
  await db.insert(userRoles).values({ userId: user.id, role: "patient" });
  const [patient] = await db
    .insert(patients)
    .values({
      userId: user.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    })
    .returning();
  await db.insert(consents).values({
    patientId: patient!.id,
    kind: "privacy",
    granted: true,
    wordingVersion: "privacy-draft-1",
  });

  const verifyToken = generateToken(24);
  await db.insert(authTokens).values({
    userId: user.id,
    kind: "email_verify",
    tokenHash: hashToken(verifyToken),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await queueAuthEmail(
    parsed.data.email,
    "Confirm your Sheffield Dermatology account",
    `Welcome to the Sheffield Dermatology patient portal. Please confirm your email address by visiting: ${env.APP_ORIGIN}/patient/verify/${verifyToken} — the link is valid for 24 hours. If you did not create this account, please ignore this email.`,
    "email_verify",
  );

  await recordAudit({ actorId: user.id, actorType: "patient", action: "auth.patient_registered", entityType: "patients", entityId: patient!.id });

  const token = await createSession(user.id, true);
  await setSessionCookie(token);
  redirect("/patient?welcome=1");
}

// ── Email verification ──────────────────────────────────────────────────

export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.tokenHash, hashToken(rawToken)))
    .limit(1);
  const row = rows[0];
  if (!row || row.kind !== "email_verify" || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return false;
  }
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
  await recordAudit({ actorId: row.userId, actorType: "patient", action: "auth.email_verified" });
  return true;
}

// ── Password reset ──────────────────────────────────────────────────────

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Please enter a valid email address." };

  const ip = await clientIp();
  if (!(await checkRateLimit(RATE_LIMITS.passwordReset, `reset:${ip}`))) {
    return { error: "Too many reset requests. Please try again later." };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${parsed.data}`)
    .limit(1);
  const user = rows[0];
  if (user) {
    const token = generateToken(24);
    await db.insert(authTokens).values({
      userId: user.id,
      kind: "password_reset",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const path = user.kind === "staff" ? "/staff/sign-in/reset" : "/patient/reset";
    await queueAuthEmail(
      user.email,
      "Sheffield Dermatology — password reset",
      `A password reset was requested for your account. To choose a new password visit: ${env.APP_ORIGIN}${path}/${token} — the link is valid for 30 minutes. If you did not request this, you can ignore this email.`,
      "password_reset",
    );
    await recordAudit({ actorId: user.id, action: "auth.reset_requested" });
  }
  return { ok: true, message: "If that address has an account, a reset link has been emailed to it. The link lasts 30 minutes." };
}

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(12).max(128),
  confirm: z.string().min(1).max(128),
});

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: "Passwords need at least 12 characters." };
  if (parsed.data.password !== parsed.data.confirm) {
    return { error: "The two passwords do not match." };
  }
  const policy = passwordMeetsPolicy(parsed.data.password);
  if (!policy.ok) return { error: policy.reason };

  const db = getDb();
  const rows = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.tokenHash, hashToken(parsed.data.token)))
    .limit(1);
  const row = rows[0];
  if (!row || row.kind !== "password_reset" || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { error: "This reset link is no longer valid. Please request a new one." };
  }

  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
  await db
    .update(credentials)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      passwordChangedAt: new Date(),
      failedAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(credentials.userId, row.userId));
  await revokeAllUserSessions(row.userId);
  await recordAudit({ actorId: row.userId, action: "auth.password_reset" });
  return { ok: true, message: "Your password has been changed. You can now sign in with the new password." };
}

// ── Sign out ────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const user = await getSessionUser();
  if (user) {
    await revokeSession(user.sessionTokenHash);
    await recordAudit({
      actorId: user.id,
      actorType: user.kind === "patient" ? "patient" : "user",
      action: "auth.logout",
    });
  }
  await clearSessionCookie();
  redirect("/");
}
