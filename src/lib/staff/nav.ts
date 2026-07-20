import type { NavItem } from "@/components/app/AppShell";
import { rolesHavePermission, type Role, type Permission } from "@/lib/rbac/permissions";

interface StaffNavDef extends NavItem {
  permission?: Permission;
}

const STAFF_NAV: StaffNavDef[] = [
  { href: "/staff", label: "Overview", icon: "⌂" },
  { href: "/staff/calendar", label: "Calendar", icon: "▦", permission: "appointments.read" },
  { href: "/staff/patients", label: "Patients", icon: "♟", permission: "patients.read" },
  { href: "/staff/scribe", label: "AI Scribe", icon: "◉", permission: "scribe.use" },
  { href: "/staff/tasks", label: "Tasks", icon: "✓", permission: "tasks.read" },
  { href: "/staff/messages", label: "Messages", icon: "◇", permission: "messages.staff" },
  { href: "/staff/files", label: "Team files", icon: "▱", permission: "files.read" },
  { href: "/staff/billing", label: "Billing", icon: "£", permission: "billing.read" },
  { href: "/staff/reports", label: "Reports", icon: "⌁", permission: "reports.operational" },
];

/** Returns the nav items the given roles are permitted to see. */
export function staffNavForRoles(roles: Role[]): NavItem[] {
  return STAFF_NAV.filter(
    (item) => !item.permission || rolesHavePermission(roles, item.permission),
  ).map(({ href, label, icon, count }) => ({ href, label, icon, count }));
}

/** True if the roles can reach the admin area at all. */
export function canAccessAdmin(roles: Role[]): boolean {
  const adminPerms: Permission[] = [
    "users.manage",
    "roles.manage",
    "settings.manage",
    "integrations.manage",
    "flags.manage",
    "audit.read",
  ];
  return adminPerms.some((p) => rolesHavePermission(roles, p));
}
