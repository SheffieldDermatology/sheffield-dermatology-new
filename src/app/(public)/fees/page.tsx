import type { Metadata } from "next";
import Link from "next/link";
import { FEES } from "@/lib/site-config";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Fees | Private Dermatologist Sheffield",
  description:
    "Consultation fees for private dermatology in Sheffield with Dr Vinod Elangasinghe: new consultation £450, follow-up £250. Procedure costs are explained before treatment. Self-pay and insured patients welcome.",
  alternates: { canonical: "/fees" },
  openGraph: {
    title: "Fees | Sheffield Dermatology",
    description:
      "Clear consultation fees for private dermatology in Sheffield. Self-pay and insured patients welcome.",
    type: "website",
    locale: "en_GB",
  },
};

export default function FeesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Fees</span>
          </nav>
          <div className="eyebrow">
            <span></span> Fees
          </div>
          <h1>
            Clear fees, <em>no surprises.</em>
          </h1>
          <p className="page-lead">
            You will always know the cost of your appointment before it goes ahead. Consultation
            fees are shown below; the cost of any procedure is explained and agreed with you first.
          </p>
        </div>
      </section>

      {/* Fee cards */}
      <section className="info-section">
        <div className="container">
          <div className="fee-cards">
            {FEES.map((fee) => (
              <div key={fee.name} className="fee-card">
                <div className="fee-card-top">
                  <h3>{fee.name}</h3>
                  <span className={fee.price.startsWith("£") ? "fee-price" : "fee-price fee-price--text"}>
                    {fee.price}
                  </span>
                </div>
                <p>{fee.note}</p>
              </div>
            ))}
          </div>
          <div className="tbc-panel">
            <strong>Procedure costs depend on the treatment required and will always be explained
            before anything goes ahead.</strong> If a procedure or further test is recommended, you
            will be given the cost in advance so you can decide with no pressure.
          </div>
        </div>
      </section>

      {/* Self-pay / Insured */}
      <section className="info-section">
        <div className="container">
          <div className="fee-two">
            <div className="fee-block">
              <span className="fee-tag">Self-pay patients</span>
              <h2>Paying for yourself</h2>
              <ul className="info-list">
                <li>Book directly — no GP referral is needed for a private appointment.</li>
                <li>The consultation fee is payable at your appointment.</li>
                <li>You receive a clear invoice and receipt.</li>
                <li>Any procedure or treatment is quoted and agreed before it goes ahead.</li>
              </ul>
              <Link className="button" href="/book">
                Request an appointment <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="fee-block">
              <span className="fee-tag">Insured patients</span>
              <h2>Using private insurance</h2>
              <ul className="info-list">
                <li>Check your cover and any pre-authorisation with your insurer first.</li>
                <li>Bring your membership number and authorisation code to your appointment.</li>
                <li>
                  Eligible fees can be invoiced to your insurer; any excess or shortfall is your
                  responsibility.
                </li>
                <li>
                  Insurance usually covers only the authorised problem — a separate concern may need
                  a new authorisation.
                </li>
              </ul>
              <Link className="text-link" href="/insurance">
                Read the insurance guide <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Payment methods + cancellation */}
      <section className="info-section">
        <div className="container fee-two">
          <div className="fee-block">
            <span className="fee-tag">Payment methods</span>
            <h2>How to pay</h2>
            <p style={{ color: "#4b5064", lineHeight: 1.8 }}>
              Payment is taken at your appointment. Please contact the clinic if you have any
              questions about paying for your care, or would like an estimate before booking.
            </p>
            <p style={{ marginTop: "10px" }}>
              <a href="tel:+447539578959" className="text-link">
                Call +44 7539 578959
              </a>
            </p>
          </div>
          <div className="fee-block">
            <span className="fee-tag">Cancellation</span>
            <h2>Changing your appointment</h2>
            <p style={{ color: "#4b5064", lineHeight: 1.8 }}>
              We understand plans change. Please give as much notice as possible if you need to
              cancel or rearrange, so we can offer the time to another patient.
            </p>
            <p style={{ marginTop: "10px" }}>
              <Link className="text-link" href="/cancellation-policy">
                Read the cancellation policy <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
