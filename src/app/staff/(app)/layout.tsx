import "@/app/globals.css";
import "@/styles/app-shell.css";
import { requireStaff } from "@/lib/auth/guards";
import AppShell from "@/components/app/AppShell";
import { staffNavForRoles, canAccessAdmin } from "@/lib/staff/nav";
import { isProduction } from "@/lib/env";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StaffAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const navItems = staffNavForRoles(user.roles);
  if (canAccessAdmin(user.roles)) {
    navItems.push({ href: "/admin", label: "Administration", icon: "⚙" });
  }

  const initials = user.displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = user.roles.includes("system_admin")
    ? "System administrator"
    : user.roles[0]
      ? user.roles[0].replace(/_/g, " ")
      : "Staff";

  return (
    <div className="app-body">
      <AppShell
        title="Staff workspace"
        roleLabel={roleLabel}
        navItems={navItems}
        userName={user.displayName}
        userInitials={initials}
        userSubtitle={user.email}
        demoBanner={!isProduction}
      >
        {children}
      </AppShell>
    </div>
  );
}
