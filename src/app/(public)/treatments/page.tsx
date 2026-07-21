import type { Metadata } from "next";
import Link from "next/link";
import { TREATMENTS } from "@/lib/site-config";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Treatments & services | Sheffield Dermatology",
  description:
    "The full range of medical and surgical dermatology treatments offered by Dr Vinod Elangasinghe at Sheffield Dermatology, for adults and children.",
};

export default function TreatmentsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Treatments &amp; services
          </div>
          <h1>
            What Dr Elangasinghe <em>treats.</em>
          </h1>
          <p className="page-lead">
            Dr Vinod Elangasinghe offers a broad range of medical and surgical dermatology
            treatments for adults and children. Every treatment begins with an accurate diagnosis
            and is agreed with you — including its cost — at your consultation.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Full list
            </div>
            <h2>Treatments offered</h2>
          </div>
          <div className="info-prose">
            <ul className="info-list" style={{ columns: 2, columnGap: "36px" }}>
              {TREATMENTS.map((t) => (
                <li key={t} style={{ breakInside: "avoid" }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="tbc-panel">
            <strong>Not sure which appointment you need?</strong> If your concern is not listed, or
            you are unsure where to start, <Link href="/contact">contact the clinic</Link> and we
            will help. Fees are confirmed with you before any treatment — see our{" "}
            <Link href="/fees">fees</Link> page.
          </div>
          <div className="not-monitored" style={{ marginTop: "24px" }}>
            <h2>Ready to be seen?</h2>
            <p>
              Request an appointment and Dr Vinod Elangasinghe will assess your concern and set out
              the options.{" "}
              <Link href="/book">
                <strong>Request an appointment →</strong>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
