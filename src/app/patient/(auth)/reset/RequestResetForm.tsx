"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ActionState } from "@/server/auth";
import { TextField, SubmitButton } from "@/components/forms/fields";

export default function RequestResetForm() {
  const [state, action] = useActionState<ActionState, FormData>(requestPasswordReset, {});

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
      <TextField label="Email address" name="email" type="email" autoComplete="email" required />
      <SubmitButton>Email me a reset link</SubmitButton>
    </form>
  );
}
