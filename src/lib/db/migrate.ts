/**
 * Applies the SQL migrations in ./drizzle to whichever database is configured.
 * Used by `npm run db:migrate`, the test harness and the dev-server bootstrap.
 */
import path from "node:path";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type * as schema from "./schema";
import type { Db } from "./index";

const migrationsFolder = path.join(process.cwd(), "drizzle");

export async function runMigrations(db: Db): Promise<void> {
  // The two drivers expose identical migrators with different types.
  if ("$client" in db && db.$client && db.$client.constructor?.name === "PGlite") {
    await migratePglite(db as PgliteDatabase<typeof schema>, { migrationsFolder });
  } else {
    await migratePg(db as NodePgDatabase<typeof schema>, { migrationsFolder });
  }
}
