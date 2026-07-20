import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RequestResetForm from "@/app/patient/(auth)/reset/RequestResetForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function StaffResetRequestPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro="Enter your staff email address and we will send a link to choose a new password."
      backHref="/staff/sign-in"
      backLabel="← Back to sign in"
    >
      <RequestResetForm />
    </AuthShell>
  );
}
