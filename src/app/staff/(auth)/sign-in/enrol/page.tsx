import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateMfaSetup, userHasConfirmedMfa } from "@/lib/auth/mfa";
import AuthShell from "@/components/auth/AuthShell";
import MfaEnrolForm from "./MfaEnrolForm";

export const metadata: Metadata = { title: "Set up two-step verification" };

export default async function StaffEnrolPage() {
  const user = await getSessionUser();
  if (!user || user.kind !== "staff") redirect("/staff/sign-in");
  if (await userHasConfirmedMfa(user.id)) redirect("/staff/sign-in/mfa");

  const setup = await getOrCreateMfaSetup(user.id, user.email);
  const qrSvg = await QRCode.toString(setup.otpauthUrl, {
    type: "svg",
    margin: 1,
    width: 180,
  });

  return (
    <AuthShell
      title="Set up two-step verification"
      intro="Staff accounts require an authenticator app (for example Microsoft Authenticator, Google Authenticator or 1Password)."
      wide
    >
      <div className="mfa-secret-box">
        <div
          className="mfa-qr"
          role="img"
          aria-label="QR code for authenticator app enrolment"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <span>Scan the QR code, or enter this key manually:</span>
        <code>{setup.secret}</code>
      </div>
      <MfaEnrolForm />
    </AuthShell>
  );
}
