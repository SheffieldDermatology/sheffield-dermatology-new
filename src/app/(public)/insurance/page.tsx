import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Insurance | Private Dermatologist Sheffield",
  description:
    "Using private medical insurance for dermatology in Sheffield with Dr Vinod Elangasinghe. Recognised by Bupa. Check referral, pre-authorisation, policy number and cover with your insurer before booking.",
  alternates: { canonical: "/insurance" },
  openGraph: {
    title: "Insurance | Sheffield Dermatology",
    description: "How private medical insurance works for your dermatology appointment in Sheffield.",
    type: "website",
    locale: "en_GB",
  },
};

const CHECKLIST = [
  { q: "Is a GP referral required?", a: "Many insurers ask for a GP referral before they will authorise a private appointment." },
  { q: "Do you have a pre-authorisation code?", a: "Most insurers issue an authorisation code for the specific problem before your visit." },
  { q: "What is your membership / policy number?", a: "Bring this with you so your claim can be processed." },
  { q: "Who is your insurer?", a: "Confirm the exact insurer and plan — cover varies between policies." },
  { q: "Any excess or shortfall?", a: "Check whether you have an excess or a shortfall to pay yourself." },
];

const INSURERS = [
  { name: "Bupa", status: "Recognised", statusClass: "ins-ok", action: "Obtain pre-authorisation and bring your membership number." },
  { name: "Other insurers", status: "Confirm with clinic", statusClass: "ins-check", action: "Contact the clinic before booking to check recognition and billing." },
];

export default function InsurancePage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Insurance</span>
          </nav>
          <div className="eyebrow">
            <span></span> Insurance
          </div>
          <h1>
            Using private <em>medical insurance.</em>
          </h1>
          <p className="page-lead">
            If you have private medical insurance you may be able to claim for your dermatology
            care. A few checks with your insurer first will avoid any surprises.
          </p>
        </div>
      </section>

      {/* Checklist */}
      <section className="info-section">
        <div className="container">
          <div className="band-head" style={{ textAlign: "left", margin: "0 0 24px" }}>
            <span className="eyebrow">
              <span></span> Before you book
            </span>
            <h2>Your insurance checklist</h2>
          </div>
          <div className="ins-checklist">
            {CHECKLIST.map((item) => (
              <div key={item.q} className="ins-check-item">
                <span className="ins-check-mark" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <strong>{item.q}</strong>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurer table */}
      <section className="info-section">
        <div className="container">
          <div className="band-head" style={{ textAlign: "left", margin: "0 0 20px" }}>
            <span className="eyebrow">
              <span></span> Recognition
            </span>
            <h2>Insurers</h2>
          </div>
          <div className="table-scroll">
            <table className="ins-table">
              <thead>
                <tr>
                  <th scope="col">Insurer</th>
                  <th scope="col">Status</th>
                  <th scope="col">What to do</th>
                </tr>
              </thead>
              <tbody>
                {INSURERS.map((ins) => (
                  <tr key={ins.name}>
                    <td>
                      <strong>{ins.name}</strong>
                    </td>
                    <td>
                      <span className={`ins-badge ${ins.statusClass}`}>{ins.status}</span>
                    </td>
                    <td>{ins.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ins-note">
            Recognition and billing arrangements can change. If your insurer is not listed, please{" "}
            <Link href="/contact">contact the clinic</Link> before booking.
          </p>
        </div>
      </section>

      {/* What cover means */}
      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Good to know
            </div>
            <h2>What your cover includes</h2>
          </div>
          <div className="info-prose">
            <p>
              <strong>Always confirm cover directly with your insurer before attending.</strong>{" "}
              Every policy is different, and the clinic cannot guarantee what your insurer will pay.
            </p>
            <p>
              Insurance usually covers only the <strong>authorised problem</strong> — the specific
              condition your insurer has agreed to. If, during your consultation, a{" "}
              <strong>separate problem</strong> is found, it may need its own authorisation from your
              insurer before it can be assessed or treated under your policy.
            </p>
            <p>
              Any amount your policy does not cover — such as an excess or a shortfall — remains your
              responsibility, and we will always be clear about this.
            </p>
            <div className="not-monitored" style={{ marginTop: "24px" }}>
              <h2>Ready to arrange your appointment?</h2>
              <p>
                Send us your insurance details, or talk to the clinic before booking so we can help
                you get authorised.{" "}
                <Link href="/contact">
                  <strong>Contact the clinic →</strong>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
