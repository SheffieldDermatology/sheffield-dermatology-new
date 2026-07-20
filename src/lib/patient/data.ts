/**
 * Patient-scoped data access. EVERY function takes the caller's patientId and
 * filters by it — a patient can only ever read rows keyed to their own record.
 * Enforcement lives here in the data layer, not in the UI.
 */
import { and, desc, eq, gte, lt, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  appointments,
  services,
  clinicians,
  documents,
  invoices,
  consents,
  messageThreads,
  messages,
  patients,
} from "@/lib/db/schema";

export async function getPatientProfile(patientId: string) {
  const db = getDb();
  const rows = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  return rows[0] ?? null;
}

export async function getPatientAppointments(patientId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      visitType: appointments.visitType,
      serviceName: services.name,
      clinicianName: clinicians.fullName,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(clinicians, eq(clinicians.id, appointments.clinicianId))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.startsAt));

  const now = new Date();
  return {
    upcoming: rows
      .filter((r) => r.startsAt >= now && r.status !== "cancelled")
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    past: rows.filter((r) => r.startsAt < now || r.status === "cancelled"),
  };
}

/** A single appointment, only if it belongs to this patient. */
export async function getPatientAppointment(patientId: string, appointmentId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, patientId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Patient's own uploaded documents plus clinic documents released to them. */
export async function getPatientVisibleDocuments(patientId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.patientId, patientId))
    .orderBy(desc(documents.createdAt));
  // Patient uploads are always visible to them; clinic documents only once
  // approved and released.
  return rows.filter(
    (d) =>
      !d.deletedAt &&
      (d.kind === "patient_upload" || (d.status === "approved" && d.releasedToPatientAt)),
  );
}

export async function getPatientInvoices(patientId: string) {
  const db = getDb();
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.patientId, patientId))
    .orderBy(desc(invoices.createdAt));
}

export async function getPatientConsents(patientId: string) {
  const db = getDb();
  return db
    .select()
    .from(consents)
    .where(eq(consents.patientId, patientId))
    .orderBy(desc(consents.recordedAt));
}

/** Patient message threads (patient-kind only, scoped to this patient). */
export async function getPatientThreads(patientId: string) {
  const db = getDb();
  return db
    .select()
    .from(messageThreads)
    .where(and(eq(messageThreads.patientId, patientId), eq(messageThreads.kind, "patient")))
    .orderBy(desc(messageThreads.createdAt));
}

/** Messages in a thread, only if the thread belongs to this patient. */
export async function getPatientThreadMessages(patientId: string, threadId: string) {
  const db = getDb();
  const threadRows = await db
    .select()
    .from(messageThreads)
    .where(
      and(
        eq(messageThreads.id, threadId),
        eq(messageThreads.patientId, patientId),
        eq(messageThreads.kind, "patient"),
      ),
    )
    .limit(1);
  if (!threadRows[0]) return null;
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt);
  return { thread: threadRows[0], messages: msgs };
}

export async function getPatientDashboardCounts(patientId: string) {
  const { upcoming } = await getPatientAppointments(patientId);
  const db = getDb();
  const unpaid = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.patientId, patientId),
        inArray(invoices.status, ["issued", "part_paid"]),
      ),
    );
  return { upcomingCount: upcoming.length, unpaidCount: unpaid.length, nextAppointment: upcoming[0] ?? null };
}

export { and, eq, gte, lt };
