"use client";

import { useActionState, useId } from "react";

type FormState = { ok?: boolean; error?: string } | null;
type ContactAction = (state: FormState, formData: FormData) => Promise<FormState>;

export default function ContactForm({ action }: { action: ContactAction }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, null);
  const statusId = useId();

  if (state?.ok) {
    return (
      <div className="form-success" role="status">
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>
        <span>Message sent</span>
        <h3>
          Thank you — we have <b>your enquiry</b>.
        </h3>
        <p>
          The clinic team will reply using the contact details you provided, normally during
          opening hours. If your situation changes and becomes urgent, please do not wait for a
          reply — call 999 in an emergency or NHS 111 for urgent advice.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate={false}>
      <div className="form-heading">
        <span>Contact form</span>
        <h3>Send us a message</h3>
      </div>

      <p className="form-alert form-alert-error" role="note">
        <strong>Please do not include detailed medical information</strong> (symptoms, diagnoses,
        medications or photographs) in this form — it is for general enquiries only. Medical
        details should only be shared during a consultation or through the secure patient portal.
      </p>

      {state && !state.ok && (
        <p className="form-alert form-alert-error" role="alert" id={statusId}>
          {state.error}
        </p>
      )}

      <label className="field">
        <span>Your name (required)</span>
        <input type="text" name="name" required maxLength={120} autoComplete="name" />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Email address (required)</span>
          <input type="email" name="email" required maxLength={254} autoComplete="email" />
        </label>
        <label className="field">
          <span>Phone (optional)</span>
          <input type="tel" name="phone" maxLength={40} autoComplete="tel" />
        </label>
      </div>

      <label className="field">
        <span>Your message (required)</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          aria-describedby={state && !state.ok ? statusId : undefined}
        />
      </label>

      {/* Honeypot: hidden from real visitors; automated submitters fill it. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form-buttons">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Sending…" : "Send message"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      {isPending && (
        <p className="sr-only" role="status">
          Sending your message
        </p>
      )}

      <p className="form-privacy-note">
        We use the details you provide only to respond to your enquiry. See our privacy notice for
        how we look after your information.
      </p>
    </form>
  );
}
