import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { messageThreads, threadParticipants } from "@/lib/db/schema";
import { getStaffUsers } from "@/lib/staff/data";
import { formatDateTime } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";
import NewStaffThreadForm from "./NewStaffThreadForm";

export const metadata: Metadata = { title: "Messages" };

export default async function StaffMessagesPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "messages.staff")) {
    return <PermissionDenied what="internal messages" />;
  }
  const db = getDb();
  const threads = await db
    .select({ id: messageThreads.id, subject: messageThreads.subject, createdAt: messageThreads.createdAt })
    .from(messageThreads)
    .innerJoin(threadParticipants, eq(threadParticipants.threadId, messageThreads.id))
    .where(and(eq(messageThreads.kind, "staff"), eq(threadParticipants.userId, user.id)))
    .orderBy(desc(messageThreads.createdAt));
  const staff = (await getStaffUsers()).filter((s) => s.id !== user.id);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Internal</span>
        <h1>Staff messages</h1>
        <p>Internal team messaging. This is separate from patient messaging — never share patient-facing communication here.</p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head"><h2>Your conversations</h2></div>
          {threads.length === 0 ? (
            <div className="empty-state"><div className="ico" aria-hidden="true">◇</div><h3>No conversations</h3><p>Start one using the form.</p></div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {threads.map((t) => (
                <li key={t.id} style={{ borderBottom: "1px solid var(--app-line)", padding: "12px 0" }}>
                  <Link href={`/staff/messages/${t.id}`} style={{ textDecoration: "none", color: "var(--app-ink)" }}>
                    <strong style={{ display: "block" }}>{t.subject}</strong>
                    <small style={{ color: "var(--app-muted)" }}>{formatDateTime(t.createdAt)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>New message</h2></div>
          <NewStaffThreadForm staff={staff} />
        </div>
      </div>
    </>
  );
}
