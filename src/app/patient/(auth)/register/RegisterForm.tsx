"use client";

import { useActionState } from "react";
import Link from "next/link";
import { patientRegister, type ActionState } from "@/server/auth";
import { TextField, CheckboxField, SubmitButton } from "@/components/forms/fields";

export default function RegisterForm() {
  const [state, action] = useActionState<ActionState, FormData>(patientRegister, {});

  if (state.ok && state.message) {
    return (
      <div className="alert alert-success" role="status">
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      {state.error ? (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      ) : null}
      <TextField label="First name" name="firstName" autoComplete="given-name" required />
      <TextField label="Last name" name="lastName" autoComplete="family-name" required />
      <TextField label="Email address" name="email" type="email" autoComplete="email" required />
      <TextField
        label="Mobile number (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        helpText="Used only to contact you about appointments."
      />
      <TextField
        label="Choose a password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        helpText="At least 12 characters, using three of: lower-case, upper-case, numbers, symbols."
      />
      <CheckboxField
        name="privacyConsent"
        required
        label={
          <>
            I have read the <Link href="/privacy">privacy notice</Link> and agree to Sheffield
            Dermatology processing my information to provide my care.
          </>
        }
      />
      <SubmitButton>Create account</SubmitButton>
      <div className="auth-links">
        <span>
          Already registered? <Link href="/patient/sign-in">Sign in</Link>
        </span>
      </div>
    </form>
  );
}
