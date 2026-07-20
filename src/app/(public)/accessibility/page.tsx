import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description:
    "Sheffield Dermatology is committed to making its website and patient portal accessible, aiming to meet WCAG 2.2 AA. Draft pending formal audit.",
};

export default function AccessibilityPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Accessibility
          </div>
          <h1>
            Accessibility <em>statement.</em>
          </h1>
          <p className="legal-lead">
            We want everyone to be able to use this website and the patient portal, whatever their
            abilities or the technology they use.
          </p>
          <div className="draft-banner" role="note">
            <span className="badge badge-draft">Draft</span>
            <p>
              <strong>Draft — pending a formal accessibility audit.</strong> We have built to
              recognised accessibility standards and will publish the results of an independent
              audit here once complete.
            </p>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-prose">
            <h2>Our commitment</h2>
            <p>
              We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. These
              guidelines explain how to make web content more accessible to people with a wide range
              of needs, including visual, hearing, motor and cognitive differences.
            </p>

            <h2>What we have done</h2>
            <ul>
              <li>Used clear, semantic HTML so pages work with screen readers</li>
              <li>Ensured the site can be navigated using a keyboard alone</li>
              <li>Provided visible focus indicators for interactive elements</li>
              <li>Included a &ldquo;skip to main content&rdquo; link</li>
              <li>Given form fields proper labels, help text and error messages</li>
              <li>Respected the &ldquo;reduce motion&rdquo; setting for animations</li>
              <li>Aimed for sufficient colour contrast for text</li>
              <li>Made the layout responsive for phones, tablets and desktops</li>
            </ul>

            <h2>Known limitations</h2>
            <p>
              We are honest about areas still being improved. This statement will be updated as an
              independent audit is completed and any issues are addressed. If you find something
              that does not work well for you, we would genuinely like to hear about it.
            </p>

            <h2>Getting help or reporting a problem</h2>
            <p>
              If you have difficulty using any part of this website or the portal, or need
              information in a different format, please <Link href="/contact">contact the clinic</Link>{" "}
              and we will do our best to help.
            </p>

            <h2>Enforcement</h2>
            <p>
              If you contact us about an accessibility problem and are not happy with our response,
              the Equality Advisory and Support Service (EASS) can provide advice.
            </p>

            <p className="legal-updated">Last updated: July 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
