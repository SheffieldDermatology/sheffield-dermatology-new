"use client";

import { useActionState } from "react";
import Link from "next/link";
import { staffSignIn, type ActionState } from "@/server/auth";
import { TextField, SubmitButton } from "@/components/forms/fields";

export default function StaffSignInForm() {
  const [state, action] = useActionState<ActionState, FormData>(staffSignIn, {});

  return (
    <form action={action} noValidate>
      {state.error ? (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      ) : null}
      <TextField label="Email address" name="email" type="email" autoComplete="email" required />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton>Continue</SubmitButton>
      <div className="auth-links">
        <Link href="/staff/sign-in/reset">Forgotten your password?</Link>
      </div>
    </form>
  );
}
