"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitBookingEnquiry, type EnquiryState } from "@/server/enquiry";

interface ServiceOption {
  slug: string;
  name: string;
}

export default function EnquiryForm({ services }: { services: ServiceOption[] }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    submitBookingEnquiry,
    null,
  );

  if (state?.ok) {
    return (
      <div className="book-success">
        <div className="tick" aria-hidden="true">
          ✓
        </div>
        <h2>Request received</h2>
        <p>
          Thank you — your appointment request has been sent to the clinic. We will contact you to
          confirm a date and time. A confirmation email is on its way to you.
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
        Tell us what you need and when suits you. The clinic will contact you to confirm. Please
        don&rsquo;t include detailed medical history — share that at your appointment.
      </p>

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
          <label htmlFor="eq-visit">How would you like to meet?</label>
          <select id="eq-visit" name="visit" defaultValue="In person">
            <option value="In person">In person</option>
            <option value="Video">Video consultation</option>
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

      <div className="field-block">
        <label htmlFor="eq-message">Anything else we should know? (optional)</label>
        <textarea id="eq-message" name="message" rows={3} maxLength={3000} />
        <small className="field-help">
          Please do not include detailed medical history here.
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
