"use client";

import { useActionState } from "react";
import Link from "next/link";
import { joinWaitingList, type WaitingState } from "@/server/booking";
import { TextField, TextAreaField, SelectField, CheckboxField, SubmitButton } from "@/components/forms/fields";

export default function WaitingListForm({ services }: { services: { id: string; name: string }[] }) {
  const [state, action] = useActionState<WaitingState, FormData>(joinWaitingList, { status: "idle" });

  if (state.status === "success") {
    return (
      <div className="book-success">
        <div className="tick" aria-hidden="true">
          ✓
        </div>
        <h2>You&rsquo;re on the list</h2>
        <p style={{ color: "#646b88" }}>
          Thank you — we&rsquo;ll contact you when a suitable appointment becomes available.
        </p>
        <div className="book-actions-row">
          <Link className="text-link" href="/book">
            ← Back to booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="book-step">
      <h2>Join the waiting list</h2>
      <p className="step-help">We only use these details to contact you about an appointment.</p>
      {state.status === "error" && (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      )}
      <TextField label="Full name" name="fullName" autoComplete="name" required />
      <TextField label="Email address" name="email" type="email" autoComplete="email" required />
      <TextField label="Mobile number (optional)" name="phone" type="tel" autoComplete="tel" />
      <SelectField
        label="Which appointment are you waiting for? (optional)"
        name="serviceId"
        options={[{ value: "", label: "Not sure / any" }, ...services.map((s) => ({ value: s.id, label: s.name }))]}
      />
      <TextAreaField
        label="Any preferences? (optional)"
        name="preferences"
        rows={3}
        helpText="For example, preferred days or times. Please don't include medical details."
      />
      <CheckboxField
        name="privacyConsent"
        required
        label={
          <>
            I have read the <Link href="/privacy">privacy notice</Link> and agree to being contacted
            about an appointment.
          </>
        }
      />
      <div className="book-buttons">
        <Link href="/book" className="book-back">
          ← Back
        </Link>
        <SubmitButton>Join the waiting list</SubmitButton>
      </div>
    </form>
  );
}
