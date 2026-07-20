import { z } from "zod";

/**
 * Server-side environment configuration, validated once at startup.
 * Every integration is optional: absence disables the feature safely rather
 * than substituting an insecure fake.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().optional(),

  SEMBLE_API_URL: z.string().url().optional(),
  SEMBLE_API_TOKEN: z.string().optional(),
  SEMBLE_WEBHOOK_SECRET: z.string().optional(),

  HEIDI_API_URL: z.string().url().optional(),
  HEIDI_API_KEY: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(["stripe", "semble_pay"]).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  EMAIL_PROVIDER: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  SMS_PROVIDER: z.string().optional(),
  SMS_ACCOUNT_SID: z.string().optional(),
  SMS_AUTH_TOKEN: z.string().optional(),
  SMS_FROM: z.string().optional(),

  STORAGE_PROVIDER: z.enum(["local", "microsoft-graph", "s3"]).default("local"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(z.treeifyError(parsed.error))}`,
  );
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/**
 * The session secret signs session tokens and CSRF tokens. In production it
 * must be provided; in development/test a fixed value keeps setup zero-config
 * (and is obviously unsafe for real data, which development must never hold).
 */
export function sessionSecret(): string {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (isProduction) {
    throw new Error("SESSION_SECRET must be set in production. See DEPLOYMENT.md.");
  }
  return "development-only-secret-never-use-in-production-0000000000";
}

/** Production requires a managed PostgreSQL DATABASE_URL. */
export function assertProductionDatabase(): void {
  if (isProduction && !env.DATABASE_URL) {
    throw new Error("DATABASE_URL must point at managed PostgreSQL in production.");
  }
}
