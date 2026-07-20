"use client";

import { useActionState } from "react";
import Link from "next/link";
import { staffMfaEnrolConfirm, type EnrolState } from "@/server/auth";
import { TextField, SubmitButton } from "@/components/forms/fields";

export default function MfaEnrolForm() {
  const [state, action] = useActionState<EnrolState, FormData>(staffMfaEnrolConfirm, {});

  if (state.ok && state.recoveryCodes) {
    return (
      <div>
        <div className="alert alert-success" role="status">
          Two-step verification is set up. Save these one-time recovery codes somewhere safe —
          they are shown only once and each works once if you lose your authenticator.
        </div>
        <ul className="recovery-codes">
          {state.recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <Link className="button" href="/staff">
          Continue to the workspace
        </Link>
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
      <TextField
        label="Enter the current 6-digit code to confirm"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        minLength={6}
        maxLength={8}
      />
      <SubmitButton>Confirm and finish setup</SubmitButton>
    </form>
  );
}
