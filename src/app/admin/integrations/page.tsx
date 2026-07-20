import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { checkAllIntegrations } from "@/lib/integrations/health";
import { formatDateTime } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Integrations" };

const DESCRIPTIONS: Record<string, string> = {
  semble: "Clinical system of record. Configure SEMBLE_API_URL, SEMBLE_API_TOKEN, SEMBLE_WEBHOOK_SECRET.",
  heidi: "AI scribe. Configure HEIDI_API_URL, HEIDI_API_KEY (via the supported Semble/enterprise route).",
  payments: "Card payments. Configure PAYMENT_PROVIDER, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.",
  email: "Transactional email. Configure EMAIL_PROVIDER, EMAIL_API_KEY, EMAIL_FROM.",
  sms: "SMS reminders. Configure SMS_PROVIDER, SMS_ACCOUNT_SID, SMS_AUTH_TOKEN, SMS_FROM.",
  storage: "Team file storage. STORAGE_PROVIDER (local encrypted store, or microsoft-graph / s3).",
};

export default async function IntegrationsPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "integrations.manage")) {
    return <PermissionDenied what="integration settings" />;
  }
  // Refreshes and returns current statuses.
  const states = await checkAllIntegrations();

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Integrations</span>
        <h1>Integration status</h1>
        <p>Each integration is configured via environment variables in the deployment — never entered here. See INTEGRATIONS.md.</p>
      </div>

      <div className="alert alert-info" role="note">
        Secrets are never collected in this interface. To connect a provider, set its environment
        variables in the deployment&rsquo;s secret store and redeploy.
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Provider</th><th>Status</th><th>Last checked</th><th>Detail</th></tr></thead>
            <tbody>
              {states.map((s) => (
                <tr key={s.provider}>
                  <td><strong style={{ textTransform: "capitalize" }}>{s.provider}</strong><div style={{ fontSize: 12, color: "var(--app-muted)" }}>{DESCRIPTIONS[s.provider]}</div></td>
                  <td><span className={`pill pill-${s.status === "ok" ? "completed" : s.status === "error" ? "urgent" : "requested"}`}>{s.status.replace(/_/g, " ")}</span></td>
                  <td>{s.lastCheckAt ? formatDateTime(s.lastCheckAt) : "—"}</td>
                  <td style={{ fontSize: 12, color: s.lastError ? "#a6294f" : "var(--app-muted)" }}>{s.lastError ?? (s.status === "ok" ? "Healthy" : "Not configured")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
