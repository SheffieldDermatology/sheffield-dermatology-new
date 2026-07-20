import type { Metadata } from "next";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientInvoices } from "@/lib/patient/data";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const user = await requirePatient();
  const invoices = await getPatientInvoices(user.patientId);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Invoices</span>
        <h1>Invoices &amp; receipts</h1>
        <p>View your invoices and download receipts. Outstanding balances can be settled here once online payments are enabled.</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Your invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="ico" aria-hidden="true">£</div>
            <h3>No invoices yet</h3>
            <p>Invoices for your appointments will appear here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{formatDate(inv.issuedAt ?? inv.createdAt)}</td>
                    <td>{formatMoney(inv.totalPence, inv.currency)}</td>
                    <td>
                      <span
                        className={`pill pill-${
                          inv.status === "paid"
                            ? "completed"
                            : inv.status === "issued" || inv.status === "part_paid"
                              ? "requested"
                              : "cancelled"
                        }`}
                      >
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                    <td>
                      {(inv.status === "issued" || inv.status === "part_paid") ? (
                        <span style={{ fontSize: 12, color: "var(--app-muted)" }}>
                          Online payment coming soon
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--app-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 14 }}>
          Online card payments are enabled once the clinic connects an approved payment provider.
          Until then, please arrange payment with the clinic directly.
        </p>
      </div>
    </>
  );
}
