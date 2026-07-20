import type { Metadata } from "next";
import Link from "next/link";
import { requirePatient } from "@/lib/auth/guards";
import {
  getPatientProfile,
  getPatientAppointments,
  getPatientDashboardCounts,
} from "@/lib/patient/data";
import { formatDateTime, visitTypeLabel, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function PatientHome() {
  const user = await requirePatient();
  const [profile, { upcoming }, counts] = await Promise.all([
    getPatientProfile(user.patientId),
    getPatientAppointments(user.patientId),
    getPatientDashboardCounts(user.patientId),
  ]);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Your portal</span>
        <h1>Hello{profile ? `, ${profile.firstName}` : ""}.</h1>
        <p>Manage your appointments, documents and messages securely in one place.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="label">Upcoming appointments</div>
          <div className="value">{counts.upcomingCount}</div>
          <div className="meta">
            {counts.nextAppointment
              ? `Next: ${formatDateTime(counts.nextAppointment.startsAt)}`
              : "None booked"}
          </div>
        </div>
        <div className="stat">
          <div className="label">Outstanding invoices</div>
          <div className="value">{counts.unpaidCount}</div>
          <div className="meta">
            <Link href="/patient/invoices">View invoices</Link>
          </div>
        </div>
        <div className="stat">
          <div className="label">Need an appointment?</div>
          <div className="value" style={{ fontSize: 20, marginTop: 10 }}>
            <Link className="btn btn-primary" href="/book">
              Book now
            </Link>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Upcoming appointments</h2>
          <Link className="sub" href="/patient/appointments">
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="ico" aria-hidden="true">
              □
            </div>
            <h3>No upcoming appointments</h3>
            <p>When you book, your appointments will appear here.</p>
            <Link className="btn btn-primary" href="/book" style={{ marginTop: 12 }}>
              Book an appointment
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Appointment</th>
                  <th>With</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.startsAt)}</td>
                    <td>{a.serviceName}</td>
                    <td>{a.clinicianName}</td>
                    <td>{visitTypeLabel(a.visitType)}</td>
                    <td>
                      <span className={`pill pill-${a.status}`}>{statusLabel(a.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <p style={{ margin: 0, fontSize: 13, color: "var(--app-muted)" }}>
          <strong>This portal is not monitored for urgent problems.</strong> In an emergency call
          999; for urgent advice that is not an emergency call NHS 111. See{" "}
          <Link href="/urgent-help">urgent medical help</Link>.
        </p>
      </div>
    </>
  );
}
