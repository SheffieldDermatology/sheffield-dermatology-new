/**
 * Background jobs runner. Runs a pass every 15 seconds and enqueues periodic
 * housekeeping once per hour. In production this runs as a separate process
 * (systemd service or platform worker) — see DEPLOYMENT.md.
 *
 *   npm run jobs:run
 */
import { runJobsOnce, enqueueHousekeeping } from "../src/lib/jobs";

const INTERVAL_MS = 15_000;
let running = true;

function currentHourKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}`;
}

async function loop() {
  let lastHourKey = "";
  while (running) {
    try {
      const hourKey = currentHourKey();
      if (hourKey !== lastHourKey) {
        await enqueueHousekeeping(hourKey);
        lastHourKey = hourKey;
      }
      const ran = await runJobsOnce(25);
      if (ran > 0) console.log(`[jobs] processed ${ran} job(s)`);
    } catch (error) {
      console.error("[jobs] pass failed:", error);
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

process.on("SIGINT", () => {
  console.log("\n[jobs] shutting down…");
  running = false;
  setTimeout(() => process.exit(0), 200);
});

console.log("[jobs] runner started (Ctrl+C to stop)");
loop();
