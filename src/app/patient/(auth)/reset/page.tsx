import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RequestResetForm from "./RequestResetForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function PatientResetPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro="Enter your email address and we will send a link to choose a new password."
      backHref="/patient/sign-in"
      backLabel="← Back to sign in"
    >
      <RequestResetForm />
    </AuthShell>
  );
}
