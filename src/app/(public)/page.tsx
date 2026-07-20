import type { Metadata } from "next";
import Link from "next/link";
import { getClinicInfo } from "@/lib/clinic-info";

export const metadata: Metadata = {
  title: "Sheffield Dermatology | Consultant-led skin care",
  description:
    "Consultant-led private dermatology care in Sheffield. Request an appointment with Dr Vinod Elangasinghe for expert assessment of skin, hair and nail concerns.",
  openGraph: {
    title: "Sheffield Dermatology | Consultant-led skin care",
    description:
      "Consultant-led private dermatology care in Sheffield with Dr Vinod Elangasinghe.",
    type: "website",
    locale: "en_GB",
  },
};

const SERVICES = [
  {
    slug: "mole-assessment",
    number: "01",
    title: "Moles & skin lesions",
    copy: "Careful assessment of new, changing or concerning moles and other skin lesions.",
    cta: "Request an assessment",
    featured: true,
  },
  {
    slug: "acne-rosacea",
    number: "02",
    title: "Acne & rosacea",
    copy: "Individual treatment plans for breakouts, redness and sensitive skin.",
    cta: "Request an appointment",
  },
  {
    slug: "eczema-psoriasis",
    number: "03",
    title: "Eczema & psoriasis",
    copy: "Specialist support for persistent, uncomfortable or complex inflammatory conditions.",
    cta: "Request an appointment",
  },
  {
    slug: "hair-scalp-nails",
    number: "04",
    title: "Hair, scalp & nails",
    copy: "Assessment of hair loss, scalp symptoms and changes affecting the nails.",
    cta: "Request an appointment",
  },
  {
    slug: "general-dermatology",
    number: "05",
    title: "General dermatology",
    copy: "Expert review of rashes, pigmentation and other adult skin concerns.",
    cta: "Request an appointment",
  },
];

