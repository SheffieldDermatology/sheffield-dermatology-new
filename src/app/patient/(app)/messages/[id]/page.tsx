import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientThreadMessages } from "@/lib/patient/data";
import { formatDateTime } from "@/lib/format";
import ReplyForm from "./ReplyForm";

export const metadata: Metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePatient();
  const { id } = await params;
  const data = await getPatientThreadMessages(user.patientId, id);
  if (!data) notFound();

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">
          <Link href="/patient/messages">← Messages</Link>
        </span>
        <h1>{data.thread.subject}</h1>
      </div>

      <div className="panel">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <li
                key={m.id}
                style={{
                  padding: "12px 14px",
                  margin: "8px 0",
                  borderRadius: 10,
                  background: mine ? "var(--app-sky-soft)" : "#f6f7fb",
                  maxWidth: "85%",
                  marginLeft: mine ? "auto" : 0,
                }}
              >
                <div style={{ fontSize: 11, color: "var(--app-muted)", marginBottom: 4 }}>
                  {mine ? "You" : "Clinic"} · {formatDateTime(m.createdAt)}
                </div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</div>
              </li>
            );
          })}
        </ul>
      </div>

      {data.thread.closedAt ? (
        <div className="panel">
          <p style={{ margin: 0, color: "var(--app-muted)", fontSize: 13 }}>
            This conversation is closed. Start a new message if you need anything else.
          </p>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <h2>Reply</h2>
          </div>
          <ReplyForm threadId={id} />
        </div>
      )}
    </>
  );
}
