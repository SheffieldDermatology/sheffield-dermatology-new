/**
 * Notification layer: in-app notifications plus an email/SMS outbox.
 *
 * PRINCIPLE — minimal information leaves the secure portal. Email and SMS
 * bodies contain no clinical detail and no appointment specifics beyond the
 * bare minimum; they direct the recipient to sign in to the secure portal.
 * This is enforced by building every message from a template here rather than
 * letting callers pass arbitrary bodies.
 */
import { getDb } from "@/lib/db";
import { outboxEmail, outboxSms, notifications } from "@/lib/db/schema";
import { enqueueJob } from "@/lib/jobs";
import { env } from "@/lib/env";

const PORTAL_URL = `${env.APP_ORIGIN}/patient`;

type EmailTemplate = { subject: string; body: string };

/**
 * Email templates. Interpolated values are limited to the recipient's first
 * name and safe, non-clinical scheduling words. No diagnosis, service detail
 * or document content ever appears here.
 */
export const EMAIL_TEMPLATES = {
  booking_request_received: (p: { firstName: string }): EmailTemplate => ({
    subject: "We've received your appointment request",
    body: `Dear ${p.firstName},\n\nThank you — we have received your appointment request. The clinic will confirm the details shortly.\n\nYou can view the status any time by signing in to the secure patient portal:\n${PORTAL_URL}\n\nPlease do not reply to this email with medical information.\n\nSheffield Dermatology`,
  }),
  booking_confirmed: (p: { firstName: string }): EmailTemplate => ({
    subject: "Your appointment is confirmed",
    body: `Dear ${p.firstName},\n\nYour appointment is confirmed. The date, time and joining details (for video visits) are in the secure patient portal:\n${PORTAL_URL}\n\nPlease sign in to view or change your appointment.\n\nSheffield Dermatology`,
  }),
  booking_cancelled: (p: { firstName: string }): EmailTemplate => ({
    subject: "Your appointment has been cancelled",
    body: `Dear ${p.firstName},\n\nYour appointment has been cancelled. If you did not request this, or would like to rebook, please sign in to the secure patient portal:\n${PORTAL_URL}\n\nSheffield Dermatology`,
  }),
  appointment_reminder: (p: { firstName: string }): EmailTemplate => ({
    subject: "A reminder about your upcoming appointment",
    body: `Dear ${p.firstName},\n\nThis is a reminder about your upcoming appointment. The details are in the secure patient portal:\n${PORTAL_URL}\n\nIf you need to change it, please do so as early as you can.\n\nSheffield Dermatology`,
  }),
  portal_invite: (p: { firstName: string; link: string }): EmailTemplate => ({
    subject: "Access your Sheffield Dermatology patient portal",
    body: `Dear ${p.firstName},\n\nYou have been invited to the Sheffield Dermatology patient portal. To set up access, use this link (valid for a limited time):\n${p.link}\n\nSheffield Dermatology`,
  }),
  password_reset: (p: { link: string }): EmailTemplate => ({
    subject: "Sheffield Dermatology — password reset",
    body: `A password reset was requested for your account. To choose a new password, use this link (valid for 30 minutes):\n${p.link}\n\nIf you did not request this, you can ignore this email.\n\nSheffield Dermatology`,
  }),
  message_received: (p: { firstName: string }): EmailTemplate => ({
    subject: "You have a new secure message",
    body: `Dear ${p.firstName},\n\nYou have a new secure message from the clinic. For your privacy, the message is only available in the secure patient portal:\n${PORTAL_URL}\n\nSheffield Dermatology`,
  }),
} as const;

/** SMS templates — even shorter, and never clinical. */
export const SMS_TEMPLATES = {
  booking_confirmed: (): string =>
    "Sheffield Dermatology: your appointment is confirmed. Sign in to the patient portal for details. Do not reply with medical info.",
  appointment_reminder: (): string =>
    "Sheffield Dermatology: a reminder about your upcoming appointment. See the patient portal for details.",
  task_assigned: (): string => "Sheffield Dermatology: you have a new task in the staff workspace.",
} as const;

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;
export type SmsTemplateKey = keyof typeof SMS_TEMPLATES;

/** Queues an email built from a template and schedules a send job. */
export async function queueEmail(
  to: string,
  templateKey: EmailTemplateKey,
  params: Record<string, string>,
): Promise<void> {
  const db = getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const built = (EMAIL_TEMPLATES[templateKey] as (p: any) => EmailTemplate)(params);
  const [row] = await db
    .insert(outboxEmail)
    .values({
      toEmail: to,
      subject: built.subject,
      bodyText: built.body,
      templateKey,
    })
    .returning({ id: outboxEmail.id });
  if (row) await enqueueJob("send_email", { outboxId: row.id });
}

export async function queueSms(to: string, templateKey: SmsTemplateKey): Promise<void> {
  const db = getDb();
  const body = SMS_TEMPLATES[templateKey]();
  const [row] = await db
    .insert(outboxSms)
    .values({ toPhone: to, body, templateKey })
    .returning({ id: outboxSms.id });
  if (row) await enqueueJob("send_sms", { outboxId: row.id });
}

/** In-app notification for a signed-in user. */
export async function notifyUser(
  userId: string,
  kind: string,
  title: string,
  body: string,
  linkPath?: string,
): Promise<void> {
  const db = getDb();
  await db.insert(notifications).values({ userId, kind, title, body, linkPath: linkPath ?? null });
}
