/**
 * Background job queue backed by the job_queue table. Handlers live in
 * ./handlers. A single-process runner (scripts/run-jobs.ts) claims due jobs;
 * in production this is a separate worker/cron. Failures retry with
 * exponential backoff up to maxAttempts, then move to `dead` and alert admins.
 */
import { and, eq, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jobQueue, users, userRoles, notifications } from "@/lib/db/schema";
import { HANDLERS, type JobKind } from "./handlers";
import { recordAudit } from "@/lib/audit";

export async function enqueueJob(
  kind: JobKind,
  payload: Record<string, unknown> = {},
  options: { runAt?: Date; idempotencyKey?: string; maxAttempts?: number } = {},
): Promise<void> {
  const db = getDb();
  await db
    .insert(jobQueue)
    .values({
      kind,
      payload,
      runAt: options.runAt ?? new Date(),
      idempotencyKey: options.idempotencyKey ?? null,
      maxAttempts: options.maxAttempts ?? 5,
    })
    .onConflictDoNothing();
}

/** Claims up to `limit` due jobs, marking them running atomically-ish. */
async function claimDueJobs(limit: number) {
  const db = getDb();
  const due = await db
    .select()
    .from(jobQueue)
    .where(and(eq(jobQueue.status, "queued"), lte(jobQueue.runAt, new Date())))
    .orderBy(jobQueue.runAt)
    .limit(limit);

  const claimed: typeof due = [];
  for (const job of due) {
    const res = await db
      .update(jobQueue)
      .set({ status: "running", startedAt: new Date(), attempts: job.attempts + 1 })
      .where(and(eq(jobQueue.id, job.id), eq(jobQueue.status, "queued")))
      .returning({ id: jobQueue.id });
    if (res[0]) claimed.push({ ...job, attempts: job.attempts + 1 });
  }
  return claimed;
}

async function alertAdmins(title: string, body: string, linkPath?: string): Promise<void> {
  const db = getDb();
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .where(eq(userRoles.role, "system_admin"));
  for (const admin of admins) {
    await db
      .insert(notifications)
      .values({ userId: admin.id, kind: "system", title, body, linkPath: linkPath ?? null });
  }
}

/** Runs one pass over due jobs. Returns how many ran. */
export async function runJobsOnce(limit = 20): Promise<number> {
  const db = getDb();
  const jobs = await claimDueJobs(limit);
  for (const job of jobs) {
    const handler = HANDLERS[job.kind as JobKind];
    try {
      if (!handler) throw new Error(`No handler for job kind "${job.kind}"`);
      await handler(job.payload);
      await db
        .update(jobQueue)
        .set({ status: "done", finishedAt: new Date(), lastError: null })
        .where(eq(jobQueue.id, job.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (job.attempts >= job.maxAttempts) {
        await db
          .update(jobQueue)
          .set({ status: "dead", finishedAt: new Date(), lastError: message })
          .where(eq(jobQueue.id, job.id));
        await recordAudit({
          actorType: "system",
          action: "jobs.dead",
          entityType: "job",
          entityId: job.id,
          detail: { kind: job.kind, error: message },
        });
        await alertAdmins(
          "A background job failed permanently",
          `Job "${job.kind}" failed after ${job.attempts} attempts: ${message}`,
          "/admin/integrations",
        );
      } else {
        // Exponential backoff: 2^attempts minutes.
        const delayMs = 2 ** job.attempts * 60 * 1000;
        await db
          .update(jobQueue)
          .set({
            status: "queued",
            runAt: new Date(Date.now() + delayMs),
            lastError: message,
          })
          .where(eq(jobQueue.id, job.id));
      }
    }
  }
  return jobs.length;
}

/** Enqueues the periodic housekeeping jobs (idempotent per hour). */
export async function enqueueHousekeeping(hourKey: string): Promise<void> {
  await enqueueJob("purge_rate_limits", {}, { idempotencyKey: `purge_rate_limits:${hourKey}` });
  await enqueueJob("purge_expired_holds", {}, { idempotencyKey: `purge_expired_holds:${hourKey}` });
  await enqueueJob(
    "escalate_overdue_tasks",
    {},
    { idempotencyKey: `escalate_overdue_tasks:${hourKey}` },
  );
  await enqueueJob(
    "integration_health_check",
    {},
    { idempotencyKey: `integration_health_check:${hourKey}` },
  );
}

export { sql };
