import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Frequently asked questions | Sheffield Dermatology",
  description:
    "Answers to common questions about booking, appointments, video consultations, fees, insurance, the patient portal and the AI scribe at Sheffield Dermatology.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need a referral from my GP?",
    a: (
      <p>
        For self-pay private appointments you do not usually need a GP referral — you can book
        directly. If you are claiming through private medical insurance, your insurer may require a
        referral, so please check with them first. See our <Link href="/insurance">insurance
        page</Link>.
      </p>
    ),
  },
  {
    q: "How do I book an appointment?",
    a: (
      <p>
        You can <Link href="/book">book online</Link> in a few minutes. Choose your appointment
        type, pick from the available times and enter your details. You will receive a confirmation
        by email.
      </p>
    ),
  },
  {
    q: "Can I have a video consultation instead of coming in?",
    a: (
      <p>
        Yes. Video consultations are available for discussion, follow-up and many assessments.
        Some skin concerns are better examined in person, and Dr Vinod Elangasinghe will advise if
        an in-person visit is recommended. See <Link href="/patient-information">patient
        information</Link> for how video visits work.
      </p>
    ),
  },
  {
    q: "How much will my appointment cost?",
    a: (
      <p>
        You will always know the fee before your appointment goes ahead. Consultation fees are
        confirmed when you book, and any procedure is discussed with you — including its cost —
        first. See our <Link href="/fees">fees page</Link>.
      </p>
    ),
  },
  {
    q: "What should I bring or prepare?",
    a: (
      <p>
        Bring a list of any medication and skincare you use, and note when your concern started.
        For skin concerns, avoid heavy make-up over the area on the day. More detail is on the{" "}
        <Link href="/patient-information">patient information</Link> page.
      </p>
    ),
  },
  {
    q: "How do I change or cancel my appointment?",
    a: (
      <p>
        You can manage appointments in the <Link href="/patient">patient portal</Link>, or contact
        the clinic. Please give as much notice as possible — see our{" "}
        <Link href="/cancellation-policy">cancellation policy</Link>.
      </p>
    ),
  },
  {
    q: "Is my information kept private?",
    a: (
      <p>
        Yes. Your clinical records are held securely in the clinic&rsquo;s approved system, and the
        patient portal lets you manage care without sharing sensitive details by email or text.
        Read our <Link href="/privacy">privacy notice</Link>.
      </p>
    ),
  },
  {
    q: "What is the AI scribe, and do I have to agree to it?",
    a: (
      <p>
        With your agreement, an AI-assisted scribe can help draft the notes for your consultation.
        It is entirely optional — you can say no, or change your mind, and it will not affect your
        care. Your clinician reviews and approves every note. Read more on our{" "}
        <Link href="/ai-scribe">AI scribe information</Link> page.
      </p>
    ),
  },
  {
    q: "Can you tell me if a mole is serious over email?",
    a: (
      <p>
        No — a mole or skin lesion needs to be examined properly to be assessed safely. Please book
        an <Link href="/conditions/mole-assessment">assessment</Link>. If something is changing,
        bleeding or growing quickly, arrange a prompt review or speak to your GP.
      </p>
    ),
  },
  {
    q: "What if my problem is urgent?",
    a: (
      <p>
        This clinic and its portal are not an emergency service and are not monitored around the
        clock. In an emergency call 999. For urgent advice that is not an emergency, call NHS 111
        or contact your GP. See <Link href="/urgent-help">urgent medical help</Link>.
      </p>
    ),
  },
  {
    q: "Do you treat children?",
    a: (
      <p>
        Consultations are provided for adults. If you are booking on behalf of someone else, please{" "}
        <Link href="/contact">contact the clinic</Link> to check suitability first.
      </p>
    ),
  },
  {
    q: "Where is the clinic?",
    a: (
      <p>
        The clinic is in Sheffield. The full address and directions are on the{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
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
