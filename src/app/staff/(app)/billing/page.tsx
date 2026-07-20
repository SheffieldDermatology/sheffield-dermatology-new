import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getBillingOverview } from "@/lib/staff/data";
import { formatMoney, formatDate, statusLabel } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "billing.read")) {
    return <PermissionDenied what="billing" />;
  }
  const { rows, totals } = await getBillingOverview();

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Finance</span>
        <h1>Billing</h1>
        <p>Invoices and balances. Card payments and insurer e-billing connect via approved providers — no card data is stored here.</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="label">Outstanding</div>
          <div className="value">{formatMoney(totals.outstanding)}</div>
          <div className="meta">Issued &amp; part-paid invoices</div>
        </div>
        <div className="stat">
          <div className="label">Paid</div>
          <div className="value">{formatMoney(totals.paid)}</div>
          <div className="meta">Verified via signed payment webhooks</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Invoices</h2>
          <span className="sub">{rows.length}</span>
        </div>
        {rows.length === 0 ? (
          <div className="empty-state"><div className="ico" aria-hidden="true">£</div><h3>No invoices yet</h3><p>Invoices raised for appointments will appear here.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Patient</th><th>Payer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.invoiceNumber}</td>
                    <td>{r.patientFirst} {r.patientLast}</td>
                    <td>{r.payerType === "insurer" ? "Insurer" : "Self-pay"}</td>
                    <td>{formatMoney(r.totalPence, r.currency)}</td>
                    <td><span className={`pill pill-${r.status === "paid" ? "completed" : r.status === "issued" || r.status === "part_paid" ? "requested" : "cancelled"}`}>{statusLabel(r.status)}</span></td>
                    <td>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!rolesHavePermission(user.roles, "billing.write") && (
          <p style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 12 }}>You have read-only access to billing.</p>
        )}
      </div>
    </>
  );
}
