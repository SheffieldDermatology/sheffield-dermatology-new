import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms of use for the Sheffield Dermatology website and patient portal. Draft pending legal review.",
};

export default function TermsPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Legal
          </div>
          <h1>
            Terms of <em>use.</em>
          </h1>
          <p className="legal-lead">
            These terms explain the basis on which you may use the Sheffield Dermatology website and
            patient portal.
          </p>
          <div className="draft-banner" role="note">
            <span className="badge badge-draft">Draft</span>
            <p>
              <strong>DRAFT — pending legal review.</strong> These terms are a working draft and
              will be finalised with professional legal advice before the service goes live.
            </p>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-prose">
            <h2>Not medical advice</h2>
            <p>
              The information on this website is general information about dermatology and the
              services offered. It is <strong>not personal medical advice</strong> and should not be
              relied on as a diagnosis. For advice about your own health, please book a consultation
              or speak to a suitably qualified professional.
            </p>

            <h2>Not for emergencies</h2>
            <p>
              This website, the patient portal and any messaging feature are{" "}
              <strong>not an emergency service</strong> and are not monitored around the clock. In
              an emergency call 999. For urgent advice that is not an emergency, call NHS 111 or
              contact your GP. See <Link href="/urgent-help">urgent medical help</Link>.
            </p>

            <h2>Using the patient portal</h2>
            <p>When you use the patient portal, you agree to:</p>
            <ul>
              <li>Provide accurate information about yourself</li>
              <li>Keep your sign-in details confidential and not share your account</li>
              <li>Use the portal only for your own care, or care you are authorised to manage</li>
              <li>Not attempt to access information that is not yours</li>
              <li>Not misuse, disrupt or attempt to compromise the service</li>
            </ul>

            <h2>Appointments and fees</h2>
            <p>
              Booking an appointment is subject to confirmation. Fees are as agreed at the point of
              booking. Cancellations and changes are covered by our{" "}
              <Link href="/cancellation-policy">cancellation policy</Link>.
            </p>

            <h2>Intellectual property</h2>
            <p>
              The content, branding and design of this website belong to Sheffield Dermatology or
              its licensors and may not be copied or reused without permission.
            </p>

            <h2>Liability</h2>
            <p>
              We take reasonable care to keep the website accurate and available, but we do not
              guarantee it will always be error-free or uninterrupted. Nothing in these terms limits
              any liability that cannot be limited by law, including liability for death or personal
              injury caused by negligence.
            </p>

            <h2>Privacy</h2>
            <p>
              How we handle your information is explained in our{" "}
              <Link href="/privacy">privacy notice</Link> and <Link href="/cookies">cookie
              policy</Link>.
            </p>

            <h2>Governing law</h2>
            <p>
              These terms are governed by the law of England and Wales, and the courts of England
              and Wales have jurisdiction.
            </p>

            <h2>Changes</h2>
            <p>
              We may update these terms from time to time. The current version will always be
              available on this page.
            </p>

            <p className="legal-updated">Last updated: July 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
