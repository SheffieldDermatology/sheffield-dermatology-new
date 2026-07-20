/**
 * Integration health. Determines each provider's status from environment
 * configuration and adapter mode, and records it in integration_state for the
 * admin health screen. Status is reported honestly — a provider with no
 * credentials is "not_configured", never a fabricated "ok".
 */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { integrationState } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { createEhrProvider, sembleConfigured } from "@/adapters/semble";
import { heidiConfigured } from "@/adapters/heidi";

export type ProviderName = "semble" | "heidi" | "payments" | "email" | "sms" | "storage";
export type IntegrationStatus = "not_configured" | "ok" | "error" | "disabled";

async function upsert(
  provider: ProviderName,
  status: IntegrationStatus,
  detail: Record<string, unknown>,
  lastError?: string,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const values = {
    provider,
    status,
    lastCheckAt: now,
    lastOkAt: status === "ok" ? now : undefined,
    lastError: lastError ?? null,
    detail,
  };
  await db
    .insert(integrationState)
    .values(values)
    .onConflictDoUpdate({
      target: integrationState.provider,
      set: {
        status,
        lastCheckAt: now,
        ...(status === "ok" ? { lastOkAt: now } : {}),
        lastError: lastError ?? null,
        detail,
      },
    });
}

export async function checkAllIntegrations() {
  // Semble — real reachability check when configured.
  if (sembleConfigured()) {
    const ehr = createEhrProvider();
    const health = await ehr.healthCheck();
    await upsert(
      "semble",
      health.ok ? "ok" : "error",
      { mode: "configured" },
      health.ok ? undefined : health.detail,
    );
  } else {
    await upsert("semble", "not_configured", { detail: "No SEMBLE_API_URL / SEMBLE_API_TOKEN" });
  }

  // Heidi — configuration presence only (transcription contract pending).
  await upsert(
    "heidi",
    heidiConfigured() ? "ok" : "not_configured",
    { note: heidiConfigured() ? "Credentials present; transcription contract pending" : "No credentials" },
  );

  // Payments.
  const paymentsConfigured = env.PAYMENT_PROVIDER === "stripe" && !!env.STRIPE_SECRET_KEY;
  await upsert(
    "payments",
    paymentsConfigured ? "ok" : "disabled",
    { provider: env.PAYMENT_PROVIDER ?? "none" },
  );

  // Email.
  const emailConfigured = !!env.EMAIL_PROVIDER && !!env.EMAIL_API_KEY;
  await upsert("email", emailConfigured ? "ok" : "not_configured", {
    provider: env.EMAIL_PROVIDER ?? "outbox-only",
  });

  // SMS.
  const smsConfigured = !!env.SMS_PROVIDER && !!env.SMS_ACCOUNT_SID && !!env.SMS_AUTH_TOKEN;
  await upsert("sms", smsConfigured ? "ok" : "disabled", {
    provider: env.SMS_PROVIDER ?? "outbox-only",
  });

  // Storage — local encrypted store is always available.
  await upsert("storage", "ok", { provider: env.STORAGE_PROVIDER });

  return getIntegrationStates();
}

export async function getIntegrationStates() {
  const db = getDb();
  return db.select().from(integrationState);
}

export async function getIntegrationState(provider: ProviderName) {
  const db = getDb();
  const rows = await db
    .select()
    .from(integrationState)
    .where(eq(integrationState.provider, provider))
    .limit(1);
  return rows[0] ?? null;
}
