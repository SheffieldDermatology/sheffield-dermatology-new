import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "FAQs | Private Dermatologist Sheffield",
  description:
    "Answers to common questions about booking, video consultations, fees, insurance, referrals and locations for private dermatology in Sheffield with Dr Vinod Elangasinghe.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently asked questions | Sheffield Dermatology",
    description: "Common questions about appointments, fees, insurance and locations.",
    type: "website",
    locale: "en_GB",
  },
};

// `text` is the plain-text answer used for FAQPage schema; `a` is the rendered
// answer (with links) shown on the page.
const FAQS: { q: string; text: string; a: React.ReactNode }[] = [
  {
    q: "Do I need a referral from my GP?",
    text:
      "For self-pay private appointments you do not usually need a GP referral. If you are claiming through private medical insurance, your insurer may require one, so please check with them first.",
    a: (
      <p>
        For self-pay private appointments you do not usually need a GP referral — you can request
        one directly. If you are claiming through private medical insurance, your insurer may
        require a referral, so please check with them first. See our{" "}
        <Link href="/insurance">insurance page</Link>.
      </p>
    ),
  },
  {
    q: "How do I book an appointment?",
    text:
      "Send an appointment request through the website or call the clinic. The clinic then contacts you to confirm a date, time and location.",
    a: (
      <p>
        Send an <Link href="/book">appointment request</Link> in about a minute, or call the clinic
        on <a href="tel:+447539578959">+44 7539 578959</a>. The clinic will then contact you to
        confirm a date, time and location that suit you.
      </p>
    ),
  },
  {
    q: "Can I have a video consultation instead of coming in?",
    text:
      "Yes. Video consultations are available for discussion, follow-up and many assessments. Some skin concerns are better examined in person, and Dr Elangasinghe will advise if an in-person visit is recommended.",
    a: (
      <p>
        Yes. Video consultations are available for discussion, follow-up and many assessments. Some
        skin concerns are better examined in person, and Dr Vinod Elangasinghe will advise if an
        in-person visit is recommended. See <Link href="/patient-information">patient
        information</Link> for how video visits work.
      </p>
    ),
  },
  {
    q: "How much will my appointment cost?",
    text:
      "A new consultation is £450 and a follow-up is £250 (£300 at the Manchester location). Procedure costs depend on the treatment and are always explained and agreed before anything goes ahead.",
    a: (
      <p>
        A new consultation is <strong>£450</strong> and a follow-up is <strong>£250</strong> (£300
        at the Manchester location). The cost of any procedure depends on the treatment and is always
        explained and agreed with you first. See our <Link href="/fees">fees page</Link>.
      </p>
    ),
  },
  {
    q: "What should I bring or prepare?",
    text:
      "Bring a list of any medication and skincare you use, note when your concern started, and avoid heavy make-up over the area on the day. Insured patients should bring their membership number and authorisation code.",
    a: (
      <p>
        Bring a list of any medication and skincare you use, and note when your concern started. For
        skin concerns, avoid heavy make-up over the area on the day. More detail is on the{" "}
        <Link href="/patient-information">patient information</Link> page.
      </p>
    ),
  },
  {
    q: "How do I change or cancel my appointment?",
    text:
      "Contact the clinic as early as you can if you need to change or cancel, so the time can be offered to another patient.",
    a: (
      <p>
        Please <Link href="/contact">contact the clinic</Link> as early as you can if you need to
        change or cancel, so we can offer the time to another patient. See our{" "}
        <Link href="/cancellation-policy">cancellation policy</Link>.
      </p>
    ),
  },
  {
    q: "Can you tell me if a mole is serious over email?",
    text:
      "No — a mole or skin lesion needs to be examined properly to be assessed safely. If something is changing, bleeding or growing quickly, arrange a prompt review or speak to your GP.",
    a: (
      <p>
        No — a mole or skin lesion needs to be examined properly to be assessed safely. Please
        request a <Link href="/conditions/mole-assessment">mole assessment</Link>. If something is
        changing, bleeding or growing quickly, arrange a prompt review or speak to your GP.
      </p>
    ),
  },
  {
    q: "What if my problem is urgent?",
    text:
      "This clinic is not an emergency service and is not monitored around the clock. In an emergency call 999. For urgent advice that is not an emergency, call NHS 111 or contact your GP.",
    a: (
      <p>
        This clinic is not an emergency service and is not monitored around the clock. In an
        emergency call 999. For urgent advice that is not an emergency, call NHS 111 or contact your
        GP. See <Link href="/urgent-help">urgent medical help</Link>.
      </p>
    ),
  },
  {
    q: "Do you see children?",
    text:
      "Yes — Dr Elangasinghe provides dermatology consultations for both adults and children, including paediatric skin, hair and nail concerns.",
    a: (
      <p>
        Yes — Dr Elangasinghe provides dermatology consultations for both adults and children. If
        you are booking for a child, please <Link href="/contact">contact the clinic</Link> if you
        have any questions about the appointment.
      </p>
    ),
  },
  {
    q: "Where are the clinics?",
    text:
      "Dr Elangasinghe consults at Thornbury Hospital in Sheffield and Alexandra Hospital in Manchester, and offers video consultations.",
    a: (
      <p>
        Dr Elangasinghe consults at <strong>Thornbury Hospital, Sheffield</strong> and{" "}
        <strong>Alexandra Hospital, Manchester</strong>, and offers video consultations. Full
        addresses are on the <Link href="/contact">contact page</Link>.
      </p>
    ),
  },
];

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.text },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>FAQs</span>
          </nav>
          <div className="eyebrow">
            <span></span> FAQs
          </div>
          <h1>
            Your questions, <em>answered.</em>
          </h1>
          <p className="page-lead">
            If you cannot find what you need here, <Link href="/contact">contact the clinic</Link>{" "}
            and we will be glad to help.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <details key={i}>
                <summary>{faq.q}</summary>
                <div className="faq-answer">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
