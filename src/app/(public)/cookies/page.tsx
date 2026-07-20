import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "Sheffield Dermatology uses only strictly necessary cookies for security and signing in. No analytics or advertising cookies are used.",
};

export default function CookiesPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Legal &amp; privacy
          </div>
          <h1>
            Cookie <em>policy.</em>
          </h1>
          <p className="legal-lead">
            We keep cookies to a minimum. This website uses only strictly necessary cookies — none
            for analytics, tracking or advertising.
          </p>
          <div className="legal-meta">
            <span>Last updated: July 2026</span>
            <i></i>
            <span>Applies to sheffielddermatology.com and the patient portal</span>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-prose">
            <h2>What cookies are</h2>
            <p>
              Cookies are small text files stored on your device by your browser. Some are essential
              for a website to work — for example to keep you signed in securely. Others are used to
              measure usage or to advertise. <strong>We use only the essential kind.</strong>
            </p>

            <h2>Cookies we use</h2>
            <div className="table-scroll">
              <table className="legal-table">
                <caption>Strictly necessary cookies set by this website</caption>
                <thead>
                  <tr>
                    <th scope="col">Cookie</th>
                    <th scope="col">Purpose</th>
                    <th scope="col">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>sd_session</code>
                    </td>
                    <td>
                      Keeps you signed in to the patient portal or staff workspace. Set only after
                      you sign in.
                    </td>
                    <td>Up to 12 hours; cleared on sign out</td>
                  </tr>
                  <tr>
                    <td>
                      <code>sd_cookie_prefs</code>
                    </td>
                    <td>Remembers that you have seen the cookie notice.</td>
                    <td>180 days</td>
                  </tr>
                  <tr>
                    <td>
                      <code>CSRF / form protection</code>
                    </td>
                    <td>
                      Protects forms against cross-site request forgery so that only genuine
                      submissions are accepted.
                    </td>
                    <td>Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="legal-note">
              <p>
                Because these cookies are strictly necessary for the website to function securely,
                they do not require consent under the Privacy and Electronic Communications
                Regulations. We do not set any non-essential cookies, so there is nothing to opt in
                or out of.
              </p>
            </div>

            <h2>No analytics or advertising</h2>
            <p>
              We do not use Google Analytics or any similar analytics service, and we do not use
              advertising or social-media tracking cookies. If this ever changes, we will update
              this policy and ask for your consent before setting any non-essential cookie.
            </p>

            <h2>Managing cookies</h2>
            <p>
              You can delete or block cookies through your browser settings at any time. Blocking
              the essential cookies above will prevent you from signing in to the portal or staff
              workspace.
            </p>

            <h2>More information</h2>
            <p>
              This policy sits alongside our <Link href="/privacy">privacy notice</Link>. If you
              have questions, please <Link href="/contact">contact the clinic</Link>.
            </p>

            <p className="legal-updated">Last updated: July 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
