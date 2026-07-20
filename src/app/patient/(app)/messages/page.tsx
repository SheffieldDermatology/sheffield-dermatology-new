import type { Metadata } from "next";
import Link from "next/link";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientThreads } from "@/lib/patient/data";
import { formatDateTime } from "@/lib/format";
import NewMessageForm from "./NewMessageForm";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requirePatient();
  const threads = await getPatientThreads(user.patientId);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Messages</span>
        <h1>Secure messages</h1>
        <p>
          Send the clinic a secure, non-urgent message. For anything urgent, please call — this
          portal is not monitored around the clock.
        </p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Your conversations</h2>
          </div>
          {threads.length === 0 ? (
            <div className="empty-state">
              <div className="ico" aria-hidden="true">◇</div>
              <h3>No messages yet</h3>
              <p>Start a conversation using the form.</p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {threads.map((t) => (
                <li key={t.id} style={{ borderBottom: "1px solid var(--app-line)", padding: "12px 0" }}>
                  <Link href={`/patient/messages/${t.id}`} style={{ textDecoration: "none", color: "var(--app-ink)" }}>
                    <strong style={{ display: "block" }}>{t.subject}</strong>
                    <small style={{ color: "var(--app-muted)" }}>
                      {formatDateTime(t.createdAt)}
                      {t.closedAt ? " · Closed" : ""}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>New message</h2>
          </div>
          <NewMessageForm />
        </div>
      </div>
    </>
  );
}
