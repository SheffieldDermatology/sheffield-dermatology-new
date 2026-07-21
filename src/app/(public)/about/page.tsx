import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "@/styles/info-pages.css";
import portrait from "../../../../public/assets/dr-vinod-elangasinghe-hd.jpg";

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
            Consultant Dermatologist. Dr Elangasinghe provides consultant-led care for adults and
            children — with time to listen, examine carefully and explain your options in plain
            language.
          </p>
        </div>
      </section>

      <section className="doctor section">
        <div className="container doctor-grid">
          <div className="doctor-portrait">
            <Image
              src={portrait}
              alt="Dr Vinod Elangasinghe, Consultant Dermatologist"
              className="portrait-photo"
              width={840}
              height={840}
              priority
            />
            <div className="portrait-caption">
              <span>Consultant Dermatologist</span>
              <i></i>
              <span>Sheffield</span>
            </div>
          </div>
          <div className="doctor-copy">
            <span className="eyebrow light">Professional details</span>
            <h2>
              Consultant-led
              <br />
              <em>dermatology.</em>
            </h2>
            <p>
              Dr Vinod Elangasinghe is a Consultant Dermatologist providing private dermatology
              consultations for adults and children — the trusted destination for the diagnosis and
              treatment of skin conditions and skin cancer across all age groups. He trained across
              the UK, becoming a member and then a fellow of the Royal College of Physicians, with
              accreditation in dermatology, and is a co-editor of the{" "}
              <em>Clinical and Experimental Dermatology</em> journal.
            </p>
            <div className="credentials">
              <div>
                <span>Qualifications</span>
                <strong>MBBS, MRCP (UK), MRCP (Dermatology, UK), FRCP</strong>
              </div>
              <div>
                <span>GMC registration</span>
                <strong>6027383</strong>
              </div>
              <div>
                <span>Specialty</span>
                <strong>Consultant Dermatologist (adult &amp; paediatric)</strong>
              </div>
              <div>
                <span>Memberships</span>
                <strong>Co-editor, Clinical and Experimental Dermatology journal</strong>
              </div>
            </div>
            <p style={{ marginTop: 4 }}>
              <strong>Positions held</strong>
            </p>
            <ul className="info-list">
              <li>Consultant Dermatologist, Chesterfield Royal Hospital NHS FT — 2011–2016</li>
              <li>Skin Cancer MDT Head, North Derbyshire, Chesterfield — 2014–2016</li>
              <li>Vice Chair, Skin Cancer NSSG, South Yorkshire and Humberside — 2014–2016</li>
              <li>Honorary Senior Clinical Lecturer, University of Sheffield — 2012–2016</li>
            </ul>
            <p className="tbc-badge" style={{ marginTop: 4 }}>
              Details to confirm before launch
            </p>
            <p>
              These professional details were compiled from Dr Elangasinghe&rsquo;s existing public
              profiles and should be confirmed by him, and checked against the{" "}
              <a href="https://www.gmc-uk.org/registration-and-licensing/the-medical-register" rel="noopener noreferrer" target="_blank">
                GMC public register
              </a>
              , before the site goes live. You can check any doctor&rsquo;s registration there
              yourself.
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
