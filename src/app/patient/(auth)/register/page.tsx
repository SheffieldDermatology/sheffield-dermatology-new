import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Create your patient account" };

export default async function PatientRegisterPage() {
  const user = await getSessionUser();
  if (user?.kind === "patient") redirect("/patient");

  return (
    <AuthShell
      title="Create your account"
      intro="Register to book and manage appointments, complete forms and message the clinic securely."
      wide
    >
      <RegisterForm />
    </AuthShell>
  );
}
