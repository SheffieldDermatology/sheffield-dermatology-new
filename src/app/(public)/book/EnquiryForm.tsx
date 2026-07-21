"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitBookingEnquiry, type EnquiryState } from "@/server/enquiry";
import { CLINIC } from "@/lib/site-config";

interface ServiceOption {
  slug: string;
  name: string;
}

const LOCATIONS = [
  "Thornbury Hospital, Sheffield",
  "Alexandra Hospital, Manchester",
  "Video consultation",
];
const CONTACT_METHODS = ["Phone", "Email", "WhatsApp"];

export default function EnquiryForm({ services }: { services: ServiceOption[] }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    submitBookingEnquiry,
    null,
  );
  const [payer, setPayer] = useState<"Self-pay" | "Insured">("Self-pay");

  if (state?.ok) {
    return (
      <div className="book-success">
        <div className="tick" aria-hidden="true">
          ✓
        </div>
        <h2>Thank you</h2>
        <p>
          The clinic will contact you to confirm your appointment. A confirmation email is on its
          way to you.
        </p>
        <div className="book-note">
          <strong>This is a request, not a confirmed appointment.</strong> If your concern is
          urgent, please do not wait — call 999 in an emergency, or NHS 111 for urgent advice.
        </div>
        <div className="book-actions-row">
          <Link className="button" href="/">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="book-step">
      <h2>Request an appointment</h2>
      <p className="step-help">
        Tell us what you need and when suits you. The clinic will contact you to confirm.
      </p>

      <div className="enquiry-call">
        <span>Prefer to call?</span>
        <a href={`tel:${CLINIC.phone.replace(/\s+/g, "")}`}>{CLINIC.phone}</a>
        <i aria-hidden="true">·</i>
        <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a>
      </div>

      {state?.error && (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      )}

      {/* Honeypot */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="book-fieldset">
        <legend>Your details</legend>
        <div className="field-row">
          <div className="field-block">
            <label htmlFor="eq-name">Your name *</label>
            <input id="eq-name" name="name" autoComplete="name" required maxLength={120} />
          </div>
          <div className="field-block">
            <label htmlFor="eq-phone">Phone number</label>
            <input id="eq-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </div>
        </div>
        <div className="field-block">
          <label htmlFor="eq-email">Email address *</label>
          <input id="eq-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>
        <div className="field-block">
          <label htmlFor="eq-contact">Preferred way to be contacted</label>
          <select id="eq-contact" name="contactMethod" defaultValue="Phone">
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="book-fieldset">
        <legend>Your appointment</legend>
        <div className="field-row">
          <div className="field-block">
            <label htmlFor="eq-service">Appointment *</label>
            <select id="eq-service" name="service" required defaultValue="">
              <option value="" disabled>
                Please choose…
              </option>
              {services.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label htmlFor="eq-location">Preferred location</label>
            <select id="eq-location" name="location" defaultValue={LOCATIONS[0]}>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field-block">
          <label htmlFor="eq-preferred">Preferred days or times</label>
          <input
            id="eq-preferred"
            name="preferred"
            maxLength={600}
            placeholder="e.g. weekday mornings, or Tuesday/Thursday afternoons"
          />
        </div>
      </fieldset>

      <fieldset className="book-fieldset">
        <legend>How will you pay?</legend>
        <div className="payer-toggle">
          <label className={payer === "Self-pay" ? "active" : ""}>
            <input
              type="radio"
              name="payer"
              value="Self-pay"
              checked={payer === "Self-pay"}
              onChange={() => setPayer("Self-pay")}
            />
            Paying myself
          </label>
          <label className={payer === "Insured" ? "active" : ""}>
            <input
              type="radio"
              name="payer"
              value="Insured"
              checked={payer === "Insured"}
              onChange={() => setPayer("Insured")}
            />
            Using insurance
          </label>
        </div>

        {payer === "Self-pay" ? (
          <p className="payer-note">
            New consultation £450 · Follow-up £250. Procedure costs are explained and agreed before
            anything goes ahead. See <Link href="/fees">fees</Link>.
          </p>
        ) : (
          <div className="insured-fields">
            <p className="payer-note">
              Please confirm cover and any pre-authorisation with your insurer first. See our{" "}
              <Link href="/insurance">insurance guide</Link>.
            </p>
            <div className="field-row">
              <div className="field-block">
                <label htmlFor="eq-insurer">Insurer</label>
                <input id="eq-insurer" name="insurer" maxLength={80} placeholder="e.g. Bupa" />
              </div>
              <div className="field-block">
                <label htmlFor="eq-policy">Membership / policy number</label>
                <input id="eq-policy" name="policyNumber" maxLength={60} />
              </div>
            </div>
            <div className="field-block">
              <label htmlFor="eq-preauth">Pre-authorisation code (if you have one)</label>
              <input id="eq-preauth" name="preAuth" maxLength={60} />
            </div>
          </div>
        )}
      </fieldset>

      <div className="field-block">
        <label htmlFor="eq-message">Anything else we should know? (optional)</label>
        <textarea id="eq-message" name="message" rows={3} maxLength={3000} />
        <small className="field-help">
          Please do not include detailed medical history here — share that at your appointment.
        </small>
      </div>

      <div className="field-block checkbox-block">
        <label className="checkbox-label">
          <input type="checkbox" name="privacyConsent" required />
          <span>
            I agree that the clinic may use these details to contact me about my appointment. I have
            read the <Link href="/privacy">privacy notice</Link>.
          </span>
        </label>
      </div>

      <div className="book-buttons">
        <span />
        <button type="submit" className="button" disabled={pending} aria-busy={pending}>
          {pending ? "Sending…" : "Send appointment request"} <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
