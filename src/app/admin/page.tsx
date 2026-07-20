import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { ownerInputs, integrationState } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminOverview() {
  const user = await requireStaff();
  const db = getDb();

  const blockers = await db
    .select({ key: ownerInputs.key, title: ownerInputs.title, section: ownerInputs.section })
    .from(ownerInputs)
    .where(and(eq(ownerInputs.blocksProduction, true), inArray(ownerInputs.status, ["missing", "partial"])));
  const integrations = await db.select().from(integrationState);

  const cards = [
    { href: "/admin/setup", label: "Setup checklist", desc: "Owner inputs required before go-live", perm: "settings.manage" as const },
    { href: "/admin/users", label: "Users & roles", desc: "Accounts, roles and access", perm: "users.manage" as const },
    { href: "/admin/services", label: "Services & fees", desc: "Service list, durations and prices", perm: "settings.manage" as const },
    { href: "/admin/settings", label: "Clinic settings", desc: "Contact details and clinic information", perm: "settings.manage" as const },
    { href: "/admin/flags", label: "Feature flags", desc: "Toggle features safely", perm: "flags.manage" as const },
    { href: "/admin/integrations", label: "Integrations", desc: "Semble, Heidi, payments, email, SMS", perm: "integrations.manage" as const },
    { href: "/admin/audit", label: "Audit log", desc: "Immutable record of important actions", perm: "audit.read" as const },
  ].filter((c) => rolesHavePermission(user.roles, c.perm));

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Administration</span>
        <h1>Administration</h1>
        <p>Configure the clinic, manage access and review activity.</p>
      </div>

      <div className="panel" style={{ borderColor: blockers.length ? "#e2adbc" : "var(--app-line)", background: blockers.length ? "#fdeef1" : "#f4f8f5" }}>
        <div className="panel-head">
          <h2>Production readiness</h2>
        </div>
        {blockers.length === 0 ? (
          <p style={{ margin: 0, color: "#1e6b43" }}>No outstanding owner inputs are blocking production.</p>
        ) : (
          <>
            <p style={{ margin: "0 0 10px", color: "#a6294f", fontWeight: 700 }}>
              {blockers.length} owner input(s) must be resolved before going live.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
              {blockers.slice(0, 6).map((b) => (
                <li key={b.key}>{b.section}: {b.title}</li>
              ))}
              {blockers.length > 6 ? <li>…and {blockers.length - 6} more</li> : null}
            </ul>
            <Link className="btn btn-primary" href="/admin/setup" style={{ marginTop: 12 }}>
              Open setup checklist
            </Link>
          </>
        )}
      </div>

      <div className="grid-3" style={{ marginTop: 20 }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="label">{c.label}</div>
            <div style={{ fontSize: 14, color: "var(--app-muted)", marginTop: 6 }}>{c.desc}</div>
          </Link>
        ))}
      </div>

      {rolesHavePermission(user.roles, "integrations.manage") && (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel-head"><h2>Integration status</h2></div>
          <div className="btn-row">
            {integrations.map((i) => (
              <span key={i.provider} className={`pill pill-${i.status === "ok" ? "completed" : i.status === "error" ? "urgent" : "requested"}`}>
                {i.provider}: {i.status.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
