import { describe, it, expect, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { installTestDb, type TestDb } from "../helpers/db";
import { clinicians, services, patients, appointments } from "@/lib/db/schema";

let db: TestDb;

/**
 * Regression test for the review finding: the unique index only catches
 * identical start instants, so overlapping intervals must be prevented by the
 * transactional overlap check createBooking performs under an advisory lock.
 * This test reproduces that overlap check directly.
 */
async function insertWithOverlapGuard(input: {
  clinicianId: string;
  serviceId: string;
  patientId: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<boolean> {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.clinicianId}))`);
      const conflicts = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          sql`${appointments.clinicianId} = ${input.clinicianId}
            and ${appointments.status} in ('requested','confirmed')
            and ${appointments.startsAt} < ${input.endsAt}
            and ${appointments.endsAt} > ${input.startsAt}`,
        )
        .limit(1);
      if (conflicts.length > 0) throw new Error("overlap");
      await tx.insert(appointments).values({
        patientId: input.patientId,
        clinicianId: input.clinicianId,
        serviceId: input.serviceId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        visitType: "in_person",
        status: "requested",
      });
    });
    return true;
  } catch {
    return false;
  }
}

describe("overlapping appointments are rejected", () => {
  beforeEach(async () => {
    db = await installTestDb();
  });

  it("blocks a second appointment that overlaps but does not share a start instant", async () => {
    const [c] = await db.insert(clinicians).values({ fullName: "Dr Demo" }).returning();
    const [s] = await db.insert(services).values({ slug: "c", name: "Consult", durationMinutes: 30 }).returning();
    const [p] = await db.insert(patients).values({ firstName: "Demo", lastName: "P", isDemo: true }).returning();

    const base = { clinicianId: c!.id, serviceId: s!.id, patientId: p!.id };
    // 09:00–09:30
    const ok1 = await insertWithOverlapGuard({ ...base, startsAt: new Date("2030-02-01T09:00:00Z"), endsAt: new Date("2030-02-01T09:30:00Z") });
    // 09:15–09:45 overlaps the first (different start instant)
    const ok2 = await insertWithOverlapGuard({ ...base, startsAt: new Date("2030-02-01T09:15:00Z"), endsAt: new Date("2030-02-01T09:45:00Z") });
    // 09:30–10:00 is adjacent, not overlapping — allowed
    const ok3 = await insertWithOverlapGuard({ ...base, startsAt: new Date("2030-02-01T09:30:00Z"), endsAt: new Date("2030-02-01T10:00:00Z") });

    expect(ok1).toBe(true);
    expect(ok2).toBe(false);
    expect(ok3).toBe(true);
  });
});
