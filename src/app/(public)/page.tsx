import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getClinicInfo } from "@/lib/clinic-info";
import Reviews from "@/components/public/Reviews";
import portrait from "../../../public/assets/dr-vinod-elangasinghe.jpg";

export const metadata: Metadata = {
  title: "Sheffield Dermatology | Consultant-led skin care",
  description:
    "Consultant-led private dermatology care in Sheffield for adults and children. Book an appointment with Dr Vinod Elangasinghe for expert assessment of skin, hair and nail concerns.",
  openGraph: {
    title: "Sheffield Dermatology | Consultant-led skin care",
    description:
      "Consultant-led private dermatology care in Sheffield with Dr Vinod Elangasinghe.",
    type: "website",
    locale: "en_GB",
  },
};

const SERVICES = [
  { slug: "mole-assessment", number: "01", title: "Moles & skin lesions", copy: "Careful assessment of new, changing or concerning moles and other skin lesions.", featured: true },
  { slug: "acne-rosacea", number: "02", title: "Acne & rosacea", copy: "Individual treatment plans for breakouts, redness and sensitive skin." },
  { slug: "eczema-psoriasis", number: "03", title: "Eczema & psoriasis", copy: "Specialist support for persistent, uncomfortable or complex inflammatory conditions." },
  { slug: "hair-scalp-nails", number: "04", title: "Hair, scalp & nails", copy: "Assessment of hair loss, scalp symptoms and changes affecting the nails." },
  { slug: "general-dermatology", number: "05", title: "General dermatology", copy: "Expert review of rashes, pigmentation and other skin concerns, for adults and children." },
];

const ROUTES = [
  { href: "/conditions/mole-assessment", title: "Worried about a mole?", cls: "route-card-a", icon: "◉" },
  { href: "/conditions/acne-rosacea", title: "Acne or rosacea?", cls: "route-card-b", icon: "✦" },
  { href: "/conditions/hair-scalp-nails", title: "Hair, scalp or nails?", cls: "route-card-c", icon: "❧" },
];

export default async function HomePage() {
  const clinic = await getClinicInfo();

  return (
    <>
      {/* ── Circle-motif hero ─────────────────────────────────────── */}
      <section className="circle-hero">
        <div className="container circle-hero-grid">
          <div className="hero-copy reveal">
            <div className="eyebrow">
              <span></span> Private dermatology · Sheffield
            </div>
            <h1>
              Expert skin care, <em>thoughtfully delivered.</em>
            </h1>
            <p className="hero-lead">
              Clear answers and a considered plan for your skin, hair or nail concern — every
              consultation led personally by Dr Vinod Elangasinghe, for adults and children.
            </p>
            <div className="circle-hero-actions">
              <Link className="button" href="/book">
                Book an appointment <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="/conditions">
                Explore our care <span aria-hidden="true">↓</span>
              </Link>
            </div>
          </div>

          <div className="hero-circle-stack reveal delay-1">
            <div className="hero-glow-soft" aria-hidden="true"></div>
            <div className="hero-circle hero-circle-ring" aria-hidden="true"></div>
            <div className="hero-circle hero-circle-main" aria-hidden="true">
              <svg className="hero-motif" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="72" />
                <circle cx="100" cy="100" r="52" />
                <circle cx="100" cy="100" r="32" />
                <path d="M100 40c0 40 0 80 0 120M40 100c40 0 80 0 120 0" />
              </svg>
            </div>
            <Link className="hero-circle hero-circle-coral" href="/book">
              Book your consultation today
            </Link>
          </div>
        </div>
      </section>

      {/* ── Route cards ───────────────────────────────────────────── */}
      <section aria-label="Quick routes">
        <div className="route-cards">
          {ROUTES.map((r) => (
            <Link key={r.href} className={`route-card ${r.cls}`} href={r.href}>
              <span className="route-icon" aria-hidden="true">
                {r.icon}
              </span>
              <span className="route-chip">Book now</span>
              <h3>{r.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Welcome + circular portrait ───────────────────────────── */}
      <section className="welcome-band" id="doctor">
        <div className="container welcome-grid">
          <div className="reveal">
            <p className="welcome-big">Welcome</p>
            <p className="welcome-sub">to Sheffield Dermatology</p>
            <p>
              Established by Dr Vinod Elangasinghe, Sheffield Dermatology is a trusted destination
              for the diagnosis and treatment of skin conditions and skin cancer across all age
              groups. From the moment you arrive, your care is calm, unhurried and personal.
            </p>
            <p>
              You will meet Dr Elangasinghe himself, who assesses your concern carefully and
              explains your options in straightforward language — with time for your questions.
            </p>
            <p style={{ marginTop: "26px" }}>
              <Link className="button" href="/about">
                About Dr Elangasinghe <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
          <div className="portrait-ring reveal delay-1">
            <div className="ring-bg" aria-hidden="true"></div>
            <Image src={portrait} alt="Dr Vinod Elangasinghe, Consultant Dermatologist" width={455} height={280} />
            <Link className="ring-cta" href="/book">
              Book your consultation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Patient reviews (iWantGreatCare) ──────────────────────── */}
      <Reviews />

      {/* ── Conditions grid ───────────────────────────────────────── */}
      <section className="intro section" id="care" style={{ paddingTop: "40px" }}>
        <div className="container">
          <div className="section-heading reveal">
            <div>
              <span className="section-number">01</span>
              <span className="eyebrow">Conditions &amp; care</span>
            </div>
            <div>
              <h2>
                Your concerns, <em>properly heard.</em>
              </h2>
              <p>
                From a changing mole to a long-standing skin condition, your appointment begins with
                listening. We assess the whole picture and explain your options plainly.
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
                    Learn more <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
            <article className="service-card service-all reveal delay-2">
              <p>Not sure which appointment you need?</p>
              <Link className="circle-link" href="/contact" aria-label="Contact us for help choosing an appointment">
                →
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ── Three big circle CTAs ─────────────────────────────────── */}
      <section className="circle-cta-band">
        <div className="container circle-cta-row">
          <div className="circle-cta reveal">
            <div className="circle solid">Ready to be seen?</div>
            <p>Book a consultant-led appointment in Sheffield — in person or by video.</p>
            <Link className="button" href="/book">
              Book online
            </Link>
          </div>
          <div className="circle-cta reveal delay-1">
            <div className="circle ringed">Have a question first?</div>
            <p>Not sure which appointment you need? Ask the clinic team and we&rsquo;ll help.</p>
            <Link className="button button-outline" href="/contact">
              Contact us
            </Link>
          </div>
          <div className="circle-cta reveal delay-2">
            <div className="circle dark">Using insurance?</div>
            <p>Dr Elangasinghe is recognised by Bupa. Check your cover before you book.</p>
            <Link className="button button-outline" href="/insurance">
              Insurance
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact strip ─────────────────────────────────────────── */}
      <section className="contact section" id="contact">
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Get in touch</span>
            <h2>
              Questions before <em>you book?</em>
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
              {clinic.email ? <a href={`mailto:${clinic.email}`}>{clinic.email}</a> : <p>Use the contact form</p>}
            </div>
            <div>
              <small>Clinic</small>
              {clinic.locations && clinic.locations[0] ? (
                <p>
                  {clinic.locations[0].name}, {clinic.locations[0].lines.join(", ")}
                </p>
              ) : (
                <p>Sheffield — address to be confirmed</p>
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
