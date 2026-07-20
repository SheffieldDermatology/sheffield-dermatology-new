import type { Metadata } from "next";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientVisibleDocuments } from "@/lib/patient/data";
import { formatDate } from "@/lib/format";
import UploadForm from "./UploadForm";

export const metadata: Metadata = { title: "Documents" };

const KIND_LABEL: Record<string, string> = {
  patient_upload: "Your upload",
  clinic_letter: "Clinic letter",
  result: "Result",
  invoice_pdf: "Invoice",
  form_attachment: "Form attachment",
};

export default async function DocumentsPage() {
  const user = await requirePatient();
  const docs = await getPatientVisibleDocuments(user.patientId);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Documents</span>
        <h1>Your documents</h1>
        <p>
          Upload photographs or documents the clinic has requested, and view letters and results
          once your clinician has released them to you.
        </p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Upload a file</h2>
        </div>
        <UploadForm />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Your files</h2>
          <span className="sub">{docs.length} item(s)</span>
        </div>
        {docs.length === 0 ? (
          <div className="empty-state">
            <div className="ico" aria-hidden="true">▱</div>
            <h3>No documents yet</h3>
            <p>Files you upload and documents released to you will appear here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Added</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.fileName}</td>
                    <td>{KIND_LABEL[d.kind] ?? d.kind}</td>
                    <td>{formatDate(d.createdAt)}</td>
                    <td>
                      {d.kind === "patient_upload" ? (
                        <span className={`pill pill-${d.status === "approved" ? "confirmed" : "requested"}`}>
                          {d.status === "pending_review" ? "Awaiting review" : d.status}
                        </span>
                      ) : (
                        <span className="pill pill-completed">Available</span>
                      )}
                    </td>
                    <td>
                      {d.kind !== "patient_upload" ? (
                        <a
                          className="btn btn-ghost"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                          href={`/patient/documents/${d.id}/download`}
                        >
                          Download
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--app-muted)" }}>
                          {(d.sizeBytes / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 14 }}>
          Uploaded files are stored securely and reviewed by the clinic. Please do not upload
          anything urgent — this portal is not monitored around the clock.
        </p>
      </div>
    </>
  );
}
