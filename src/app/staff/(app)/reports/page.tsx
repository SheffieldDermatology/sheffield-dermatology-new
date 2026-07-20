import type { Metadata } from "next";
import { and, gte, inArray, lt, eq, isNull, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { appointments, tasks, documents } from "@/lib/db/schema";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "reports.operational")) {
    return <PermissionDenied what="reports" />;
  }
  const db = getDb();
  const since = new Date(Date.now() - 30 * 86400_000);

  const byStatus = await db
    .select({ status: appointments.status, n: sql<number>`count(*)` })
    .from(appointments)
    .where(gte(appointments.startsAt, since))
    .groupBy(appointments.status);

  const [pendingRequests] = await db
    .select({ n: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.status, "requested"));
  const [openTasks] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tasks)
    .where(inArray(tasks.status, ["open", "in_progress"]));
  const [overdueTasks] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tasks)
    .where(and(inArray(tasks.status, ["open", "in_progress"]), lt(tasks.dueAt, new Date())));
  const [pendingDocs] = await db
    .select({ n: sql<number>`count(*)` })
    .from(documents)
    .where(and(eq(documents.status, "pending_review"), isNull(documents.deletedAt)));

  const noShow = Number(byStatus.find((s) => s.status === "no_show")?.n ?? 0);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Operations</span>
        <h1>Reports</h1>
        <p>Operational metrics for the last 30 days. No patient-identifying detail is shown here.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat"><div className="label">Appointment requests pending</div><div className="value">{Number(pendingRequests?.n ?? 0)}</div></div>
        <div className="stat"><div className="label">Open tasks</div><div className="value">{Number(openTasks?.n ?? 0)}</div><div className="meta">{Number(overdueTasks?.n ?? 0)} overdue</div></div>
        <div className="stat"><div className="label">Documents awaiting review</div><div className="value">{Number(pendingDocs?.n ?? 0)}</div></div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Appointments by status (30 days)</h2></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Status</th><th>Count</th></tr></thead>
            <tbody>
              {byStatus.length === 0 ? (
                <tr><td colSpan={2} style={{ color: "var(--app-muted)" }}>No appointments in the last 30 days.</td></tr>
              ) : (
                byStatus.map((s) => (
                  <tr key={s.status}><td style={{ textTransform: "capitalize" }}>{s.status.replace(/_/g, " ")}</td><td>{Number(s.n)}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 12 }}>
          No-shows in period: {noShow}. Richer clinical and financial reporting connects after
          information-governance review.
        </p>
      </div>
    </>
  );
}
