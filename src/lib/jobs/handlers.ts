/**
 * Job handlers. Each is idempotent-friendly and throws on failure so the
 * runner can retry with backoff.
 */
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  outboxEmail,
  outboxSms,
  bookingHolds,
  tasks,
  notifications,
} from "@/lib/db/schema";
import { createEmailProvider } from "@/adapters/email";
import { createSmsProvider } from "@/adapters/sms";
import { purgeExpiredRateLimits } from "@/lib/security/rate-limit";
import { checkAllIntegrations } from "@/lib/integrations/health";

export type JobPayload = Record<string, unknown>;
export type JobHandler = (payload: JobPayload) => Promise<void>;

const sendEmail: JobHandler = async (payload) => {
  const outboxId = payload.outboxId as string;
  const db = getDb();
  const rows = await db.select().from(outboxEmail).where(eq(outboxEmail.id, outboxId)).limit(1);
  const row = rows[0];
  if (!row || row.status === "sent") return;

  const provider = createEmailProvider();
  const messageId = await provider.send({
    to: row.toEmail,
    subject: row.subject,
    bodyText: row.bodyText,
    templateKey: row.templateKey,
  });
  if (messageId === null) {
    // Development/disabled provider: captured in outbox, nothing sent.
    await db
      .update(outboxEmail)
      .set({ status: "suppressed", attempts: row.attempts + 1 })
      .where(eq(outboxEmail.id, outboxId));
    return;
  }
  await db
    .update(outboxEmail)
    .set({ status: "sent", sentAt: new Date(), providerMessageId: messageId, attempts: row.attempts + 1 })
    .where(eq(outboxEmail.id, outboxId));
};

const sendSms: JobHandler = async (payload) => {
  const outboxId = payload.outboxId as string;
  const db = getDb();
  const rows = await db.select().from(outboxSms).where(eq(outboxSms.id, outboxId)).limit(1);
  const row = rows[0];
  if (!row || row.status === "sent") return;

  const provider = createSmsProvider();
  const messageId = await provider.send({
    to: row.toPhone,
    body: row.body,
    templateKey: row.templateKey,
  });
  if (messageId === null) {
    await db
      .update(outboxSms)
      .set({ status: "suppressed", attempts: row.attempts + 1 })
      .where(eq(outboxSms.id, outboxId));
    return;
  }
  await db
    .update(outboxSms)
    .set({ status: "sent", sentAt: new Date(), providerMessageId: messageId, attempts: row.attempts + 1 })
    .where(eq(outboxSms.id, outboxId));
};

const purgeRateLimits: JobHandler = async () => {
  await purgeExpiredRateLimits();
};

const purgeExpiredHolds: JobHandler = async () => {
  const db = getDb();
  await db.delete(bookingHolds).where(lt(bookingHolds.expiresAt, new Date()));
};

const escalateOverdueTasks: JobHandler = async () => {
  const db = getDb();
  const now = new Date();
  const overdue = await db
    .select()
    .from(tasks)
    .where(
      and(
        or(eq(tasks.status, "open"), eq(tasks.status, "in_progress")),
        lt(tasks.dueAt, now),
        isNull(tasks.escalatedAt),
      ),
    );
  for (const task of overdue) {
    await db.update(tasks).set({ escalatedAt: now }).where(eq(tasks.id, task.id));
    if (task.assigneeId) {
      await db.insert(notifications).values({
        userId: task.assigneeId,
        kind: "task_escalated",
        title: "Overdue task",
        body: `The task "${task.title}" is overdue.`,
        linkPath: "/staff/tasks",
      });
    }
  }
};

const integrationHealthCheck: JobHandler = async () => {
  await checkAllIntegrations();
};

// The Semble sync handler is reconciliation-only and a documented no-op until
// Semble is connected; it lives here so webhook events can enqueue it safely.
const sembleSync: JobHandler = async () => {
  const { reconcileAppointments } = await import("@/lib/integrations/reconcile");
  await reconcileAppointments();
};

export const HANDLERS = {
  send_email: sendEmail,
  send_sms: sendSms,
  purge_rate_limits: purgeRateLimits,
  purge_expired_holds: purgeExpiredHolds,
  escalate_overdue_tasks: escalateOverdueTasks,
  integration_health_check: integrationHealthCheck,
  semble_sync: sembleSync,
} satisfies Record<string, JobHandler>;

export type JobKind = keyof typeof HANDLERS;
