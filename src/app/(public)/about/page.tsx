import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "About Dr Vinod Elangasinghe | Sheffield Dermatology",
  description:
    "About Dr Vinod Elangasinghe, Consultant Dermatologist at Sheffield Dermatology. A considered, unhurried approach to private dermatology consultations in Sheffield.",
  openGraph: {
    title: "About Dr Vinod Elangasinghe | Sheffield Dermatology",
    description:
      "Consultant-led private dermatology in Sheffield with Dr Vinod Elangasinghe.",
    type: "profile",
    locale: "en_GB",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Meet your dermatologist
          </div>
          <h1>
            Dr Vinod
            <br />
            <em>Elangasinghe.</em>
          </h1>
          <p className="page-lead">
            Consultant Dermatologist, Sheffield Dermatology. Every consultation is led personally
            by Dr Elangasinghe — with time to listen, examine carefully and explain your options in
            plain language.
          </p>
        </div>
      </section>

      <section className="doctor section">
        <div className="container doctor-grid">
          <div className="doctor-portrait">
            <div className="portrait-placeholder">
              <span>Dr VE</span>
              <small>
                Professional portrait
                <br />
                to be added
              </small>
            </div>
            <div className="portrait-caption">
              <span>Consultant Dermatologist</span>
              <i></i>
              <span>Sheffield</span>
            </div>
          </div>
          <div className="doctor-copy">
            <span className="eyebrow light">Professional details</span>
            <h2>
              Credentials,
              <br />
              <em>published carefully.</em>
            </h2>
            <p>
              We only publish professional details once they have been supplied by Dr Elangasinghe
              and checked against authoritative sources, such as the General Medical Council
              register. The entries below will be completed before the clinic opens for bookings.
            </p>
            <div className="credentials">
              <div>
                <span>Qualifications</span>
                <strong>To be confirmed</strong>
              </div>
              <div>
                <span>GMC registration</span>
                <strong>To be confirmed — will be published once verified</strong>
              </div>
              <div>
                <span>Memberships</span>
                <strong>To be confirmed</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>To be confirmed</strong>
              </div>
            </div>
            <p>
              You can check any doctor&rsquo;s registration yourself on the General Medical
              Council&rsquo;s public register.
            </p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <span className="eyebrow">The approach</span>
            <h2>
              How your consultation
              <br />
              <em>works.</em>
            </h2>
          </div>
          <div className="info-prose">
            <p>
              Skin, hair and nail concerns are personal, and they deserve unhurried attention. Dr
              Elangasinghe&rsquo;s consultations are built around three simple commitments: your
              concern is properly heard, your skin is carefully assessed, and you leave
              understanding what was found and what your options are.
            </p>
            <h3>Listening first</h3>
            <p>
              Your appointment begins with your story — how the problem started, how it behaves,
              what you have already tried and how it affects your day-to-day life. There is time
              for questions, and no question is too small.
            </p>
            <h3>A careful assessment</h3>
            <p>
              A focused examination follows, explained as it happens. You are welcome to have a
              chaperone present for any examination — just let us know when booking or on the day.
            </p>
            <h3>A clear plan</h3>
            <p>
              You will leave with an explanation in straightforward language and, where
              appropriate, a personalised next-step plan. Where tests, treatment or onward
              referral are worth considering, the reasons — and the alternatives — are discussed
              openly with you.
            </p>
            <div className="tbc-panel">
              <strong>General information only.</strong> Nothing on this page is personal medical
              advice. What is right for you can only be decided in a consultation, based on your
              individual circumstances.
            </div>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="info-cards">
            <article className="info-card">
              <span className="card-number">01</span>
              <h3>Book an appointment</h3>
              <p>Choose an in-person visit in Sheffield or a video consultation.</p>
              <Link className="text-link" href="/book">
                Start booking <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="info-card">
              <span className="card-number">02</span>
              <h3>Prepare for your visit</h3>
              <p>What to bring, how video consultations work, and what to expect.</p>
              <Link className="text-link" href="/patient-information">
                Patient information <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="info-card">
              <span className="card-number">03</span>
              <h3>Questions first?</h3>
              <p>Send the clinic team a message and we will help you choose.</p>
              <Link className="text-link" href="/contact">
                Contact us <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="medical-note">
        <div className="container">
          <strong>Need urgent medical help?</strong>
          <p>
            This website is not an emergency service. If you are seriously unwell, call 999. For
            urgent advice that is not an emergency, use NHS 111.{" "}
            <Link href="/urgent-help">More urgent-care information</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
