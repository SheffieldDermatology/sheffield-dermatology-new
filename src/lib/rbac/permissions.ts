/**
 * Role-based access control. Permissions are fine-grained strings checked
 * server-side on every action; roles map to permission sets. Least privilege:
 * a permission absent from a role's set is denied.
 */

export const ROLES = [
  "system_admin",
  "clinical_admin",
  "consultant",
  "nurse",
  "receptionist",
  "finance",
  "auditor",
  "patient",
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  // Patients & appointments (staff-side)
  "patients.read",
  "patients.write",
  "patients.export",
  "appointments.read",
  "appointments.write",
  "appointments.cancel",
  // Clinical
  "clinical_notes.read",
  "clinical_notes.write",
  "scribe.use",
  "scribe.approve",
  "documents.review",
  // Tasks & messaging
  "tasks.read",
  "tasks.write",
  "tasks.assign",
  "messages.staff",
  "messages.patient",
  // Team files
  "files.read",
  "files.write",
  "files.delete",
  "files.share",
  "files.restore",
  // Finance
  "billing.read",
  "billing.write",
  "billing.refund",
  "reports.financial",
  // Operations & admin
  "reports.operational",
  "users.read",
  "users.manage",
  "roles.manage",
  "settings.manage",
  "integrations.manage",
  "flags.manage",
  "audit.read",
  "retention.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL_STAFF_BASE: Permission[] = ["tasks.read", "tasks.write", "messages.staff", "files.read"];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  system_admin: new Set<Permission>([...PERMISSIONS]),
  clinical_admin: new Set<Permission>([
    ...ALL_STAFF_BASE,
    "patients.read",
    "patients.write",
    "appointments.read",
    "appointments.write",
    "appointments.cancel",
    "documents.review",
    "tasks.assign",
    "messages.patient",
    "files.write",
    "files.share",
    "files.restore",
    "reports.operational",
    "users.read",
  ]),
  consultant: new Set<Permission>([
    ...ALL_STAFF_BASE,
    "patients.read",
    "patients.write",
    "appointments.read",
    "appointments.write",
    "appointments.cancel",
    "clinical_notes.read",
    "clinical_notes.write",
    "scribe.use",
    "scribe.approve",
    "documents.review",
    "tasks.assign",
    "messages.patient",
    "files.write",
    "files.share",
    "billing.read",
    "reports.operational",
  ]),
  nurse: new Set<Permission>([
    ...ALL_STAFF_BASE,
    "patients.read",
    "appointments.read",
    "appointments.write",
    "clinical_notes.read",
    "documents.review",
    "messages.patient",
    "files.write",
  ]),
  receptionist: new Set<Permission>([
    ...ALL_STAFF_BASE,
    "patients.read",
    "patients.write",
    "appointments.read",
    "appointments.write",
    "appointments.cancel",
    "messages.patient",
    "billing.read",
  ]),
  finance: new Set<Permission>([
    ...ALL_STAFF_BASE,
    "patients.read",
    "appointments.read",
    "billing.read",
    "billing.write",
    "billing.refund",
    "reports.financial",
    "reports.operational",
  ]),
  auditor: new Set<Permission>(["audit.read", "reports.operational", "users.read"]),
  // Patients never receive staff permissions; their access is row-scoped in
  // the patient data layer, not permission-based.
  patient: new Set<Permission>([]),
};

export function rolesHavePermission(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.has(permission));
}

export const STAFF_ROLES: readonly Role[] = [
  "system_admin",
  "clinical_admin",
  "consultant",
  "nurse",
  "receptionist",
  "finance",
  "auditor",
];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

/** Sensitive actions requiring recent (elevated) authentication. */
export const ELEVATED_PERMISSIONS: readonly Permission[] = [
  "patients.export",
  "files.delete",
  "roles.manage",
  "users.manage",
  "integrations.manage",
  "settings.manage",
  "retention.manage",
  "billing.refund",
];
