"use server";

/**
 * Administration server actions. Every action requires a specific permission
 * server-side, validates input with zod, and writes an audit event. Secrets
 * are never collected here — integrations are configured via environment
 * variables (see INTEGRATIONS.md).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  ownerInputs,
  users,
  userRoles,
  credentials,
  services,
  settings,
  featureFlags,
} from "@/lib/db/schema";
import { requirePermission, auditAction } from "@/lib/auth/guards";
import { ROLES, type Role } from "@/lib/rbac/permissions";
import { hashPassword } from "@/lib/auth/passwords";
import { generateToken } from "@/lib/auth/tokens";

export type AdminState = { ok?: boolean; error?: string; message?: string };

// ── Owner inputs ────────────────────────────────────────────────────────

const ownerInputSchema = z.object({
  key: z.string().min(1).max(120),
  status: z.enum(["missing", "partial", "supplied", "verified"]),
  value: z.string().max(4000).optional().or(z.literal("")),
});

export async function updateOwnerInput(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const user = await requirePermission("settings.manage");
  const parsed = ownerInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input." };
  const db = getDb();
  await db
    .update(ownerInputs)
    .set({
      status: parsed.data.status,
      value: parsed.data.value ? { note: parsed.data.value } : null,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(ownerInputs.key, parsed.data.key));
  await auditAction(user, "admin.owner_input_updated", "owner_input", parsed.data.key, {
    status: parsed.data.status,
  });
  revalidatePath("/admin/setup");
  return { ok: true, message: "Updated." };
}

// ── Users & roles ───────────────────────────────────────────────────────

const createUserSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function createStaffUser(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const user = await requirePermission("users.manage");
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please provide a name and valid email." };
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing[0]) return { error: "A user with that email already exists." };

  const [created] = await db
    .insert(users)
    .values({ email: parsed.data.email, displayName: parsed.data.displayName, kind: "staff", status: "invited" })
    .returning({ id: users.id });
  // A random unusable password is set until the user completes invitation/reset.
  await db.insert(credentials).values({
    userId: created!.id,
    passwordHash: await hashPassword(generateToken(24)),
  });
  await auditAction(user, "admin.user_created", "user", created!.id, { email: parsed.data.email });
  revalidatePath("/admin/users");
  return {
    ok: true,
    message: "Staff account created (status: invited). Send them a password-reset link to set their password and enrol MFA.",
  };
}

const statusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "disabled"]),
});

export async function setUserStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await requirePermission("users.manage");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request." };
  if (parsed.data.userId === actor.id) return { error: "You cannot change your own account status." };
  const db = getDb();
  await db.update(users).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(users.id, parsed.data.userId));
  await auditAction(actor, "admin.user_status_changed", "user", parsed.data.userId, {
    status: parsed.data.status,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "User status updated." };
}

export async function setUserRoles(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await requirePermission("roles.manage");
  const userId = z.string().uuid().safeParse(formData.get("userId"));
  if (!userId.success) return { error: "Invalid user." };
  const requested = formData
    .getAll("roles")
    .filter((r): r is string => typeof r === "string" && ROLES.includes(r as Role)) as Role[];
  // Patients are never granted staff roles here.
  const staffRoles = requested.filter((r) => r !== "patient");

  const db = getDb();
  await db.delete(userRoles).where(eq(userRoles.userId, userId.data));
  for (const role of staffRoles) {
    await db.insert(userRoles).values({ userId: userId.data, role, grantedBy: actor.id }).onConflictDoNothing();
  }
  await auditAction(actor, "admin.user_roles_changed", "user", userId.data, { roles: staffRoles });
  revalidatePath("/admin/users");
  return { ok: true, message: "Roles updated." };
}

// ── Services ────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  id: z.string().uuid(),
  pricePence: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(5).max(240),
  active: z.enum(["on", "off"]).optional(),
  approved: z.enum(["on", "off"]).optional(),
});

export async function updateService(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await requirePermission("settings.manage");
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the service details." };
  const db = getDb();
  const priceStr = parsed.data.pricePence?.trim();
  const pricePence = priceStr ? Math.round(Number(priceStr)) : null;
  if (priceStr && (!Number.isFinite(pricePence) || pricePence! < 0)) {
    return { error: "Price must be a whole number of pence, or blank." };
  }
  await db
    .update(services)
    .set({
      pricePence,
      durationMinutes: parsed.data.durationMinutes,
      active: parsed.data.active === "on",
      approvedAt: parsed.data.approved === "on" ? new Date() : null,
    })
    .where(eq(services.id, parsed.data.id));
  await auditAction(actor, "admin.service_updated", "service", parsed.data.id);
  revalidatePath("/admin/services");
  revalidatePath("/fees");
  return { ok: true, message: "Service updated." };
}

// ── Clinic settings ─────────────────────────────────────────────────────

const clinicSchema = z.object({
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().max(254).optional().or(z.literal("")),
  addressLines: z.string().trim().max(1000).optional().or(z.literal("")),
  openingHours: z.string().trim().max(500).optional().or(z.literal("")),
  legalEntity: z.string().trim().max(200).optional().or(z.literal("")),
  icoRegistration: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function updateClinicSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await requirePermission("settings.manage");
  const parsed = clinicSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the clinic details." };
  const db = getDb();

  const entries: [string, unknown][] = [
    ["clinic.phone", parsed.data.phone || ""],
    ["clinic.email", parsed.data.email || ""],
    ["clinic.address_lines", parsed.data.addressLines ? parsed.data.addressLines.split("\n").map((l) => l.trim()).filter(Boolean) : []],
    ["clinic.opening_hours", parsed.data.openingHours || ""],
    ["clinic.legal_entity", parsed.data.legalEntity || ""],
    ["clinic.ico_registration", parsed.data.icoRegistration || ""],
  ];
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value, updatedBy: actor.id })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: actor.id, updatedAt: new Date() } });
  }
  await auditAction(actor, "admin.clinic_settings_updated", "settings");
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/contact");
  return { ok: true, message: "Clinic details saved." };
}

// ── Feature flags ───────────────────────────────────────────────────────

const flagSchema = z.object({ key: z.string().min(1).max(120), enabled: z.enum(["on", "off"]) });

export async function setFeatureFlag(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await requirePermission("flags.manage");
  const parsed = flagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid flag." };
  const db = getDb();
  await db
    .update(featureFlags)
    .set({ enabled: parsed.data.enabled === "on", updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(featureFlags.key, parsed.data.key));
  await auditAction(actor, "admin.flag_changed", "feature_flag", parsed.data.key, {
    enabled: parsed.data.enabled === "on",
  });
  revalidatePath("/admin/flags");
  return { ok: true, message: "Feature flag updated." };
}
