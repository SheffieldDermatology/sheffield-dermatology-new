"use client";

import { useActionState } from "react";
import { staffMfaVerify, type ActionState } from "@/server/auth";
import { TextField, SubmitButton } from "@/components/forms/fields";

export default function MfaChallengeForm() {
  const [state, action] = useActionState<ActionState, FormData>(staffMfaVerify, {});

  return (
    <form action={action} noValidate>
      {state.error ? (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      ) : null}
      <TextField
        label="Verification code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        minLength={6}
        maxLength={12}
      />
      <SubmitButton>Verify and sign in</SubmitButton>
    </form>
  );
}
