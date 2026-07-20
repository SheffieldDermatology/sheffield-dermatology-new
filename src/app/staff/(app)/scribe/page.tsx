import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { searchPatients } from "@/lib/staff/data";
import { audioRetentionEnabled } from "@/server/scribe";
import PermissionDenied from "@/components/app/PermissionDenied";
import { StartSessionForm } from "./ScribeForms";

export const metadata: Metadata = { title: "AI Scribe" };

const STEPS = [
  "Open the verified patient record.",
  "Explain the AI scribe and record the patient's consent (or refusal).",
  "Transcription starts only after consent.",
  "An AI draft note is produced and clearly labelled as a draft.",
  "The clinician reviews, edits and approves the note.",
  "Only the approved note is saved to the clinical record.",
];

export default async function ScribePage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "scribe.use")) {
    return <PermissionDenied what="the AI scribe" />;
  }
  const { patientId } = await searchParams;
  const [audioOn, patients] = await Promise.all([
    audioRetentionEnabled(),
    patientId ? Promise.resolve([]) : searchPatients("", 20),
  ]);

  const selectedPatient = patientId
    ? (await searchPatients("", 200)).find((p) => p.id === patientId)
    : undefined;

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Ambient documentation</span>
        <h1>AI Scribe</h1>
        <p>A consent-first workflow that drafts consultation notes for clinician review and approval.</p>
      </div>

      <div className={`alert ${audioOn ? "alert-warning" : "alert-info"}`} role="note">
        {audioOn
          ? "Audio retention is currently ENABLED. Ensure the DPIA, consent wording and retention policy cover this before use."
          : "Audio retention is OFF. This environment transcribes in real time and does not retain audio."}
      </div>

      {patientId && selectedPatient ? (
        <div className="panel">
          <div className="panel-head"><h2>Start a session</h2></div>
          <StartSessionForm patientId={patientId} patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`} />
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="panel-head"><h2>How it works</h2></div>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14 }}>
              {STEPS.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <p style={{ fontSize: 13, color: "var(--app-muted)" }}>
              The clinician remains responsible for the final note. Unreviewed AI output is never
              placed into the clinical record.
            </p>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Choose a patient</h2></div>
            {patients.length === 0 ? (
              <p style={{ color: "var(--app-muted)" }}>No patients found. Open a patient from <Link href="/staff/patients">Patients</Link>.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {patients.map((p) => (
                  <li key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--app-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{p.firstName} {p.lastName}{p.isDemo && <span className="pill pill-new" style={{ marginLeft: 8 }}>Demo</span>}</span>
                    <Link className="btn btn-ghost" href={`/staff/scribe?patientId=${p.id}`} style={{ padding: "6px 12px", fontSize: 12 }}>Select</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
