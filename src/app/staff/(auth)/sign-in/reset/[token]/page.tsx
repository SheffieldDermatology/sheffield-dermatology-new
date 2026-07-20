import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import NewPasswordForm from "@/app/patient/(auth)/reset/[token]/NewPasswordForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function StaffResetTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthShell
      title="Choose a new password"
      intro="Pick a strong password you have not used elsewhere."
      backHref="/staff/sign-in"
      backLabel="← Back to sign in"
    >
      <NewPasswordForm token={token} signInHref="/staff/sign-in" />
    </AuthShell>
  );
}
