/**
 * Staff read queries. Callers must already hold the relevant permission
 * (enforced by requirePermission in the page/action). These functions assume
 * an authorised staff context.
 */
import { and, asc, desc, eq, gte, ilike, lte, or, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  appointments,
  services,
  clinicians,
  patients,
  tasks,
  users,
  invoices,
  documents,
  scribeSessions,
} from "@/lib/db/schema";

export async function getTodaySchedule() {
  const db = getDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86400_000);
  return db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      visitType: appointments.visitType,
      serviceName: services.name,
      clinicianName: clinicians.fullName,
      patientFirst: patients.firstName,
      patientLast: patients.lastName,
      patientId: patients.id,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(clinicians, eq(clinicians.id, appointments.clinicianId))
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .where(and(gte(appointments.startsAt, start), lte(appointments.startsAt, end)))
    .orderBy(asc(appointments.startsAt));
}

export async function getWeekSchedule(weekStart: Date) {
  const db = getDb();
  const end = new Date(weekStart.getTime() + 7 * 86400_000);
  return db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      visitType: appointments.visitType,
      serviceName: services.name,
      clinicianName: clinicians.fullName,
      patientFirst: patients.firstName,
      patientLast: patients.lastName,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(clinicians, eq(clinicians.id, appointments.clinicianId))
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .where(
      and(
        gte(appointments.startsAt, weekStart),
        lte(appointments.startsAt, end),
        inArray(appointments.status, ["requested", "confirmed", "completed"]),
      ),
    )
    .orderBy(asc(appointments.startsAt));
}

export async function getDashboardMetrics() {
  const db = getDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86400_000);

  const [todayAppts] = await db
    .select({ n: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        gte(appointments.startsAt, start),
        lte(appointments.startsAt, end),
        inArray(appointments.status, ["requested", "confirmed", "completed"]),
      ),
    );
  const [openTasks] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tasks)
    .where(inArray(tasks.status, ["open", "in_progress"]));
  const [pendingRequests] = await db
    .select({ n: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.status, "requested"));
  const [pendingDocs] = await db
    .select({ n: sql<number>`count(*)` })
    .from(documents)
    .where(eq(documents.status, "pending_review"));

  return {
    todayAppointments: Number(todayAppts?.n ?? 0),
    openTasks: Number(openTasks?.n ?? 0),
    pendingRequests: Number(pendingRequests?.n ?? 0),
    pendingDocuments: Number(pendingDocs?.n ?? 0),
  };
}

export async function searchPatients(query: string, limit = 50) {
  const db = getDb();
  const q = query.trim();
  const base = db
    .select({
      id: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      email: patients.email,
      phone: patients.phone,
      isDemo: patients.isDemo,
      createdAt: patients.createdAt,
    })
    .from(patients);
  if (q) {
    return base
      .where(
        or(
          ilike(patients.firstName, `%${q}%`),
          ilike(patients.lastName, `%${q}%`),
          ilike(patients.email, `%${q}%`),
        ),
      )
      .orderBy(asc(patients.lastName))
      .limit(limit);
  }
  return base.orderBy(desc(patients.createdAt)).limit(limit);
}

export async function getPatientRecord(patientId: string) {
  const db = getDb();
  const rows = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  const patient = rows[0];
  if (!patient) return null;
  const appts = await db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
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
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.patientId, patientId))
    .orderBy(desc(documents.createdAt));
  return { patient, appointments: appts, documents: docs };
}

export async function getTasks(filter: { assigneeId?: string; status?: string } = {}) {
  const db = getDb();
  const conditions = [];
  if (filter.assigneeId) conditions.push(eq(tasks.assigneeId, filter.assigneeId));
  if (filter.status) conditions.push(eq(tasks.status, filter.status as "open"));
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      status: tasks.status,
      dueAt: tasks.dueAt,
      assigneeId: tasks.assigneeId,
      assigneeName: users.displayName,
      teamRole: tasks.teamRole,
      patientId: tasks.patientId,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(tasks.status), desc(tasks.priority), asc(tasks.dueAt));
  return rows;
}

export async function getStaffUsers() {
  const db = getDb();
  return db
    .select({ id: users.id, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.kind, "staff"))
    .orderBy(asc(users.displayName));
}

export async function getBillingOverview() {
  const db = getDb();
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      totalPence: invoices.totalPence,
      currency: invoices.currency,
      payerType: invoices.payerType,
      createdAt: invoices.createdAt,
      patientFirst: patients.firstName,
      patientLast: patients.lastName,
    })
    .from(invoices)
    .innerJoin(patients, eq(patients.id, invoices.patientId))
    .orderBy(desc(invoices.createdAt))
    .limit(200);
  const totals = { outstanding: 0, paid: 0 };
  for (const r of rows) {
    if (r.status === "paid") totals.paid += r.totalPence;
    else if (r.status === "issued" || r.status === "part_paid") totals.outstanding += r.totalPence;
  }
  return { rows, totals };
}

export async function getScribeSession(sessionId: string) {
  const db = getDb();
  const rows = await db.select().from(scribeSessions).where(eq(scribeSessions.id, sessionId)).limit(1);
  return rows[0] ?? null;
}

export { and, eq, desc, asc };
