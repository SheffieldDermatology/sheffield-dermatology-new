/**
 * Database client. One Postgres dialect everywhere:
 *  - production/staging: managed PostgreSQL via node-postgres (DATABASE_URL)
 *  - development:        embedded PGlite (real Postgres) file-backed in var/dev-db
 *  - tests:              in-memory PGlite created per suite via `createTestDb`
 */
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";
import { env, assertProductionDatabase } from "@/lib/env";

/**
 * One canonical database type for the whole app. Both drivers expose an
 * identical query API; typing every caller against a single concrete type
 * (rather than a union) avoids method-overload resolution failures at call
 * sites. The pglite instance is structurally compatible and cast to match.
 */
export type Db = NodePgDatabase<typeof schema>;

// Next.js dev re-evaluates modules across compilations; keep one connection.
const globalForDb = globalThis as unknown as { __sheffDb?: Db };

function createDb(): Db {
  assertProductionDatabase();
  if (env.DATABASE_URL) {
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
    return drizzlePg(pool, { schema });
  }
  const dataDir = path.join(process.cwd(), "var", "dev-db");
  fs.mkdirSync(dataDir, { recursive: true });
  return drizzlePglite(dataDir, { schema }) as unknown as Db;
}

export function getDb(): Db {
  if (!globalForDb.__sheffDb) {
    globalForDb.__sheffDb = createDb();
  }
  return globalForDb.__sheffDb;
}

/**
 * Test helper: fresh in-memory PGlite database (caller runs migrations).
 * Returns the real pglite handle for the migrator, plus the unified Db view.
 */
export function createTestDb(): { db: Db; raw: PgliteDatabase<typeof schema> } {
  const raw = drizzlePglite("memory://", { schema });
  return { db: raw as unknown as Db, raw };
}

export { schema };
