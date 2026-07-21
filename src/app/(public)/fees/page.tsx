import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { SITE_ONLY, SERVICES } from "@/lib/site-config";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Fees | Sheffield Dermatology",
  description:
    "Consultation fees at Sheffield Dermatology. Fees are confirmed when you book so you always know the cost before your appointment.",
};

function formatFee(pricePence: number | null): { text: string; tbc: boolean } {
  if (pricePence === null) return { text: "Confirmed when you book", tbc: true };
  return { text: `£${(pricePence / 100).toFixed(2)}`, tbc: false };
}

export default async function FeesPage() {
  const rows = SITE_ONLY
    ? SERVICES.map((s) => ({
        id: s.slug,
        name: s.name,
        durationMinutes: s.durationMinutes,
        pricePence: null as number | null,
      }))
    : await getDb()
        .select()
        .from(services)
        .where(eq(services.active, true))
        .orderBy(asc(services.sortOrder));

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Fees
          </div>
          <h1>
            Clear fees, <em>no surprises.</em>
          </h1>
          <p className="page-lead">
            You will always know the cost of your appointment before it goes ahead. Fees for any
            procedure are explained and agreed with you first.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="fee-table-wrap">
            <table className="fee-table">
              <caption>Consultation fees</caption>
              <thead>
                <tr>
                  <th scope="col">Appointment</th>
                  <th scope="col">Typical length</th>
                  <th scope="col">Fee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((service) => {
                  const fee = formatFee(service.pricePence);
                  return (
                    <tr key={service.id}>
                      <td>{service.name}</td>
                      <td>{service.durationMinutes} minutes</td>
                      <td>
                        {fee.tbc ? (
                          <span className="fee-tbc">{fee.text}</span>
                        ) : (
                          <span className="fee-amount">{fee.text}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tbc-panel">
            <strong>Fees are being finalised.</strong> Consultation and procedure prices are
            confirmed with you at the point of booking and before any treatment. This page will
            show the full published fee list once it has been approved. Prices for procedures
            depend on what is involved and are always discussed in advance.
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Paying
            </div>
            <h2>Payment &amp; insurance</h2>
          </div>
          <div className="info-prose">
            <p>
              You can pay for your care yourself (self-pay) or, if you have private medical
              insurance, you may be able to claim through your insurer.
            </p>
            <ul className="info-list">
              <li>Self-pay patients receive a clear invoice and receipt</li>
              <li>
                Insured patients should check cover and obtain any pre-authorisation before their
                appointment
              </li>
              <li>Deposits are not currently taken online</li>
            </ul>
            <div className="tbc-panel">
              <strong>Accepted payment methods are being confirmed.</strong> Details of how to pay,
              and which insurers can be billed, will be published here. See our{" "}
              <Link href="/insurance">insurance page</Link> for more.
            </div>
            <p>
              Please read our <Link href="/cancellation-policy">cancellation policy</Link> before
              booking.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
