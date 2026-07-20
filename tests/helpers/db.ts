/**
 * Integration-test database helper: a fresh in-memory PGlite database with the
 * real migrations applied. No real patient data is ever used in tests.
 */
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";
import * as schema from "@/lib/db/schema";

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

export async function makeTestDb(): Promise<TestDb> {
  const db = drizzle("memory://", { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

/**
 * Creates a fresh migrated in-memory database AND installs it as the global
 * singleton returned by getDb(), so code paths that call getDb() internally
 * (the booking engine, notify, jobs) use the isolated test database.
 */
export async function installTestDb(): Promise<TestDb> {
  const db = await makeTestDb();
  (globalThis as unknown as { __sheffDb?: unknown }).__sheffDb = db;
  return db;
}

