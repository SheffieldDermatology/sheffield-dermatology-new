import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { scribeNotes, patients, users } from "@/lib/db/schema";
import { getScribeSession } from "@/lib/staff/data";
import { formatDateTime } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";
import { ConsentPanel, DraftPanel, ApprovePanel, StopButton } from "../ScribeForms";

export const metadata: Metadata = { title: "Scribe session" };

const CAPTURING_STATUSES = ["recording"];

export default async function ScribeSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "scribe.use")) {
    return <PermissionDenied what="the AI scribe" />;
  }
  const { sessionId } = await params;
  const session = await getScribeSession(sessionId);
  if (!session) notFound();

  const db = getDb();
  const [patient] = await db.select().from(patients).where(eq(patients.id, session.patientId)).limit(1);
  const [note] = await db.select().from(scribeNotes).where(eq(scribeNotes.sessionId, sessionId)).limit(1);
  const canApprove = rolesHavePermission(user.roles, "scribe.approve");
  const isCapturing = CAPTURING_STATUSES.includes(session.status);
  const consentGiven = ["ready", "recording", "processing", "draft_ready", "approved"].includes(session.status);
  const draftText = note?.editedText ?? note?.draftText ?? "";

  let approver: string | null = null;
  if (note?.approvedBy) {
    const [a] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, note.approvedBy)).limit(1);
    approver = a?.name ?? null;
  }

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">AI Scribe session</span>
        <h1>{patient ? `${patient.firstName} ${patient.lastName}` : "Session"}</h1>
        <p>Status: <span className={`pill pill-${session.status === "approved" ? "completed" : "requested"}`}>{session.status.replace(/_/g, " ")}</span></p>
      </div>

      {/* Unmissable capture indicator */}
      <div
        className="panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderColor: isCapturing ? "#d76c8d" : "var(--app-line)",
          background: isCapturing ? "#fdeef1" : "#f4f8f5",
        }}
      >
        <strong style={{ color: isCapturing ? "#a6294f" : "#1e6b43", fontSize: 15 }}>
          {isCapturing ? "● Capturing — transcription in progress" : "○ Not capturing"}
        </strong>
        {session.status !== "approved" && session.status !== "consent_declined" && session.status !== "abandoned" && (
          <StopButton sessionId={session.id} />
        )}
      </div>

      {session.status === "awaiting_consent" && (
        <div className="panel">
          <div className="panel-head"><h2>Record consent</h2></div>
          <ConsentPanel sessionId={session.id} />
        </div>
      )}

      {session.status === "consent_declined" && (
        <div className="panel">
          <div className="alert alert-info" role="note">
            The patient declined the AI scribe. Documentation will be completed manually. Their care
            is unaffected.
          </div>
        </div>
      )}

      {consentGiven && session.status !== "approved" && (
        <div className="panel">
          <div className="panel-head"><h2>Draft note</h2></div>
          <DraftPanel sessionId={session.id} existingDraft={note?.draftText ?? ""} />
        </div>
      )}

      {note && session.status !== "approved" && session.status === "draft_ready" && (
        <div className="panel">
          <div className="panel-head"><h2>Review &amp; approve</h2></div>
          <ApprovePanel sessionId={session.id} draft={draftText} canApprove={canApprove} />
        </div>
      )}

      {session.status === "approved" && note && (
        <div className="panel">
          <div className="panel-head"><h2>Approved note</h2></div>
          <div className="alert alert-success" role="status">
            Approved{approver ? ` by ${approver}` : ""}{note.approvedAt ? ` on ${formatDateTime(note.approvedAt)}` : ""}.
            {note.savedToEhrAt ? " Saved to the clinical record." : " Stored securely; will be written to the record once Semble is connected."}
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, background: "#f7f8fb", borderRadius: 10, padding: 16 }}>
            {note.editedText ?? note.draftText}
          </div>
        </div>
      )}
    </>
  );
}
