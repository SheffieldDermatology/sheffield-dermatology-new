import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { ownerInputs } from "@/lib/db/schema";
import { canAccessAdmin } from "@/lib/staff/nav";
import PermissionDenied from "@/components/app/PermissionDenied";
import OwnerInputRow from "./OwnerInputRow";

export const metadata: Metadata = { title: "Setup checklist" };

export default async function SetupPage() {
  const user = await requireStaff();
  if (!canAccessAdmin(user.roles)) return <PermissionDenied backHref="/staff" />;
  const canEdit = rolesHavePermission(user.roles, "settings.manage");

  const db = getDb();
  const inputs = await db.select().from(ownerInputs).orderBy(ownerInputs.section, ownerInputs.title);
  const blockers = inputs.filter((i) => i.blocksProduction && (i.status === "missing" || i.status === "partial"));

  const sections = Array.from(new Set(inputs.map((i) => i.section)));

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Go-live</span>
        <h1>Setup checklist</h1>
        <p>Owner decisions and information required before the platform goes into production. See OWNER_INPUTS.md.</p>
      </div>

      <div className="panel" style={{ borderColor: blockers.length ? "#e2adbc" : "var(--app-line)", background: blockers.length ? "#fdeef1" : "#f4f8f5" }}>
        <strong style={{ color: blockers.length ? "#a6294f" : "#1e6b43" }}>
          {blockers.length === 0 ? "No production blockers outstanding." : `${blockers.length} production blocker(s) unresolved.`}
        </strong>
      </div>

      {sections.map((section) => (
        <div className="panel" key={section}>
          <div className="panel-head"><h2>{section}</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inputs.filter((i) => i.section === section).map((input) => (
              <OwnerInputRow
                key={input.key}
                input={{
                  key: input.key,
                  title: input.title,
                  why: input.why,
                  whereShown: input.whereShown,
                  blocksProduction: input.blocksProduction,
                  safeDefault: input.safeDefault,
                  status: input.status,
                  note: (input.value as { note?: string } | null)?.note ?? "",
                }}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
