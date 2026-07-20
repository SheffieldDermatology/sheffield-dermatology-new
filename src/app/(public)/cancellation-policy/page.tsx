import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "Cancellation policy",
  description:
    "How to cancel or rearrange your appointment at Sheffield Dermatology. Please give at least 48 hours' notice where possible. Policy being finalised.",
};

export default function CancellationPolicyPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Appointments
          </div>
          <h1>
            Cancellation <em>policy.</em>
          </h1>
          <p className="legal-lead">
            We understand that plans change. Please let us know as early as you can if you need to
            cancel or move your appointment, so we can offer the time to someone else.
          </p>
          <div className="draft-banner" role="note">
            <span className="badge badge-draft">Draft</span>
            <p>
              <strong>Policy being finalised.</strong> The details below are the clinic&rsquo;s
              working policy. Any cancellation charges will be confirmed and published here before
              the service goes live.
            </p>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-prose">
            <h2>Giving notice</h2>
            <p>
              If you need to cancel or rearrange, please give us{" "}
              <strong>at least 48 hours&rsquo; notice</strong> where possible. This lets us offer
              your appointment to another patient who may be waiting.
            </p>

            <h2>How to cancel or rearrange</h2>
            <ul>
              <li>
                Sign in to the <Link href="/patient">patient portal</Link> and manage your
                appointment there, or
              </li>
              <li>Contact the clinic using the details on our <Link href="/contact">contact page</Link>.</li>
            </ul>

            <h2>Deposits and charges</h2>
            <p>
              Deposits are <strong>not currently taken online</strong> when you book. A charge may
              apply for appointments cancelled at very short notice or missed without notice; any
              such charge, and the notice period it applies to, will be confirmed and shown here
              before it is introduced. We will always be clear about any fee in advance.
            </p>
            <div className="legal-note">
              <p>
                We take a fair and understanding approach — if something unavoidable happens, please
                just let us know.
              </p>
            </div>

            <h2>If the clinic needs to change your appointment</h2>
            <p>
              Occasionally we may need to move an appointment. If that happens we will contact you
              as soon as possible to arrange an alternative time that suits you, at no cost to you.
            </p>

            <h2>Late arrival</h2>
            <p>
              If you arrive late we will do our best to see you, but your appointment may need to be
              shortened or rebooked so that other patients are not delayed.
            </p>

            <p className="legal-updated">Last updated: July 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
