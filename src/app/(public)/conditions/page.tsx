import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/conditions.css";

export const metadata: Metadata = {
  title: "Conditions we care for | Sheffield Dermatology",
  description:
    "Consultant-led assessment of moles and skin lesions, acne and rosacea, eczema and psoriasis, hair, scalp and nail concerns, and general dermatology in Sheffield.",
  openGraph: {
    title: "Conditions we care for | Sheffield Dermatology",
    description:
      "Consultant-led private dermatology care in Sheffield across five areas of skin, hair and nail health.",
    type: "website",
    locale: "en_GB",
  },
};

const CARE_AREAS = [
  {
    slug: "mole-assessment",
    number: "01",
    title: "Moles & skin lesions",
    copy: "Careful, unhurried assessment of new, changing or concerning moles and other skin lesions — the appointment to choose if something on your skin is worrying you.",
    cta: "About mole assessment",
    featured: true,
  },
  {
    slug: "acne-rosacea",
    number: "02",
    title: "Acne & rosacea",
    copy: "Persistent breakouts, redness, flushing and sensitive skin — assessed properly, with a plan built around your skin rather than a standard prescription.",
    cta: "About acne & rosacea care",
  },
  {
    slug: "eczema-psoriasis",
    number: "03",
    title: "Eczema & psoriasis",
    copy: "Support for itchy, inflamed or flaking skin that keeps returning, including long-standing conditions that have never quite settled.",
    cta: "About eczema & psoriasis care",
  },
  {
    slug: "hair-scalp-nails",
    number: "04",
    title: "Hair, scalp & nails",
    copy: "Hair thinning or loss, scalp irritation and changes affecting the nails — concerns that are easy to dismiss but deserve a proper explanation.",
    cta: "About hair, scalp & nail care",
  },
  {
    slug: "general-dermatology",
    number: "05",
    title: "General dermatology",
    copy: "Rashes, itching, pigmentation changes and any adult skin concern that does not fit neatly into a category — including the ones you cannot put a name to.",
    cta: "About general dermatology",
  },
];

export default function ConditionsIndexPage() {
  return (
    <>
      <section className="hero condition-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Conditions &amp; care
          </div>
          <h1>
            Every skin concern,
            <br />
            <em>taken seriously.</em>
          </h1>
          <p className="hero-lead">
            Sheffield Dermatology offers consultant-led care across five areas of skin, hair and
            nail health. Whatever brings you here, your appointment starts with listening — and
            ends with a clear explanation and a considered plan.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/book">
              Book an appointment <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-link" href="/treatments">
              How treatment works <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section band-paper">
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="section-number">01</span>
              <span className="eyebrow">Five areas of care</span>
            </div>
            <div>
              <h2>
                Find the right
                <br />
                <em>starting point.</em>
              </h2>
              <p>
                Each area below has its own page explaining what it covers, what happens at an
                appointment and when a concern deserves prompt attention. If you are not sure
                where your concern fits, general dermatology is always a safe place to start.
              </p>
            </div>
          </div>

          <div className="service-grid">
            {CARE_AREAS.map((area, index) => (
              <article
                key={area.slug}
                className={`service-card reveal${area.featured ? " featured" : ""}${
                  index % 3 === 1 ? " delay-1" : index % 3 === 2 ? " delay-2" : ""
                }`}
              >
                {area.featured && (
                  <div className="service-icon" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                <span className="card-number">{area.number}</span>
                <div>
                  <h3>{area.title}</h3>
                  <p>{area.copy}</p>
                  <Link href={`/conditions/${area.slug}`}>
                    {area.cta} <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
            <article className="service-card service-all reveal delay-2">
              <p>Wondering what treatment might involve?</p>
              <Link
                className="circle-link"
                href="/treatments"
                aria-label="Learn about our treatment approaches"
              >
                →
              </Link>
            </article>
          </div>
          <p className="content-note">
            The service list shown here is a draft pending clinical approval. Appointment
            availability is confirmed during booking.
          </p>
        </div>
      </section>

      <section className="condition-section band-cream">
        <div className="container">
          <div className="condition-heading reveal">
            <span className="eyebrow">What to expect</span>
            <h2>
              One consultant,
              <br />
              <em>start to finish.</em>
            </h2>
            <p>
              Every appointment is led by Dr Vinod Elangasinghe. However your concern is
              categorised, the approach is the same: a careful history, a thorough examination
              and an honest conversation about your options.
            </p>
          </div>
          <div className="steps">
            <article className="step reveal">
              <span>01</span>
              <div className="step-icon" aria-hidden="true">↗</div>
              <h3>Book</h3>
              <p>
                Choose the area closest to your concern and a time that suits you. You do not
                need a diagnosis to book — that is what the appointment is for.
              </p>
            </article>
            <article className="step reveal delay-1">
              <span>02</span>
              <div className="step-icon" aria-hidden="true">◎</div>
              <h3>Consult</h3>
              <p>
                A detailed, unhurried assessment with time for your questions. Nothing is
                decided without you.
              </p>
            </article>
            <article className="step reveal delay-2">
              <span>03</span>
              <div className="step-icon" aria-hidden="true">⌁</div>
              <h3>Plan</h3>
              <p>
                Leave with a clear explanation of what was found and, where appropriate, a
                personalised next-step plan.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="condition-section band-paper">
        <div className="container">
          <div className="condition-cta reveal">
            <div>
              <span className="eyebrow light">Appointments</span>
              <h2>
                Ready when
                <br />
                <em>you are.</em>
              </h2>
              <p>
                Booking takes about two minutes, and you can choose an in-person visit in
                Sheffield or a video consultation. Prefer to talk it through first? The clinic
                team will help you choose the right appointment.
              </p>
            </div>
            <div className="condition-cta-actions">
              <Link className="button button-light" href="/book">
                Book an appointment <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link light" href="/contact">
                Contact the clinic <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <p className="review-note">
            The information on these pages is general educational information, not personal
            medical advice, and is awaiting clinical review. It does not replace a consultation
            with a doctor about your individual circumstances.
          </p>
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
