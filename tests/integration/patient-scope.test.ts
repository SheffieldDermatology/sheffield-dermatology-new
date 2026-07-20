import { describe, it, expect, beforeEach } from "vitest";
import { installTestDb, type TestDb } from "../helpers/db";
import { getPatientAppointment, getPatientThreadMessages } from "@/lib/patient/data";
import { patients, clinicians, services, appointments, messageThreads, messages } from "@/lib/db/schema";

let db: TestDb;

describe("patient data is strictly row-scoped", () => {
  beforeEach(async () => {
    db = await installTestDb();
  });

  it("does not return another patient's appointment", async () => {
    const [a] = await db.insert(patients).values({ firstName: "Alice", lastName: "A", isDemo: true }).returning();
    const [b] = await db.insert(patients).values({ firstName: "Bob", lastName: "B", isDemo: true }).returning();
    const [c] = await db.insert(clinicians).values({ fullName: "Dr Demo" }).returning();
    const [s] = await db.insert(services).values({ slug: "x", name: "X" }).returning();
    const [appt] = await db
      .insert(appointments)
      .values({ patientId: a!.id, clinicianId: c!.id, serviceId: s!.id, startsAt: new Date("2030-01-01T09:00:00Z"), endsAt: new Date("2030-01-01T09:30:00Z"), visitType: "in_person", status: "confirmed" })
      .returning();

    // Alice can see her own appointment.
    expect(await getPatientAppointment(a!.id, appt!.id)).not.toBeNull();
    // Bob cannot see Alice's appointment even with its id.
    expect(await getPatientAppointment(b!.id, appt!.id)).toBeNull();
  });

  it("does not return another patient's message thread", async () => {
    const [a] = await db.insert(patients).values({ firstName: "Alice", lastName: "A", isDemo: true }).returning();
    const [b] = await db.insert(patients).values({ firstName: "Bob", lastName: "B", isDemo: true }).returning();
    const [thread] = await db.insert(messageThreads).values({ kind: "patient", subject: "Private", patientId: a!.id }).returning();
    await db.insert(messages).values({ threadId: thread!.id, body: "confidential" });

    expect(await getPatientThreadMessages(a!.id, thread!.id)).not.toBeNull();
    expect(await getPatientThreadMessages(b!.id, thread!.id)).toBeNull();
  });
});
