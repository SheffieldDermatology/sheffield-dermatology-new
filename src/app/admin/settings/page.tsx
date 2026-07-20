import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getClinicInfo } from "@/lib/clinic-info";
import PermissionDenied from "@/components/app/PermissionDenied";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = { title: "Clinic settings" };

export default async function SettingsPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "settings.manage")) {
    return <PermissionDenied what="clinic settings" />;
  }
  const clinic = await getClinicInfo();

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Configuration</span>
        <h1>Clinic settings</h1>
        <p>These details appear on the public website and in confirmations. Fields left blank show as &ldquo;to be confirmed&rdquo; publicly — nothing is invented.</p>
      </div>
      <div className="panel" style={{ maxWidth: 640 }}>
        <div className="panel-head"><h2>Clinic details</h2></div>
        <SettingsForm
          phone={clinic.phone ?? ""}
          email={clinic.email ?? ""}
          addressLines={(clinic.addressLines ?? []).join("\n")}
          openingHours={clinic.openingHours ?? ""}
          legalEntity={clinic.legalEntity ?? ""}
          icoRegistration={clinic.icoRegistration ?? ""}
        />
      </div>
    </>
  );
}
