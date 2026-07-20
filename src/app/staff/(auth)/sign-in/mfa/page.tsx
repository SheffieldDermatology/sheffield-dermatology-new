import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { userHasConfirmedMfa } from "@/lib/auth/mfa";
import AuthShell from "@/components/auth/AuthShell";
import MfaChallengeForm from "./MfaChallengeForm";

export const metadata: Metadata = { title: "Two-step verification" };

export default async function StaffMfaPage() {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff") redirect("/staff/sign-in");
  if (user.mfaVerified) redirect("/staff");
  if (!(await userHasConfirmedMfa(user.id))) redirect("/staff/sign-in/enrol");

  return (
    <AuthShell
      title="Two-step verification"
      intro="Enter the 6-digit code from your authenticator app, or a 10-character recovery code."
      backHref="/staff/sign-in"
      backLabel="← Start again"
    >
      <MfaChallengeForm />
    </AuthShell>
  );
}
