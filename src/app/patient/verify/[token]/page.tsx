import type { Metadata } from "next";
import Link from "next/link";
import "@/app/globals.css";
import "@/styles/auth.css";
import AuthShell from "@/components/auth/AuthShell";
import { verifyEmailToken } from "@/server/auth";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ok = await verifyEmailToken(token);

  return (
    <AuthShell
      title={ok ? "Email confirmed" : "Link not valid"}
      intro={
        ok
          ? "Thank you — your email address is confirmed."
          : "This confirmation link has expired or was already used."
      }
      backHref="/patient/sign-in"
      backLabel="← Go to sign in"
    >
      <div className={`alert ${ok ? "alert-success" : "alert-warning"}`} role="status">
        {ok ? (
          <>
            You can now use every portal feature.{" "}
            <Link href="/patient">Go to your portal</Link>.
          </>
        ) : (
          <>
            Sign in and we can send a fresh link, or contact the clinic if you keep having
            trouble.
          </>
        )}
      </div>
    </AuthShell>
  );
}
