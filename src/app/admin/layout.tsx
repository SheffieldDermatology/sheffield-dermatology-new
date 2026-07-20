import "@/app/globals.css";
import "@/styles/app-shell.css";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission, type Permission } from "@/lib/rbac/permissions";
import AppShell, { type NavItem } from "@/components/app/AppShell";
import { canAccessAdmin } from "@/lib/staff/nav";
import PermissionDenied from "@/components/app/PermissionDenied";
import { isProduction } from "@/lib/env";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ADMIN_NAV: { href: string; label: string; icon: string; anyOf: Permission[] }[] = [
  { href: "/admin", label: "Overview", icon: "⌂", anyOf: ["settings.manage", "users.manage", "roles.manage", "integrations.manage", "flags.manage", "audit.read"] },
  { href: "/admin/setup", label: "Setup checklist", icon: "✓", anyOf: ["settings.manage", "users.manage", "roles.manage", "integrations.manage", "flags.manage", "audit.read"] },
  { href: "/admin/users", label: "Users & roles", icon: "♟", anyOf: ["users.manage", "roles.manage"] },
  { href: "/admin/services", label: "Services & fees", icon: "£", anyOf: ["settings.manage"] },
  { href: "/admin/settings", label: "Clinic settings", icon: "⚙", anyOf: ["settings.manage"] },
  { href: "/admin/flags", label: "Feature flags", icon: "⚑", anyOf: ["flags.manage"] },
  { href: "/admin/integrations", label: "Integrations", icon: "⌘", anyOf: ["integrations.manage"] },
  { href: "/admin/audit", label: "Audit log", icon: "◈", anyOf: ["audit.read"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  if (!canAccessAdmin(user.roles)) {
    return (
      <div className="app-body">
        <div className="app-content">
          <PermissionDenied backHref="/staff" what="the administration area" />
        </div>
      </div>
    );
  }

  const navItems: NavItem[] = ADMIN_NAV.filter((item) =>
    item.anyOf.some((p) => rolesHavePermission(user.roles, p)),
  ).map(({ href, label, icon }) => ({ href, label, icon }));
  navItems.push({ href: "/staff", label: "← Staff workspace", icon: "↩" });

  const initials = user.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-body">
      <AppShell
        title="Administration"
        roleLabel="Administration"
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
