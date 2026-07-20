import type { Metadata } from "next";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientProfile } from "@/lib/patient/data";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "Your details" };

export default async function ProfilePage() {
  const user = await requirePatient();
  const profile = await getPatientProfile(user.patientId);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Your details</span>
        <h1>Contact details</h1>
        <p>Keep your contact details up to date so the clinic can reach you about appointments.</p>
      </div>

      <div className="panel" style={{ maxWidth: 520 }}>
        <div className="panel-head">
          <h2>Update your details</h2>
        </div>
        <ProfileForm
          firstName={profile?.firstName ?? ""}
          lastName={profile?.lastName ?? ""}
          email={profile?.email ?? user.email}
          phone={profile?.phone ?? ""}
        />
      </div>
    </>
  );
}