export default async function HomePage() {
  const clinic = await getClinicInfo();

  return (
    <>
      <section className="hero">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>
        <div className="container hero-grid">
          <div className="hero-copy reveal">
            <div className="eyebrow">
              <span></span> Private dermatology · Sheffield
            </div>
            <h1>
              Expert care,
              <br />
              <em>thoughtfully</em> delivered.
            </h1>
            <p className="hero-lead">
              Clear answers and a considered plan for your skin, hair or nail concern—with every
              consultation led by Dr Vinod Elangasinghe.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/book">
                Book an appointment <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="/conditions">
                Explore our care <span aria-hidden="true">↓</span>
              </Link>
            </div>
            <div className="hero-reassurance" aria-label="Clinic features">
              <div>
                <span className="check">✓</span>
                <span>
                  <strong>Consultant-led</strong>
                  <small>Personalised assessment</small>
                </span>
              </div>
              <div>
                <span className="check">✓</span>
                <span>
                  <strong>Clear next steps</strong>
                  <small>Time to ask questions</small>
                </span>
              </div>
            </div>
          </div>

          <div className="hero-visual reveal delay-1" aria-label="Sheffield Dermatology clinic illustration">
            <div className="visual-frame">
              <div className="visual-orbit orbit-one"></div>
              <div className="visual-orbit orbit-two"></div>
              <div className="skin-shape shape-one"></div>
              <div className="skin-shape shape-two"></div>
              <div className="skin-shape shape-three"></div>
              <svg className="leaf-line" viewBox="0 0 260 410" aria-hidden="true">
                <path d="M132 410c-2-103-12-183 13-269 13-44 38-82 78-113" />
                <path d="M151 121c24-6 47 1 68 18-30 13-54 8-68-18Z" />
                <path d="M134 189c-25-11-49-8-73 7 24 20 49 18 73-7Z" />
                <path d="M137 260c26-7 49-1 69 16-29 14-53 9-69-16Z" />
              </svg>
              <div className="visual-label">
                <span>01</span>
                <p>Considered care for the skin you&rsquo;re in.</p>
              </div>
            </div>
            <div className="floating-card">
              <span className="calendar-icon" aria-hidden="true">
                ◇
              </span>
              <div>
                <small>Appointments</small>
                <strong>Book online</strong>
              </div>
              <Link href="/book" aria-label="Go to appointment booking">
                →
              </Link>
            </div>
          </div>
        </div>
        <div className="container trust-line">
          <span>Professional details to be confirmed:</span>
          <strong>GMC registration</strong>
          <i></i>
          <strong>Insurer recognition</strong>
          <i></i>
          <strong>Sheffield clinic</strong>
        </div>
      </section>

      <section className="intro section" id="care">
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="section-number">01</span>
              <span className="eyebrow">Conditions &amp; care</span>
            </div>
            <div>
              <h2>
                Your concerns,
                <br />
                <em>properly heard.</em>
              </h2>
              <p>
                From a changing mole to a long-standing skin condition, your appointment begins
                with listening. We assess the whole picture and explain your options in
                straightforward language.
              </p>
            </div>
          </div>

          <div className="service-grid">
            {SERVICES.map((service, index) => (
              <article
                key={service.slug}
                className={`service-card reveal${service.featured ? " featured" : ""}${
                  index % 3 === 1 ? " delay-1" : index % 3 === 2 ? " delay-2" : ""
                }`}
              >
                {service.featured && (
                  <div className="service-icon" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                <span className="card-number">{service.number}</span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.copy}</p>
                  <Link href={`/conditions/${service.slug}`}>
                    {service.cta} <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
            <article className="service-card service-all reveal delay-2">
              <p>Not sure which appointment you need?</p>
              <Link
                className="circle-link"
                href="/contact"
                aria-label="Contact us for help choosing an appointment"
              >
                →
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="doctor section" id="doctor">
        <div className="container doctor-grid">
          <div className="doctor-portrait reveal">
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
          <div className="doctor-copy reveal delay-1">
            <span className="eyebrow light">Meet your dermatologist</span>
            <h2>
              Care with clarity,
              <br />
              <em>from Dr Elangasinghe.</em>
            </h2>
            <p className="large-copy">
              Every patient deserves to feel listened to, understood and confident about what
              happens next.
            </p>
            <p>
              Dr Vinod Elangasinghe provides thoughtful, evidence-informed dermatology
              consultations for adults and children. Your appointment is unhurried, your concerns
              are taken seriously, and your options are explained clearly.
            </p>
            <Link className="button button-light" href="/about">
              About Dr Elangasinghe <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="journey section" id="patients">
        <div className="container">
          <div className="journey-heading reveal">
            <span className="eyebrow">Your visit</span>
            <h2>
              A calm, clear path
              <br />
              <em>to better understanding.</em>
            </h2>
          </div>
          <div className="steps">
            <article className="step reveal">
              <span>01</span>
              <div className="step-icon">↗</div>
              <h3>Book</h3>
              <p>Choose the concern, date and time that suit you. We will confirm your appointment.</p>
            </article>
            <article className="step reveal delay-1">
              <span>02</span>
              <div className="step-icon">◎</div>
              <h3>Consult</h3>
              <p>
                Meet Dr Vinod Elangasinghe for a detailed assessment, with time to discuss your
                questions.
              </p>
            </article>
            <article className="step reveal delay-2">
              <span>03</span>
              <div className="step-icon">⌁</div>
              <h3>Plan</h3>
              <p>Leave with an explanation and a personalised next-step plan, where appropriate.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="booking section" id="booking">
        <div className="container booking-shell">
          <div className="booking-intro">
            <span className="eyebrow light">Appointments</span>
            <h2>
              Let&rsquo;s find a time
              <br />
              <em>that suits you.</em>
            </h2>
            <p>
              Choose your appointment type, pick from genuine availability and receive
              confirmation by email — or join the waiting list if nothing suits.
            </p>
            <div className="booking-assurance">
              <span aria-hidden="true">✓</span>
              <p>
                <strong>No detailed medical history needed to book</strong>
                <br />
                Your private medical information is only ever shared through the secure patient
                portal.
              </p>
            </div>
          </div>
          <div className="booking-panel">
            <div className="form-heading">
              <span>Online booking</span>
              <h3>Start your booking</h3>
            </div>
            <p>
              The booking journey takes about two minutes. You can choose an in-person visit in
              Sheffield or a video consultation.
            </p>
            <p>
              <Link className="button" href="/book">
                Book an appointment <span aria-hidden="true">→</span>
              </Link>
            </p>
            <p className="secure-note">
              Prefer to talk first? <Link href="/contact">Contact the clinic</Link> and we will
              help you choose the right appointment.
            </p>
          </div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Get in touch</span>
            <h2>
              Questions before
              <br />
              <em>you book?</em>
            </h2>
          </div>
          <div className="contact-details">
            <div>
              <small>Telephone</small>
              {clinic.phone ? (
                <a href={`tel:${clinic.phone.replace(/\s+/g, "")}`}>{clinic.phone}</a>
              ) : (
                <p>To be confirmed</p>
              )}
            </div>
            <div>
              <small>Email</small>
              {clinic.email ? <a href={`mailto:${clinic.email}`}>{clinic.email}</a> : <p>To be confirmed</p>}
            </div>
            <div>
              <small>Clinic</small>
              {clinic.addressLines ? (
                <p>{clinic.addressLines.join(", ")}</p>
              ) : (
                <p>Sheffield — full address to be confirmed</p>
              )}
            </div>
            <div>
              <small>Opening hours</small>
              <p>{clinic.openingHours ?? "To be confirmed"}</p>
            </div>
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
