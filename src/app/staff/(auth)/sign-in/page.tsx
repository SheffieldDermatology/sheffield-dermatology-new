import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, isVerifiedStaff } from "@/lib/auth/session";
import AuthShell from "@/components/auth/AuthShell";
import StaffSignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Staff sign in" };

export default async function StaffSignInPage() {
  const user = await getSessionUser();
  if (isVerifiedStaff(user)) redirect("/staff");

  return (
    <AuthShell
      title="Staff workspace"
      intro="Sign in with your staff account. Multi-factor authentication is required for every staff sign-in."
    >
      <StaffSignInForm />
    </AuthShell>
  );
}
