import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { featureFlags } from "@/lib/db/schema";
import PermissionDenied from "@/components/app/PermissionDenied";
import FlagRow from "./FlagRow";

export const metadata: Metadata = { title: "Feature flags" };

const GOVERNANCE_WARNING: Record<string, string> = {
  "scribe.audio_retention": "Requires a completed DPIA, approved consent wording, retention policy and supplier agreements before enabling.",
  "payments.online": "Requires a configured, approved payment provider and a decision on deposits.",
  "booking.live": "Confirmed-slot booking via a connected provider (Semble). Off = request-only booking.",
  "sms.reminders": "Requires a configured SMS provider.",
};

export default async function FlagsPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "flags.manage")) {
    return <PermissionDenied what="feature flags" />;
  }
  const db = getDb();
  const flags = await db.select().from(featureFlags).orderBy(featureFlags.key);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Configuration</span>
        <h1>Feature flags</h1>
        <p>Enable features only when their prerequisites are met. Flags are conservative by default.</p>
      </div>
      <div className="panel">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {flags.map((f) => (
            <FlagRow
              key={f.key}
              flag={{ key: f.key, enabled: f.enabled, description: f.description }}
              warning={GOVERNANCE_WARNING[f.key]}
            />
          ))}
        </div>
      </div>
    </>
  );
}
