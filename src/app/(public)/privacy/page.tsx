import type { Metadata } from "next";
import Link from "next/link";
import { getClinicInfo } from "@/lib/clinic-info";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How Sheffield Dermatology collects, uses and protects your personal information, including health information, under UK GDPR. Draft pending legal review.",
};

const SECTIONS = [
  { id: "who-we-are", label: "Who we are" },
  { id: "information-we-collect", label: "Information we collect" },
  { id: "how-we-use-it", label: "How and why we use it" },
  { id: "who-we-share-with", label: "Who processes it for us" },
  { id: "where-stored", label: "Where it is stored" },
  { id: "retention", label: "How long we keep it" },
  { id: "your-rights", label: "Your rights" },
  { id: "complaints", label: "Complaints" },
  { id: "cookies", label: "Cookies" },
  { id: "changes", label: "Changes to this notice" },
];

export default async function PrivacyPage() {
  const clinic = await getClinicInfo();
  const controller = clinic.legalEntity ?? "[Data controller to be confirmed]";

  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Legal &amp; privacy
          </div>
          <h1>
            Privacy <em>notice.</em>
          </h1>
          <p className="legal-lead">
            This notice explains what personal information Sheffield Dermatology collects, why we
            collect it, how we protect it, and the rights you have over it.
          </p>
          <div className="draft-banner" role="note">
            <span className="badge badge-draft">Draft</span>
            <p>
              <strong>DRAFT — pending legal review.</strong> This privacy notice is a working draft
              and has not yet completed professional legal review. Items marked &ldquo;to be
              confirmed&rdquo; will be completed before the service goes live.
            </p>
          </div>
          <div className="legal-meta">
            <span>Last updated: July 2026</span>
            <i></i>
            <span>Applies to sheffielddermatology.com and the patient portal</span>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <nav className="legal-toc" aria-label="Contents of this privacy notice">
            <strong>On this page</strong>
            <ol>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.label}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-prose">
            <h2 id="who-we-are">1. Who we are</h2>
            <p>
              The data controller for personal information processed through this website and the
              associated patient portal is <strong>{controller}</strong>, trading as Sheffield
              Dermatology.
            </p>
            <ul>
              <li>
                <strong>ICO registration number:</strong>{" "}
                {clinic.icoRegistration ?? "to be confirmed before the service goes live"}
              </li>
              <li>
                <strong>Data protection contact:</strong> a named data-protection lead is being
                appointed and will be published here.
              </li>
              <li>
                <strong>How to reach us:</strong>{" "}
                {clinic.email ? (
                  <>
                    email <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
                  </>
                ) : (
                  <>
                    please use the <Link href="/contact">contact page</Link> until the clinic&rsquo;s
                    dedicated contact details are published
                  </>
                )}
                {clinic.phone ? (
                  <>
                    {" "}
                    or telephone <a href={`tel:${clinic.phone.replace(/\s+/g, "")}`}>{clinic.phone}</a>
                  </>
                ) : null}
                .
              </li>
            </ul>

            <h2 id="information-we-collect">2. Information we collect</h2>
            <p>Depending on how you use our services, we may collect:</p>
            <ul>
              <li>
                <strong>Identity and contact details</strong> — name, date of birth, email address,
                telephone number and postal address.
              </li>
              <li>
                <strong>Appointment and booking details</strong> — the appointment type you request,
                preferred dates and times, and the general nature of your concern where you choose to
                tell us.
              </li>
              <li>
                <strong>Health information</strong> — information about your health that you share
                with us before, during or after a consultation, and the clinical records created as
                part of your care. Health information is &ldquo;special category&rdquo; data under UK
                GDPR and receives extra protection.
              </li>
              <li>
                <strong>Account and security data</strong> — sign-in details for the patient portal
                (passwords are stored only in securely hashed form), session records, and security
                logs.
              </li>
              <li>
                <strong>Billing records</strong> — invoices and payment records relating to your
                care.
              </li>
              <li>
                <strong>Technical data</strong> — limited information such as IP address and browser
                type, used for security purposes including rate limiting and audit trails.
              </li>
              <li>
                <strong>Communications</strong> — messages you exchange with the clinic, including
                through the secure portal.
              </li>
            </ul>

            <h2 id="how-we-use-it">3. How and why we use it (lawful bases)</h2>
            <p>UK GDPR requires a lawful basis for every use of personal information. Ours are:</p>
            <ul>
              <li>
                <strong>Providing your care and managing appointments</strong> — Article 6(1)(b)
                (performance of a contract). For health information we rely on Article 9(2)(h)
                (provision of health care, with the associated condition in Schedule 1 of the Data
                Protection Act 2018), processed by or under the responsibility of professionals
                subject to a duty of confidentiality.
              </li>
              <li>
                <strong>Meeting legal obligations</strong> — Article 6(1)(c), for example
                record-keeping, tax and regulatory requirements.
              </li>
              <li>
                <strong>Running a secure service</strong> — Article 6(1)(f) (legitimate interests):
                protecting accounts, preventing fraud and misuse, and maintaining audit records. We
                balance these interests against your rights.
              </li>
              <li>
                <strong>Consent</strong> — Article 6(1)(a), and Article 9(2)(a) for health data,
                where we specifically ask — for example AI-assisted note taking (see our{" "}
                <Link href="/ai-scribe">AI scribe information</Link>) or optional communications. You
                can withdraw consent at any time without affecting your care.
              </li>
            </ul>
            <p>
              We do not sell personal information, and we do not use it for third-party advertising
              or profiling.
            </p>

            <h2 id="who-we-share-with">4. Who processes your information for us</h2>
            <p>
              We use a small number of carefully chosen suppliers (&ldquo;processors&rdquo;) who
              handle personal information only on our instructions:
            </p>
            <ul>
              <li>
                <strong>Semble</strong> — our clinical practice-management system, which holds the
                clinical record.
              </li>
              <li>
                <strong>Heidi</strong> — an AI-assisted documentation tool used only with your
                explicit consent, described on our <Link href="/ai-scribe">AI scribe page</Link>.
              </li>
              <li>
                <strong>Hosting provider</strong> — the secure infrastructure this website and portal
                run on.
              </li>
              <li>
                <strong>Email and SMS providers</strong> — used to send appointment confirmations and
                reminders, with the minimum information necessary.
              </li>
            </ul>
            <p>
              Written data-processing agreements meeting Article 28 UK GDPR are being put in place
              with each supplier as part of go-live preparation. We may also share information where
              the law requires it (for example a court order) or with your agreement — such as with
              your GP or insurer at your request.
            </p>

            <h2 id="where-stored">5. Where your information is stored</h2>
            <p>
              Our policy is that personal information is stored and processed in the United Kingdom,
              or in territories covered by UK adequacy regulations, with appropriate safeguards in
              place for any transfer outside the UK.
            </p>

            <h2 id="retention">6. How long we keep it</h2>
            <p>
              A detailed retention schedule, aligned with recognised UK guidance on the retention of
              health records, is being finalised and will be published here. Until it is approved we
              apply a conservative default: records are retained and nothing is automatically
              deleted. Medical records are generally kept for substantial periods required by
              professional guidance.
            </p>

            <h2 id="your-rights">7. Your rights</h2>
            <p>Under UK GDPR you have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong> — request a copy of the personal information we hold about
                you.
              </li>
              <li>
                <strong>Rectification</strong> — ask us to correct inaccurate or incomplete
                information.
              </li>
              <li>
                <strong>Erasure</strong> — ask us to delete information in certain circumstances
                (note that professional obligations mean medical records usually cannot be deleted on
                request).
              </li>
              <li>
                <strong>Restriction</strong> — ask us to limit how we use your information in certain
                circumstances.
              </li>
              <li>
                <strong>Portability</strong> — receive certain information in a portable format.
              </li>
              <li>
                <strong>Objection</strong> — object to processing based on legitimate interests.
              </li>
              <li>
                <strong>Withdraw consent</strong> — at any time, where consent is our basis for
                processing.
              </li>
            </ul>
            <p>
              To exercise any of these rights,{" "}
              {clinic.email ? (
                <>
                  email <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
                </>
              ) : (
                <>
                  contact us via the <Link href="/contact">contact page</Link>
                </>
              )}
              . We will respond within one month, and we may need to verify your identity first.
            </p>

            <h2 id="complaints">8. Complaints</h2>
            <p>
              If you are unhappy with how we handle your information, please raise it with us first
              so we can put it right. You also have the right to complain to the Information
              Commissioner&rsquo;s Office (ICO) at{" "}
              <a href="https://ico.org.uk" rel="noopener noreferrer">
                ico.org.uk
              </a>{" "}
              or by telephone on 0303&nbsp;123&nbsp;1113.
            </p>

            <h2 id="cookies">9. Cookies</h2>
            <p>
              This website uses only strictly necessary cookies — for signing in, security and
              remembering your cookie preference. There are no analytics or advertising cookies. See
              the <Link href="/cookies">cookie policy</Link> for the full list.
            </p>

            <h2 id="changes">10. Changes to this notice</h2>
            <p>
              We will update this notice as the service develops — including when the retention
              schedule is finalised and the outstanding details above are confirmed — and show the
              date of the latest version here.
            </p>

            <p className="legal-updated">Last updated: July 2026 · Draft pending legal review</p>
          </div>
        </div>
      </section>
    </>
  );
}
