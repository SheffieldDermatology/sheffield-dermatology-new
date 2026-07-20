"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ActionState } from "@/server/auth";
import { TextField, SubmitButton } from "@/components/forms/fields";

export default function NewPasswordForm(props: { token: string; signInHref: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPassword, {});

  if (state.ok && state.message) {
    return (
      <div>
        <div className="alert alert-success" role="status">
          {state.message}
        </div>
        <div className="auth-links">
          <Link href={props.signInHref}>Go to sign in</Link>
        </div>
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
      <input type="hidden" name="token" value={props.token} />
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        helpText="At least 12 characters, using three of: lower-case, upper-case, numbers, symbols."
      />
      <TextField
        label="Repeat new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}
