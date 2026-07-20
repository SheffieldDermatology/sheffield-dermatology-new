"use server";

/**
 * Internal STAFF messaging — kept separate from patient messaging. Only
 * participants can read or reply. Permission: messages.staff.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { messageThreads, messages, threadParticipants, notifications } from "@/lib/db/schema";
import { requirePermission, auditAction } from "@/lib/auth/guards";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export type StaffMsgState = { ok?: boolean; error?: string };

const createSchema = z.object({
  subject: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(4000),
  participantIds: z.array(z.string().uuid()).optional(),
});

export async function createStaffThread(_prev: StaffMsgState, formData: FormData): Promise<StaffMsgState> {
  const user = await requirePermission("messages.staff");
  const participantIds = formData.getAll("participantIds").filter((v): v is string => typeof v === "string");
  const parsed = createSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    participantIds,
  });
  if (!parsed.success) return { error: "Please enter a subject and message." };
  if (!(await checkRateLimit(RATE_LIMITS.messaging, `staffmsg:${user.id}`))) {
    return { error: "Too many messages recently. Please wait a moment." };
  }

  const db = getDb();
  const [thread] = await db
    .insert(messageThreads)
    .values({ kind: "staff", subject: parsed.data.subject, createdBy: user.id })
    .returning({ id: messageThreads.id });

  const uniqueParticipants = new Set([user.id, ...(parsed.data.participantIds ?? [])]);
  for (const pid of uniqueParticipants) {
    await db.insert(threadParticipants).values({ threadId: thread!.id, userId: pid }).onConflictDoNothing();
  }
  await db.insert(messages).values({ threadId: thread!.id, senderId: user.id, body: parsed.data.body });

  for (const pid of uniqueParticipants) {
    if (pid === user.id) continue;
    await db.insert(notifications).values({
      userId: pid,
      kind: "staff_message",
      title: "New internal message",
      body: parsed.data.subject,
      linkPath: `/staff/messages/${thread!.id}`,
    });
  }
  await auditAction(user, "staff.thread_created", "message_thread", thread!.id);
  redirect(`/staff/messages/${thread!.id}`);
}

export async function replyStaffThread(_prev: StaffMsgState, formData: FormData): Promise<StaffMsgState> {
  const user = await requirePermission("messages.staff");
  const threadId = z.string().uuid().safeParse(formData.get("threadId"));
  const body = z.string().trim().min(1).max(4000).safeParse(formData.get("body"));
  if (!threadId.success || !body.success) return { error: "Please enter a message." };

  const db = getDb();
  const participates = await db
    .select({ userId: threadParticipants.userId })
    .from(threadParticipants)
    .where(and(eq(threadParticipants.threadId, threadId.data), eq(threadParticipants.userId, user.id)))
    .limit(1);
  if (!participates[0]) return { error: "You are not a participant in this conversation." };

  await db.insert(messages).values({ threadId: threadId.data, senderId: user.id, body: body.data });
  await auditAction(user, "staff.thread_replied", "message_thread", threadId.data);
  revalidatePath(`/staff/messages/${threadId.data}`);
  return { ok: true };
}
