import "@/app/globals.css";
import "@/styles/app-shell.css";
import { requirePatient } from "@/lib/auth/guards";
import { getPatientDashboardCounts, getPatientThreads } from "@/lib/patient/data";
import { getPatientProfile } from "@/lib/patient/data";
import AppShell, { type NavItem } from "@/components/app/AppShell";
import { isProduction } from "@/lib/env";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PatientAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePatient();
  const [profile, counts, threads] = await Promise.all([
    getPatientProfile(user.patientId),
    getPatientDashboardCounts(user.patientId),
    getPatientThreads(user.patientId),
  ]);
  const name = profile ? `${profile.firstName} ${profile.lastName}` : user.displayName;
  const initials =
    (profile?.firstName?.[0] ?? "") + (profile?.lastName?.[0] ?? "") || user.displayName[0] || "P";

  const navItems: NavItem[] = [
    { href: "/patient", label: "Overview", icon: "⌂" },
    { href: "/patient/appointments", label: "Appointments", icon: "□", count: counts.upcomingCount || undefined },
    { href: "/patient/documents", label: "Documents", icon: "▱" },
    { href: "/patient/messages", label: "Messages", icon: "◇", count: threads.length || undefined },
    { href: "/patient/invoices", label: "Invoices", icon: "£", count: counts.unpaidCount || undefined },
    { href: "/patient/consents", label: "Consents", icon: "✓" },
    { href: "/patient/profile", label: "Your details", icon: "☰" },
  ];

  return (
    <div className="app-body">
      <AppShell
        title="Patient portal"
        roleLabel="Patient"
        navItems={navItems}
        userName={name}
        userInitials={initials.toUpperCase()}
        userSubtitle={user.email}
        demoBanner={!isProduction && (profile?.isDemo ?? false)}
      >
        {children}
      </AppShell>
    </div>
  );
}
