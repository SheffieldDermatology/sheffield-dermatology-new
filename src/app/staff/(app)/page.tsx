import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDashboardMetrics, getTodaySchedule, getTasks } from "@/lib/staff/data";
import { formatTime, visitTypeLabel, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function StaffOverview() {
  const user = await requireStaff();
  const canReadAppts = rolesHavePermission(user.roles, "appointments.read");
  const canReadTasks = rolesHavePermission(user.roles, "tasks.read");

  const [metrics, schedule, myTasks] = await Promise.all([
    getDashboardMetrics(),
    canReadAppts ? getTodaySchedule() : Promise.resolve([]),
    canReadTasks ? getTasks({ status: "open" }) : Promise.resolve([]),
  ]);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">
          {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }).format(new Date())}
        </span>
        <h1>
          {greeting}, {user.displayName.split(" ")[0]}.
        </h1>
        <p>Here is what is happening across the clinic today.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="label">Appointments today</div>
          <div className="value">{metrics.todayAppointments}</div>
          <div className="meta">
            <Link href="/staff/calendar">View calendar</Link>
          </div>
        </div>
        <div className="stat">
          <div className="label">Appointment requests</div>
          <div className="value">{metrics.pendingRequests}</div>
          <div className="meta">Awaiting confirmation</div>
        </div>
        <div className="stat">
          <div className="label">Open tasks</div>
          <div className="value">{metrics.openTasks}</div>
          <div className="meta">
            {canReadTasks ? <Link href="/staff/tasks">View tasks</Link> : "—"}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {canReadAppts && (
          <div className="panel">
            <div className="panel-head">
              <h2>Today&rsquo;s schedule</h2>
              <Link className="sub" href="/staff/calendar">
                Full calendar →
              </Link>
            </div>
            {schedule.length === 0 ? (
              <div className="empty-state">
                <div className="ico" aria-hidden="true">□</div>
                <h3>No appointments today</h3>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {schedule.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 0",
                      borderBottom: "1px solid var(--app-line)",
                    }}
                  >
                    <strong style={{ minWidth: 52 }}>{formatTime(a.startsAt)}</strong>
                    <div style={{ flex: 1 }}>
                      <Link
                        href={`/staff/patients/${a.patientId}`}
                        style={{ color: "var(--app-ink)", textDecoration: "none", fontWeight: 600 }}
                      >
                        {a.patientFirst} {a.patientLast}
                      </Link>
                      <div style={{ fontSize: 12, color: "var(--app-muted)" }}>
                        {a.serviceName} · {visitTypeLabel(a.visitType)}
                      </div>
                    </div>
                    <span className={`pill pill-${a.status}`}>{statusLabel(a.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {canReadTasks && (
          <div className="panel">
            <div className="panel-head">
              <h2>Open tasks</h2>
              <Link className="sub" href="/staff/tasks">
                All tasks →
              </Link>
            </div>
            {myTasks.length === 0 ? (
              <div className="empty-state">
                <div className="ico" aria-hidden="true">✓</div>
                <h3>No open tasks</h3>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {myTasks.slice(0, 6).map((t) => (
                  <li
                    key={t.id}
                    style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--app-line)" }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong>{t.title}</strong>
                      <div style={{ fontSize: 12, color: "var(--app-muted)" }}>
                        {t.assigneeName ? `Assigned to ${t.assigneeName}` : t.teamRole ? `Team: ${t.teamRole}` : "Unassigned"}
                        {t.dueAt ? ` · Due ${formatTime(t.dueAt)}` : ""}
                      </div>
                    </div>
                    {(t.priority === "urgent" || t.priority === "high") && (
                      <span className={`pill pill-${t.priority}`}>{t.priority}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
