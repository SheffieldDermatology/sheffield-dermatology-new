import { getDb } from "../src/lib/db";
import { runMigrations } from "../src/lib/db/migrate";

async function main() {
  const db = getDb();
  await runMigrations(db);
  console.log("Migrations applied successfully.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
