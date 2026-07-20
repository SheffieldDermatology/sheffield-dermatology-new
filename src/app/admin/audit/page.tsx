import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { verifyAuditChain } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "audit.read")) {
    return <PermissionDenied what="the audit log" />;
  }
  const db = getDb();
  const [events, integrity] = await Promise.all([
    db.select().from(auditEvents).orderBy(desc(auditEvents.id)).limit(200),
    verifyAuditChain(),
  ]);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Accountability</span>
        <h1>Audit log</h1>
        <p>An append-only, hash-chained record of important actions. Entries cannot be edited or deleted.</p>
      </div>

      <div className="panel" style={{ borderColor: integrity.ok ? "#bfe5d0" : "#e2adbc", background: integrity.ok ? "#f4f8f5" : "#fdeef1" }}>
        <strong style={{ color: integrity.ok ? "#1e6b43" : "#a6294f" }}>
          {integrity.ok
            ? `Integrity verified — ${integrity.checked} event(s), hash chain intact.`
            : `Integrity check FAILED at event #${integrity.brokenAtId}. Investigate immediately.`}
        </strong>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Recent events</h2><span className="sub">Latest 200</span></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(e.at)}</td>
                  <td style={{ fontSize: 12 }}>{e.actorType}{e.actorId ? ` (${e.actorId.slice(0, 8)})` : ""}</td>
                  <td><code style={{ fontSize: 12 }}>{e.action}</code></td>
                  <td style={{ fontSize: 12, color: "var(--app-muted)" }}>{e.entityType ? `${e.entityType}${e.entityId ? `:${String(e.entityId).slice(0, 8)}` : ""}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
