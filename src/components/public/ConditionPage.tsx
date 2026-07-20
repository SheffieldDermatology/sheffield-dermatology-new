import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/conditions.css";

export interface ConditionContent {
  slug: string;
  eyebrow: string;
  h1: React.ReactNode;
  lead: string;
  intro: React.ReactNode;
  covers: { title: string; copy: string }[];
  atAppointment: React.ReactNode;
  urgent?: {
    heading: string;
    intro?: string;
    signs: string[];
    footer?: React.ReactNode;
  };
  related: { href: string; label: string }[];
}

export function conditionMetadata(content: {
  title: string;
  description: string;
}): Metadata {
  return {
    title: `${content.title} | Sheffield Dermatology`,
    description: content.description,
    openGraph: {
      title: `${content.title} | Sheffield Dermatology`,
      description: content.description,
      type: "article",
      locale: "en_GB",
    },
  };
}

export default function ConditionPage({ content }: { content: ConditionContent }) {
  return (
    <>
      <section className="hero condition-hero">
        <div className="container">
          <nav className="condition-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">›</span>{" "}
            <Link href="/conditions">Conditions &amp; care</Link>
          </nav>
          <div className="eyebrow">
            <span></span> {content.eyebrow}
          </div>
          <h1>{content.h1}</h1>
          <p className="hero-lead">{content.lead}</p>
          <div className="hero-actions">
            <Link className="button" href="/book">
              Book an appointment <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="condition-section band-paper">
        <div className="container condition-body">
          <div className="condition-heading">
            <h2>What this covers</h2>
          </div>
          {content.intro}
          <div className="covers-grid">
            {content.covers.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="condition-section band-mist">
        <div className="container condition-body">
          <div className="condition-heading">
            <h2>What happens at your appointment</h2>
          </div>
          {content.atAppointment}
        </div>
      </section>

      {content.urgent ? (
        <section className="condition-section band-paper">
          <div className="container">
            <div className="urgent-callout">
              <div className="eyebrow">
                <span></span> When to seek help sooner
              </div>
              <h2>{content.urgent.heading}</h2>
              {content.urgent.intro ? <p>{content.urgent.intro}</p> : null}
              <ul>
                {content.urgent.signs.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
              {content.urgent.footer ? <p>{content.urgent.footer}</p> : null}
              <p>
                <strong>In an emergency call 999.</strong> For urgent advice that is not an
                emergency, call NHS 111 or contact your GP. See our{" "}
                <Link href="/urgent-help">urgent medical help</Link> page.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="condition-section band-cream">
        <div className="container">
          <div className="condition-cta">
            <h2>Ready to be seen?</h2>
            <p>
              Book a consultant-led appointment with Dr Vinod Elangasinghe, or ask us a question
              first if you are not sure which appointment you need.
            </p>
            <div className="condition-cta-actions">
              <Link className="button" href="/book">
                Book an appointment <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link light" href="/contact">
                Ask a question <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          {content.related.length > 0 ? (
            <div className="related-links">
              {content.related.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label} <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : null}
          <p className="review-note">
            This page provides general information about dermatology care and is not a substitute
            for personal medical advice. Page content is pending clinical review by Dr Vinod
            Elangasinghe before publication.
          </p>
        </div>
      </section>
    </>
  );
}
