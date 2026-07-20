import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Treatments & approach | Sheffield Dermatology",
  description:
    "How consultant-led dermatology treatment works at Sheffield Dermatology: assessment, diagnosis and a personalised plan with Dr Vinod Elangasinghe.",
};

export default function TreatmentsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Treatments &amp; approach
          </div>
          <h1>
            Treatment that starts <em>with understanding.</em>
          </h1>
          <p className="page-lead">
            Every treatment plan begins with an accurate diagnosis and a conversation. This page
            explains how care works — the specific treatments offered are agreed with you at your
            consultation.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Our approach
            </div>
            <h2>Assessment first, always</h2>
          </div>
          <div className="info-prose">
            <p>
              Dermatology treatment is most effective when it is matched to a clear diagnosis.
              Rather than starting from a fixed menu of procedures, Dr Vinod Elangasinghe assesses
              your skin, explains what is happening and then discusses the options that genuinely
              fit your concern.
            </p>
            <h3>What a plan may involve</h3>
            <p>Depending on your diagnosis, a plan might include:</p>
            <ul className="info-list">
              <li>Prescribed topical or oral treatments, explained clearly</li>
              <li>Skincare and self-management guidance</li>
              <li>Minor procedures or further investigation where indicated</li>
              <li>Referral or onward advice where that is the right step</li>
              <li>A review appointment to check how your skin is responding</li>
            </ul>
            <div className="tbc-panel">
              <strong>Specific procedures and their fees are being finalised.</strong> The list of
              procedures offered, and their prices, will be published here once confirmed and
              approved. Nothing is ever carried out without discussing it — and its cost — with you
              first. See our <Link href="/fees">fees page</Link>.
            </div>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Areas of care
            </div>
            <h2>What we help with</h2>
          </div>
          <div className="info-prose">
            <div className="info-cards two">
              <div className="info-card">
                <h3>Skin</h3>
                <p>Moles and lesions, acne, rosacea, eczema, psoriasis, rashes and pigmentation.</p>
                <Link href="/conditions">See conditions →</Link>
              </div>
              <div className="info-card">
                <h3>Hair, scalp &amp; nails</h3>
                <p>Hair loss, scalp symptoms and nail changes assessed and explained.</p>
                <Link href="/conditions/hair-scalp-nails">Learn more →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="not-monitored">
            <h2>Ready to talk it through?</h2>
            <p>
              Book a consultation and Dr Vinod Elangasinghe will assess your concern and set out
              the options.{" "}
              <Link href="/book">
                <strong>Book an appointment →</strong>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
