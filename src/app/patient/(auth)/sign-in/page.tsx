import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import AuthShell from "@/components/auth/AuthShell";
import PatientSignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Patient sign in" };

export default async function PatientSignInPage() {
  const user = await getSessionUser();
  if (user?.kind === "patient") redirect("/patient");

  return (
    <AuthShell
      title="Patient portal"
      intro="Sign in to view your appointments, messages, documents and invoices."
    >
      <PatientSignInForm />
    </AuthShell>
  );
}
