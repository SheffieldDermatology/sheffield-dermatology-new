import { describe, it, expect, beforeEach } from "vitest";
import { installTestDb, type TestDb } from "../helpers/db";
import { generateAvailability, isSlotFree } from "@/lib/booking/availability";
import { clinicians, services, patients, availabilityRules, appointments } from "@/lib/db/schema";

let db: TestDb;

async function seedBookingFixtures() {
  const [clinician] = await db.insert(clinicians).values({ fullName: "Dr Demo", active: true }).returning();
  const [service] = await db.insert(services).values({ slug: "consult", name: "Consultation", durationMinutes: 30, active: true }).returning();
  const [patient] = await db.insert(patients).values({ firstName: "Demo", lastName: "Patient", isDemo: true }).returning();
  // Monday–Friday 09:00–17:00
  for (const weekday of [1, 2, 3, 4, 5]) {
    await db.insert(availabilityRules).values({ clinicianId: clinician!.id, weekday, startTime: "09:00", endTime: "17:00" });
  }
  return { clinician: clinician!, service: service!, patient: patient! };
}

/** Returns a Date ~10 days out that falls on a weekday. */
function futureWeekday(): Date {
  const d = new Date(Date.now() + 10 * 86400_000);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

describe("booking availability engine", () => {
  beforeEach(async () => {
    db = await installTestDb();
  });

  it("generates genuine slots within availability windows", async () => {
    const { service } = await seedBookingFixtures();
    const day = futureWeekday();
    const from = new Date(`${day.toISOString().slice(0, 10)}T00:00:00Z`);
    const to = new Date(`${day.toISOString().slice(0, 10)}T23:59:59Z`);
    const slots = await generateAvailability({ serviceId: service.id, from, to });
    expect(slots.length).toBeGreaterThan(0);
  });

  it("excludes a slot once it is booked and reports it not free", async () => {
    const { service, clinician, patient } = await seedBookingFixtures();
    const day = futureWeekday();
    const from = new Date(`${day.toISOString().slice(0, 10)}T00:00:00Z`);
    const to = new Date(`${day.toISOString().slice(0, 10)}T23:59:59Z`);
    const slots = await generateAvailability({ serviceId: service.id, from, to });
    const slot = slots[0]!;

    expect(await isSlotFree({ serviceId: service.id, clinicianId: slot.clinicianId, startsAt: slot.startsAt })).toBe(true);

    await db.insert(appointments).values({
      patientId: patient.id,
      clinicianId: clinician.id,
      serviceId: service.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      visitType: "in_person",
      status: "requested",
    });

    expect(await isSlotFree({ serviceId: service.id, clinicianId: slot.clinicianId, startsAt: slot.startsAt })).toBe(false);
    const after = await generateAvailability({ serviceId: service.id, from, to });
    expect(after.some((s) => s.startsAt.getTime() === slot.startsAt.getTime() && s.clinicianId === slot.clinicianId)).toBe(false);
  });

  it("does not offer slots inside the 24-hour lead time", async () => {
    const { service } = await seedBookingFixtures();
    const today = new Date();
    const from = new Date(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
    const to = new Date(from.getTime() + 86400_000);
    const slots = await generateAvailability({ serviceId: service.id, from, to });
    for (const s of slots) {
      expect(s.startsAt.getTime() - Date.now()).toBeGreaterThanOrEqual(24 * 3600_000 - 1000);
    }
  });
});
