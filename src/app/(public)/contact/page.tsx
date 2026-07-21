import type { Metadata } from "next";
import Link from "next/link";
import { getClinicInfo } from "@/lib/clinic-info";
import { SITE_ONLY } from "@/lib/site-config";
import { submitContactEnquiry } from "@/server/contact";
import { submitContactMessage } from "@/server/enquiry";
import ContactForm from "./ContactForm";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Contact | Sheffield Dermatology",
  description:
    "Contact Sheffield Dermatology with a general enquiry, or send a message through our secure contact form. Consultant-led private dermatology in Sheffield.",
  openGraph: {
    title: "Contact | Sheffield Dermatology",
    description: "Get in touch with Sheffield Dermatology — general enquiries and appointments.",
    type: "website",
    locale: "en_GB",
  },
};

export default async function ContactPage() {
  const clinic = await getClinicInfo();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Contact</span>
          </nav>
          <div className="eyebrow">
            <span></span> Get in touch
          </div>
          <h1>
            We are here
            <br />
            <em>to help.</em>
          </h1>
          <p className="page-lead">
            Questions about appointments, fees or anything else — send us a message and the clinic
            team will come back to you. To book, you can go straight to{" "}
            <Link href="/book">online booking</Link>.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container contact-page-grid">
          <div>
            <span className="eyebrow">Clinic details</span>
            <h2>
              Contact
              <br />
              <em>Sheffield Dermatology.</em>
            </h2>
            <div className="contact-details" style={{ marginTop: "34px" }}>
              <div>
                <small>Telephone</small>
                {clinic.phone ? (
                  <a href={`tel:${clinic.phone.replace(/\s+/g, "")}`}>{clinic.phone}</a>
                ) : (
                  <p>To be confirmed</p>
                )}
              </div>
              <div>
                <small>Email</small>
                {clinic.email ? (
                  <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
                ) : (
                  <p>To be confirmed — please use the contact form</p>
                )}
              </div>
              {clinic.locations && clinic.locations.length > 0 ? (
                <div>
                  <small>Consultation offices</small>
                  {clinic.locations.map((loc) => (
                    <p key={loc.name} style={{ marginBottom: "10px" }}>
                      <strong>{loc.name}</strong>
                      <br />
                      {loc.lines.join(", ")}
                    </p>
                  ))}
                </div>
              ) : (
                <div>
                  <small>Clinic address</small>
                  {clinic.addressLines ? (
                    <p>{clinic.addressLines.join(", ")}</p>
                  ) : (
                    <p>Sheffield — full address to be confirmed</p>
                  )}
                </div>
              )}
            </div>
            <div className="tbc-panel">
              <strong>Prefer to talk?</strong> Call or email us using the details above, or send a
              message with the form and the clinic team will come back to you.
            </div>
          </div>

          <div className="contact-form-panel">
            <ContactForm action={SITE_ONLY ? submitContactMessage : submitContactEnquiry} />
          </div>
        </div>
      </section>

      <section className="medical-note">
        <div className="container">
          <strong>Need urgent medical help?</strong>
          <p>
            This contact form is not monitored for urgent problems. If you are seriously unwell,
            call 999. For urgent advice that is not an emergency, use NHS 111.{" "}
            <Link href="/urgent-help">More urgent-care information</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
