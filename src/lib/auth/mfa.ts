/**
 * TOTP multi-factor authentication (RFC 6238) with recovery codes, built on
 * otplib v13's functional API. Secrets are stored AES-256-GCM encrypted;
 * recovery codes stored hashed.
 */
import { generateSecret, generateURI, verify } from "otplib";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mfaSecrets } from "@/lib/db/schema";
import { encryptSecret, decryptSecret, hashToken } from "@/lib/auth/tokens";

const ISSUER = "Sheffield Dermatology";
// Accept the previous/next 30-second window to tolerate clock skew.
const EPOCH_TOLERANCE_SECONDS = 30;

async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const result = await verify({ secret, token, epochTolerance: EPOCH_TOLERANCE_SECONDS });
  return result.valid;
}

export function generateMfaSetup(email: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: ISSUER, label: email, secret });
  return { secret, otpauthUrl };
}

/** Returns the pending (unconfirmed) setup, creating one if needed. */
export async function getOrCreateMfaSetup(
  userId: string,
  email: string,
): Promise<{ secret: string; otpauthUrl: string }> {
  const db = getDb();
  const rows = await db.select().from(mfaSecrets).where(eq(mfaSecrets.userId, userId)).limit(1);
  const row = rows[0];
  if (row && !row.confirmedAt) {
    const secret = decryptSecret(row.secretEncrypted);
    return { secret, otpauthUrl: generateURI({ issuer: ISSUER, label: email, secret }) };
  }
  const setup = generateMfaSetup(email);
  await storeMfaSecret(userId, setup.secret);
  return setup;
}

export async function storeMfaSecret(userId: string, secret: string): Promise<void> {
  const db = getDb();
  await db
    .insert(mfaSecrets)
    .values({ userId, secretEncrypted: encryptSecret(secret) })
    .onConflictDoUpdate({
      target: mfaSecrets.userId,
      set: { secretEncrypted: encryptSecret(secret), confirmedAt: null, recoveryCodeHashes: [] },
    });
}

export async function confirmMfa(userId: string, code: string): Promise<string[] | null> {
  const db = getDb();
  const rows = await db.select().from(mfaSecrets).where(eq(mfaSecrets.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const secret = decryptSecret(row.secretEncrypted);
  if (!(await verifyTotp(secret, code))) return null;

  const recoveryCodes = Array.from({ length: 8 }, () =>
    randomBytes(5).toString("hex").toUpperCase(),
  );
  await db
    .update(mfaSecrets)
    .set({ confirmedAt: new Date(), recoveryCodeHashes: recoveryCodes.map(hashToken) })
    .where(eq(mfaSecrets.userId, userId));
  return recoveryCodes;
}

export async function verifyMfaCode(userId: string, code: string): Promise<boolean> {
  const db = getDb();
  const rows = await db.select().from(mfaSecrets).where(eq(mfaSecrets.userId, userId)).limit(1);
  const row = rows[0];
  if (!row || !row.confirmedAt) return false;

  const normalised = code.replace(/\s+/g, "").toUpperCase();
  // Recovery code path: single-use 10-char hex.
  if (normalised.length === 10) {
    const hash = hashToken(normalised);
    if (row.recoveryCodeHashes.includes(hash)) {
      await db
        .update(mfaSecrets)
        .set({ recoveryCodeHashes: row.recoveryCodeHashes.filter((h) => h !== hash) })
        .where(eq(mfaSecrets.userId, userId));
      return true;
    }
    return false;
  }
  const secret = decryptSecret(row.secretEncrypted);
  return verifyTotp(secret, normalised);
}

export async function userHasConfirmedMfa(userId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ confirmedAt: mfaSecrets.confirmedAt })
    .from(mfaSecrets)
    .where(eq(mfaSecrets.userId, userId))
    .limit(1);
  return !!rows[0]?.confirmedAt;
}
