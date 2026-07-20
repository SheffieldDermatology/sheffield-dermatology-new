import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { messageThreads, messages, threadParticipants, users } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";
import StaffReplyForm from "./StaffReplyForm";

export const metadata: Metadata = { title: "Conversation" };

export default async function StaffThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "messages.staff")) {
    return <PermissionDenied what="internal messages" />;
  }
  const { id } = await params;
  const db = getDb();

  const participates = await db
    .select({ userId: threadParticipants.userId })
    .from(threadParticipants)
    .where(and(eq(threadParticipants.threadId, id), eq(threadParticipants.userId, user.id)))
    .limit(1);
  if (!participates[0]) {
    return <PermissionDenied what="this conversation" backHref="/staff/messages" />;
  }

  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, id)).limit(1);
  if (!thread || thread.kind !== "staff") {
    return <PermissionDenied what="this conversation" backHref="/staff/messages" />;
  }
  const msgs = await db
    .select({ id: messages.id, body: messages.body, createdAt: messages.createdAt, senderId: messages.senderId, senderName: users.displayName })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.threadId, id))
    .orderBy(messages.createdAt);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app"><Link href="/staff/messages">← Messages</Link></span>
        <h1>{thread.subject}</h1>
      </div>

      <div className="panel">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {msgs.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <li key={m.id} style={{ padding: "12px 14px", margin: "8px 0", borderRadius: 10, background: mine ? "var(--app-sky-soft)" : "#f6f7fb", maxWidth: "85%", marginLeft: mine ? "auto" : 0 }}>
                <div style={{ fontSize: 11, color: "var(--app-muted)", marginBottom: 4 }}>
                  {m.senderName ?? "Unknown"} · {formatDateTime(m.createdAt)}
                </div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Reply</h2></div>
        <StaffReplyForm threadId={id} />
      </div>
    </>
  );
}
