import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getPatientRecord } from "@/lib/staff/data";
import { formatDateTime, formatDate, visitTypeLabel, statusLabel } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Patient record" };

export default async function StaffPatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "patients.read")) {
    return <PermissionDenied what="patient records" />;
  }
  const { id } = await params;
  const record = await getPatientRecord(id);
  if (!record) notFound();

  const canScribe = rolesHavePermission(user.roles, "scribe.use");
  const canClinical = rolesHavePermission(user.roles, "clinical_notes.read");
  const { patient, appointments, documents } = record;

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">
          <Link href="/staff/patients">← Patients</Link>
        </span>
        <h1>
          {patient.firstName} {patient.lastName}
          {patient.isDemo && <span className="pill pill-new" style={{ marginLeft: 10, verticalAlign: "middle" }}>Demo</span>}
        </h1>
        <p>
          {patient.email ?? "No email"} · {patient.phone ?? "No phone"}
          {patient.dateOfBirth ? ` · DOB ${formatDate(new Date(patient.dateOfBirth))}` : ""}
        </p>
      </div>

      {canScribe && (
        <div className="btn-row" style={{ marginBottom: 20 }}>
          <Link className="btn btn-primary" href={`/staff/scribe?patientId=${patient.id}`}>
            ◉ Start AI scribe
          </Link>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h2>Appointments</h2>
        </div>
        {appointments.length === 0 ? (
          <div className="empty-state"><div className="ico" aria-hidden="true">□</div><h3>No appointments</h3></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>When</th><th>Appointment</th><th>With</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.startsAt)}</td>
                    <td>{a.serviceName}</td>
                    <td>{a.clinicianName}</td>
                    <td>{visitTypeLabel(a.visitType)}</td>
                    <td><span className={`pill pill-${a.status}`}>{statusLabel(a.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Documents</h2>
        </div>
        {documents.length === 0 ? (
          <div className="empty-state"><div className="ico" aria-hidden="true">▱</div><h3>No documents</h3></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>File</th><th>Kind</th><th>Status</th><th>Added</th></tr></thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.fileName}</td>
                    <td>{d.kind.replace(/_/g, " ")}</td>
                    <td><span className={`pill pill-${d.status === "approved" ? "confirmed" : "requested"}`}>{statusLabel(d.status)}</span></td>
                    <td>{formatDate(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <p style={{ margin: 0, fontSize: 13, color: "var(--app-muted)" }}>
          {canClinical
            ? "Clinical notes are held in the connected clinical system of record (Semble). Consultation notes are not duplicated in this workspace."
            : "You do not have permission to view clinical notes. Contact a clinical administrator if you need access."}
        </p>
      </div>
    </>
  );
}
