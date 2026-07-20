import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Patient information | Sheffield Dermatology",
  description:
    "Everything you need before your appointment at Sheffield Dermatology: what to bring, video consultations, chaperones, your records and the secure patient portal.",
};

export default function PatientInformationPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Patient information
          </div>
          <h1>
            Everything you need <em>before your visit.</em>
          </h1>
          <p className="page-lead">
            A little preparation helps your appointment go smoothly. Here is what to expect and how
            we look after your information.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Preparing
            </div>
            <h2>Getting ready for your appointment</h2>
          </div>
          <div className="info-prose">
            <p>
              You do not need to prepare anything detailed to book — but a few things help Dr Vinod
              Elangasinghe give you the best assessment:
            </p>
            <ul className="info-list">
              <li>A list of any medication and skincare products you currently use</li>
              <li>Notes on when the concern started and what makes it better or worse</li>
              <li>Any previous treatments you have tried and how they helped</li>
              <li>
                For skin concerns, avoid heavy make-up over the area on the day so it can be
                examined
              </li>
            </ul>
            <p>
              If you have photographs showing how a concern has changed over time, you can upload
              them securely through the <Link href="/patient">patient portal</Link> once you have
              an account.
            </p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Your appointment
            </div>
            <h2>In-person and video consultations</h2>
          </div>
          <div className="info-prose">
            <h3>In-person visits</h3>
            <p>
              In-person appointments allow a full skin examination, including the use of a
              dermatoscope where helpful. Please arrive a few minutes early.
            </p>
            <h3>Video consultations</h3>
            <p>
              Video consultations are convenient for discussion, follow-up and some assessments.
              You will receive a secure joining link before your appointment. Find a quiet,
              well-lit space, and have good lighting on any area you want to show. Some concerns
              are better assessed in person, and Dr Elangasinghe will let you know if an in-person
              visit is recommended.
            </p>
            <h3>Chaperones</h3>
            <p>
              You are welcome to have a chaperone present for any examination, and one can be
              offered. Please let us know if you would like this arranged.
            </p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Your information
            </div>
            <h2>Records, privacy and the portal</h2>
          </div>
          <div className="info-prose">
            <p>
              Your clinical records are held securely in the clinic&rsquo;s approved
              practice-management system. The secure patient portal lets you manage your care
              without sharing sensitive details by email or text.
            </p>
            <ul className="info-list">
              <li>View and manage your appointments</li>
              <li>Complete forms before your visit</li>
              <li>Upload requested photographs or documents securely</li>
              <li>View approved letters and results when released to you</li>
              <li>Download receipts and invoices</li>
              <li>Send secure, non-urgent messages to the clinic</li>
            </ul>
            <div className="tbc-panel">
              <strong>Please do not send urgent or emergency concerns through the portal.</strong>{" "}
              It is not monitored around the clock. See <Link href="/urgent-help">urgent medical
              help</Link> if you need advice quickly.
            </div>
            <p>
              Read how we handle your data in our <Link href="/privacy">privacy notice</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
