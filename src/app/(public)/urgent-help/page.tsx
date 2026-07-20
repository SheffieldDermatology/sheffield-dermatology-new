import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Urgent medical help | Sheffield Dermatology",
  description:
    "Sheffield Dermatology is not an emergency service. In an emergency call 999. For urgent advice that is not an emergency, call NHS 111 or contact your GP.",
};

export default function UrgentHelpPage() {
  return (
    <>
      <section className="urgent-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Urgent medical help
          </div>
          <h1>Need help quickly?</h1>
          <p className="page-lead">
            This website and clinic are not an emergency service and are not monitored around the
            clock. Please use the right service for how urgent your concern is.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="urgent-cards">
            <div className="urgent-card emergency">
              <h2>In an emergency</h2>
              <span className="urgent-number">999</span>
              <p>
                Call 999 if someone is seriously ill or injured and their life is at risk — for
                example difficulty breathing, a severe allergic reaction, chest pain, or heavy
                bleeding that will not stop.
              </p>
              <a className="urgent-call" href="tel:999">
                Call 999
              </a>
            </div>
            <div className="urgent-card">
              <h2>Urgent, not an emergency</h2>
              <span className="urgent-number">111</span>
              <p>
                Call NHS 111 or visit 111.nhs.uk for urgent medical advice when it is not a
                life-threatening emergency. They are available 24 hours a day and can direct you to
                the right care.
              </p>
              <a className="urgent-call" href="tel:111">
                Call NHS 111
              </a>
            </div>
          </div>

          <div className="info-prose">
            <h3>Contact your GP</h3>
            <p>
              For a health concern that is not urgent but needs attention, your GP practice is
              usually the best first point of contact. They can assess you and arrange onward care
              if needed.
            </p>
            <h3>Skin concerns that should be seen promptly</h3>
            <p>
              Some skin problems benefit from a prompt review even if they are not emergencies —
              for example a mole that is changing, bleeding or growing quickly, or a rapidly
              spreading rash. You can{" "}
              <Link href="/book">book a dermatology appointment</Link>, or contact your GP, without
              waiting.
            </p>
          </div>

          <div className="not-monitored">
            <h2>This clinic is not monitored for urgent problems</h2>
            <p>
              Appointment requests, portal messages and emails to Sheffield Dermatology are not
              checked around the clock, and must never be used to report an emergency or a rapidly
              worsening condition. If you are worried that you or someone else needs help now, use
              999 or NHS 111 as above.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
