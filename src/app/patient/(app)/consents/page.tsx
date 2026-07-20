import type { Metadata } from "next";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientConsents } from "@/lib/patient/data";
import { formatDateTime, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Consents" };

const KIND_LABEL: Record<string, string> = {
  privacy: "Privacy notice",
  ai_scribe: "AI scribe",
  photography: "Medical photography",
  treatment: "Booking & cancellation terms",
  communications: "Communications",
};

export default async function ConsentsPage() {
  const user = await requirePatient();
  const consents = await getPatientConsents(user.patientId);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Consents</span>
        <h1>Your consent record</h1>
        <p>A record of the consents you have given or declined, and when.</p>
      </div>

      <div className="panel">
        {consents.length === 0 ? (
          <div className="empty-state">
            <div className="ico" aria-hidden="true">✓</div>
            <h3>No consent records yet</h3>
            <p>Consents you give — for example when booking — will be recorded here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Consent</th>
                  <th>Decision</th>
                  <th>Recorded</th>
                  <th>Version</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c) => (
                  <tr key={c.id}>
                    <td>{KIND_LABEL[c.kind] ?? statusLabel(c.kind)}</td>
                    <td>
                      <span className={`pill pill-${c.granted ? "completed" : "cancelled"}`}>
                        {c.granted ? "Given" : "Declined"}
                      </span>
                    </td>
                    <td>{formatDateTime(c.recordedAt)}</td>
                    <td style={{ fontSize: 12, color: "var(--app-muted)" }}>{c.wordingVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
