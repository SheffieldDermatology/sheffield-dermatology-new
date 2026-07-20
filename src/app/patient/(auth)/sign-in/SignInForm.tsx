"use client";

import { useActionState } from "react";
import Link from "next/link";
import { patientSignIn, type ActionState } from "@/server/auth";
import { TextField, SubmitButton } from "@/components/forms/fields";

export default function PatientSignInForm() {
  const [state, action] = useActionState<ActionState, FormData>(patientSignIn, {});

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
      <SubmitButton>Sign in</SubmitButton>
      <div className="auth-links">
        <Link href="/patient/reset">Forgotten your password?</Link>
        <span>
          New to the portal? <Link href="/patient/register">Create your account</Link>
        </span>
      </div>
    </form>
  );
}
