import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import PermissionDenied from "@/components/app/PermissionDenied";
import ServiceRow from "./ServiceRow";

export const metadata: Metadata = { title: "Services & fees" };

export default async function ServicesPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "settings.manage")) {
    return <PermissionDenied what="service settings" />;
  }
  const db = getDb();
  const rows = await db.select().from(services).orderBy(services.sortOrder);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Configuration</span>
        <h1>Services &amp; fees</h1>
        <p>Set durations and prices, and mark services as clinically approved. Prices are entered here by the clinic — never invented. Blank price shows as &ldquo;confirmed on booking&rdquo; publicly.</p>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Services</h2></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((s) => (
            <ServiceRow
              key={s.id}
              service={{
                id: s.id,
                name: s.name,
                durationMinutes: s.durationMinutes,
                pricePence: s.pricePence,
                active: s.active,
                approved: !!s.approvedAt,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
