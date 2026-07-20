/**
 * Password hashing with Node's built-in scrypt (OWASP-recommended parameters:
 * N=2^17, r=8, p=1) and timing-safe verification. Format:
 *   scrypt$N$r$p$saltBase64$hashBase64
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 2 ** 17;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 256 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: MAX_MEM,
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, "base64");
  const expected = Buffer.from(hashB64!, "base64");
  const derived = await scryptAsync(password.normalize("NFKC"), salt, expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
    maxmem: MAX_MEM,
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Minimum bar for account passwords; full policy enforced by zod schemas. */
export function passwordMeetsPolicy(password: string): { ok: boolean; reason?: string } {
  if (password.length < 12) {
    return { ok: false, reason: "Password must be at least 12 characters long." };
  }
  if (password.length > 128) {
    return { ok: false, reason: "Password must be at most 128 characters long." };
  }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((rx) =>
    rx.test(password),
  ).length;
  if (classes < 3) {
    return {
      ok: false,
      reason: "Use at least three of: lower-case, upper-case, numbers, symbols.",
    };
  }
  return { ok: true };
}
