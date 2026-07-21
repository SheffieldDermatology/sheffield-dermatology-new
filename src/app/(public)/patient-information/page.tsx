import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Patient information | Sheffield Dermatology",
  description:
    "Everything you need before and after your dermatology appointment with Dr Vinod Elangasinghe in Sheffield: what to bring, what happens next, results, letters and prescriptions.",
  alternates: { canonical: "/patient-information" },
  openGraph: {
    title: "Patient information | Sheffield Dermatology",
    description: "How to prepare for your appointment and what happens afterwards.",
    type: "website",
    locale: "en_GB",
  },
};

export default function PatientInformationPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Patient information</span>
          </nav>
          <div className="eyebrow">
            <span></span> Patient information
          </div>
          <h1>
            Everything you need <em>before and after your visit.</em>
          </h1>
          <p className="page-lead">
            A little preparation helps your appointment go smoothly. Here is what to expect, what to
            bring, and what happens afterwards.
          </p>
        </div>
      </section>

      {/* Before your appointment + What to bring */}
      <section className="info-section">
        <div className="container fee-two">
          <div className="fee-block">
            <span className="fee-tag">Before your appointment</span>
            <h2>A quick checklist</h2>
            <ul className="info-list">
              <li>Note when your concern started and what makes it better or worse.</li>
              <li>List any medication and skincare products you currently use.</li>
              <li>Note any previous treatments you have tried and how they helped.</li>
              <li>For skin concerns, avoid heavy make-up over the area on the day.</li>
              <li>If you are insured, confirm cover and any pre-authorisation with your insurer.</li>
            </ul>
          </div>
          <div className="fee-block">
            <span className="fee-tag">What to bring</span>
            <h2>On the day</h2>
            <ul className="info-list">
              <li>A list of your current medication.</li>
              <li>Any relevant photographs showing how a concern has changed over time.</li>
              <li>Your GP referral letter, if you have one.</li>
              <li>For insured patients: membership number and authorisation code.</li>
              <li>A form of identification.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Appointment: in-person / video / chaperone */}
      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Your appointment
            </div>
            <h2>In-person &amp; video consultations</h2>
          </div>
          <div className="info-prose">
            <h3>In-person visits</h3>
            <p>
              In-person appointments allow a full skin examination, including the use of a
              dermatoscope where helpful. Please arrive a few minutes early.
            </p>
            <h3>Video consultations</h3>
            <p>
              Video consultations are convenient for discussion, follow-up and many assessments. You
              will receive a secure joining link before your appointment. Find a quiet, well-lit
              space, with good lighting on any area you want to show. Dr Elangasinghe will let you
              know if an in-person visit is recommended.
            </p>
            <h3>Chaperones</h3>
            <p>
              You are welcome to have a chaperone present for any examination, and one can be
              offered. Please let us know if you would like this arranged.
            </p>
          </div>
        </div>
      </section>

      {/* After your appointment */}
      <section className="info-section">
        <div className="container">
          <div className="band-head" style={{ textAlign: "left", margin: "0 0 24px" }}>
            <span className="eyebrow">
              <span></span> After your appointment
            </span>
            <h2>What happens next</h2>
          </div>
          <div className="why-grid">
            <article className="why-card">
              <span className="why-icon" aria-hidden="true">
                ✎
              </span>
              <h3>Your plan</h3>
              <p>You leave with a clear explanation and, where appropriate, a personalised plan.</p>
            </article>
            <article className="why-card">
              <span className="why-icon" aria-hidden="true">
                ✉
              </span>
              <h3>Results &amp; letters</h3>
              <p>
                Any results and clinic letters are reviewed by Dr Elangasinghe before being released,
                and the clinic will share them with you (and your GP, where agreed) once ready.
              </p>
            </article>
            <article className="why-card">
              <span className="why-icon" aria-hidden="true">
                ℞
              </span>
              <h3>Prescriptions</h3>
              <p>
                If a prescription is needed, it is explained at your appointment, including how to use
                it and what to expect. Repeat arrangements are discussed with you.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Urgent help */}
      <section className="info-section">
        <div className="container">
          <div className="not-monitored">
            <h2>Need urgent medical help?</h2>
            <p>
              This clinic is not an emergency service and is not monitored around the clock. If you
              are seriously unwell, call <strong>999</strong>. For urgent advice that is not an
              emergency, call <strong>NHS 111</strong> or contact your GP. See our{" "}
              <Link href="/urgent-help">urgent medical help</Link> page.
            </p>
          </div>
          <p style={{ marginTop: "18px", fontSize: "14px", color: "#4b5064" }}>
            Read how we handle your information in our <Link href="/privacy">privacy notice</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
