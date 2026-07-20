import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";

describe("database migrations", () => {
  it("applies cleanly and creates core tables", async () => {
    const db = await makeTestDb();
    const tables = await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const names = tables.rows.map((r) => (r as { table_name: string }).table_name);
    for (const expected of [
      "users",
      "sessions",
      "appointments",
      "audit_events",
      "services",
      "patients",
      "tasks",
      "invoices",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("enforces the appointment no-double-booking unique index", async () => {
    const db = await makeTestDb();
    const { users, patients, clinicians, services, appointments } = await import("@/lib/db/schema");
    const [p] = await db.insert(patients).values({ firstName: "Demo", lastName: "One", isDemo: true }).returning();
    const [c] = await db.insert(clinicians).values({ fullName: "Dr Demo" }).returning();
    const [s] = await db.insert(services).values({ slug: "x", name: "X" }).returning();
    void users;
    const start = new Date("2030-01-01T09:00:00Z");
    const end = new Date("2030-01-01T09:30:00Z");
    await db.insert(appointments).values({ patientId: p!.id, clinicianId: c!.id, serviceId: s!.id, startsAt: start, endsAt: end, visitType: "in_person", status: "requested" });
    await expect(
      db.insert(appointments).values({ patientId: p!.id, clinicianId: c!.id, serviceId: s!.id, startsAt: start, endsAt: end, visitType: "in_person", status: "confirmed" }),
    ).rejects.toThrow();
  });
});
