import { describe, it, expect } from "vitest";
import { rolesHavePermission, ROLE_PERMISSIONS } from "@/lib/rbac/permissions";

describe("RBAC permission model", () => {
  it("system_admin has every permission", () => {
    expect(rolesHavePermission(["system_admin"], "audit.read")).toBe(true);
    expect(rolesHavePermission(["system_admin"], "files.delete")).toBe(true);
    expect(rolesHavePermission(["system_admin"], "billing.refund")).toBe(true);
  });

  it("receptionist cannot read clinical notes or audit", () => {
    expect(rolesHavePermission(["receptionist"], "clinical_notes.read")).toBe(false);
    expect(rolesHavePermission(["receptionist"], "audit.read")).toBe(false);
  });

  it("consultant can use and approve the scribe", () => {
    expect(rolesHavePermission(["consultant"], "scribe.use")).toBe(true);
    expect(rolesHavePermission(["consultant"], "scribe.approve")).toBe(true);
  });

  it("nurse can use the scribe but cannot approve notes", () => {
    expect(rolesHavePermission(["nurse"], "scribe.use")).toBe(false);
    expect(rolesHavePermission(["nurse"], "scribe.approve")).toBe(false);
  });

  it("auditor is read-only: audit yes, patient write no", () => {
    expect(rolesHavePermission(["auditor"], "audit.read")).toBe(true);
    expect(rolesHavePermission(["auditor"], "patients.write")).toBe(false);
    expect(rolesHavePermission(["auditor"], "files.delete")).toBe(false);
  });

  it("patient role holds no staff permissions", () => {
    expect(ROLE_PERMISSIONS.patient.size).toBe(0);
    expect(rolesHavePermission(["patient"], "patients.read")).toBe(false);
  });

  it("finance can read billing but not clinical notes", () => {
    expect(rolesHavePermission(["finance"], "billing.write")).toBe(true);
    expect(rolesHavePermission(["finance"], "clinical_notes.read")).toBe(false);
  });

  it("combines permissions across multiple roles", () => {
    expect(rolesHavePermission(["receptionist", "finance"], "billing.write")).toBe(true);
  });
});
