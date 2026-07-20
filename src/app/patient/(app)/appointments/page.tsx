import type { Metadata } from "next";
import Link from "next/link";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientAppointments } from "@/lib/patient/data";
import { formatDateTime, visitTypeLabel, statusLabel } from "@/lib/format";
import CancelAppointmentButton from "./CancelAppointmentButton";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const user = await requirePatient();
  const { upcoming, past } = await getPatientAppointments(user.patientId);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Appointments</span>
        <h1>Your appointments</h1>
        <p>Review, cancel or book appointments. To move an appointment, cancel and rebook.</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Upcoming</h2>
          <Link className="btn btn-primary" href="/book">
            Book new
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="ico" aria-hidden="true">□</div>
            <h3>No upcoming appointments</h3>
            <p>Book an appointment and it will appear here.</p>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.startsAt)}</td>
                    <td>{a.serviceName}</td>
                    <td>{a.clinicianName}</td>
                    <td>{visitTypeLabel(a.visitType)}</td>
                    <td>
                      <span className={`pill pill-${a.status}`}>{statusLabel(a.status)}</span>
                    </td>
                    <td>
                      <CancelAppointmentButton appointmentId={a.id} startsAt={a.startsAt.toISOString()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Past &amp; cancelled</h2>
        </div>
        {past.length === 0 ? (
          <p style={{ color: "var(--app-muted)", fontSize: 13 }}>No past appointments yet.</p>
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
                {past.map((a) => (
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
    </>
  );
}
