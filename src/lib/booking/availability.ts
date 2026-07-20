/**
 * Local availability engine. Generates genuine bookable slots from a
 * clinician's availability rules, minus exceptions, existing appointments and
 * active holds. This is the source of truth until Semble booking is connected.
 */
import { and, eq, gte, lte, or, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  services,
  clinicians,
  availabilityRules,
  availabilityExceptions,
  appointments,
  bookingHolds,
} from "@/lib/db/schema";
import {
  clinicWallClockToUtc,
  clinicDateString,
  clinicWeekday,
  parseTime,
} from "./time";

export interface Slot {
  clinicianId: string;
  clinicianName: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  visitType: "in_person" | "video";
}

const SLOT_STEP_MINUTES = 15;
const MIN_LEAD_HOURS = 24; // earliest bookable slot is 24h out
const MAX_ADVANCE_DAYS = 60;

/** Removes expired holds so they don't block availability. */
export async function purgeExpiredHolds(): Promise<void> {
  const db = getDb();
  const { lt } = await import("drizzle-orm");
  await db.delete(bookingHolds).where(lt(bookingHolds.expiresAt, new Date()));
}

export async function getBookableServices() {
  const db = getDb();
  return db.select().from(services).where(eq(services.active, true)).orderBy(services.sortOrder);
}

export async function getActiveClinicians() {
  const db = getDb();
  return db.select().from(clinicians).where(eq(clinicians.active, true));
}

/**
 * Generates available slots for a service between two dates (inclusive of the
 * clinic-local days those instants fall on).
 */
export async function generateAvailability(input: {
  serviceId: string;
  clinicianId?: string;
  from: Date;
  to: Date;
  visitType?: "in_person" | "video";
}): Promise<Slot[]> {
  const db = getDb();
  await purgeExpiredHolds();

  const serviceRows = await db
    .select()
    .from(services)
    .where(eq(services.id, input.serviceId))
    .limit(1);
  const service = serviceRows[0];
  if (!service || !service.active) return [];

  const clinicianRows = await db
    .select()
    .from(clinicians)
    .where(
      input.clinicianId
        ? and(eq(clinicians.active, true), eq(clinicians.id, input.clinicianId))
        : eq(clinicians.active, true),
    );
  if (clinicianRows.length === 0) return [];
  const clinicianIds = clinicianRows.map((c) => c.id);
  const clinicianName = new Map(clinicianRows.map((c) => [c.id, c.fullName]));

  const rules = await db
    .select()
    .from(availabilityRules)
    .where(inArray(availabilityRules.clinicianId, clinicianIds));

  const now = Date.now();
  const earliest = now + MIN_LEAD_HOURS * 3600_000;
  const latest = now + MAX_ADVANCE_DAYS * 86400_000;

  const windowStart = new Date(Math.max(input.from.getTime(), now));
  const windowEnd = new Date(Math.min(input.to.getTime(), latest));
  if (windowStart > windowEnd) return [];

  // Existing appointments (requested/confirmed) and holds in the window.
  const busyAppointments = await db
    .select({
      clinicianId: appointments.clinicianId,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
    })
    .from(appointments)
    .where(
      and(
        inArray(appointments.clinicianId, clinicianIds),
        or(eq(appointments.status, "requested"), eq(appointments.status, "confirmed")),
        gte(appointments.endsAt, windowStart),
        lte(appointments.startsAt, windowEnd),
      ),
    );
  const holds = await db
    .select({
      clinicianId: bookingHolds.clinicianId,
      startsAt: bookingHolds.startsAt,
      endsAt: bookingHolds.endsAt,
    })
    .from(bookingHolds)
    .where(
      and(
        inArray(bookingHolds.clinicianId, clinicianIds),
        gte(bookingHolds.endsAt, windowStart),
        lte(bookingHolds.startsAt, windowEnd),
      ),
    );
  const busy = [...busyAppointments, ...holds];

  const exceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(inArray(availabilityExceptions.clinicianId, clinicianIds));

  const duration = service.durationMinutes;
  const slots: Slot[] = [];

  // Iterate day by day across the clinic-local window.
  for (
    let cursor = new Date(windowStart);
    cursor <= windowEnd;
    cursor = new Date(cursor.getTime() + 86400_000)
  ) {
    const dateStr = clinicDateString(cursor);
    const weekday = clinicWeekday(cursor);
    const [y, m, d] = dateStr.split("-").map(Number);

    for (const clinician of clinicianRows) {
      const dayRules = rules.filter(
        (r) =>
          r.clinicianId === clinician.id &&
          r.weekday === weekday &&
          (!input.visitType || !r.visitType || r.visitType === input.visitType),
      );
      for (const rule of dayRules) {
        const start = parseTime(rule.startTime);
        const end = parseTime(rule.endTime);
        const windowStartUtc = clinicWallClockToUtc(y!, m!, d!, start.hour, start.minute);
        const windowEndUtc = clinicWallClockToUtc(y!, m!, d!, end.hour, end.minute);

        for (
          let t = windowStartUtc.getTime();
          t + duration * 60000 <= windowEndUtc.getTime();
          t += SLOT_STEP_MINUTES * 60000
        ) {
          const slotStart = new Date(t);
          const slotEnd = new Date(t + duration * 60000);
          if (slotStart.getTime() < earliest) continue;

          // Skip full-day or overlapping exceptions.
          const blockedByException = exceptions.some((ex) => {
            if (ex.clinicianId !== clinician.id) return false;
            if (ex.date !== dateStr) return false;
            if (!ex.startTime || !ex.endTime) return true; // whole-day block
            const exStart = clinicWallClockToUtc(
              y!,
              m!,
              d!,
              parseTime(ex.startTime).hour,
              parseTime(ex.startTime).minute,
            );
            const exEnd = clinicWallClockToUtc(
              y!,
              m!,
              d!,
              parseTime(ex.endTime).hour,
              parseTime(ex.endTime).minute,
            );
            return slotStart < exEnd && slotEnd > exStart;
          });
          if (blockedByException) continue;

          const overlapsBusy = busy.some(
            (b) =>
              b.clinicianId === clinician.id &&
              slotStart < b.endsAt &&
              slotEnd > b.startsAt,
          );
          if (overlapsBusy) continue;

          const visitType =
            input.visitType ?? (rule.visitType as "in_person" | "video" | null) ?? "in_person";
          slots.push({
            clinicianId: clinician.id,
            clinicianName: clinicianName.get(clinician.id) ?? "Clinician",
            serviceId: service.id,
            startsAt: slotStart,
            endsAt: slotEnd,
            visitType,
          });
        }
      }
    }
  }

  slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return slots;
}

/** Verifies a specific slot is still genuinely free (server-side re-check). */
export async function isSlotFree(input: {
  serviceId: string;
  clinicianId: string;
  startsAt: Date;
  holderKey?: string;
}): Promise<boolean> {
  const db = getDb();
  await purgeExpiredHolds();
  const serviceRows = await db
    .select()
    .from(services)
    .where(eq(services.id, input.serviceId))
    .limit(1);
  const service = serviceRows[0];
  if (!service) return false;
  const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60000);

  const conflictingAppts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicianId, input.clinicianId),
        or(eq(appointments.status, "requested"), eq(appointments.status, "confirmed")),
      ),
    );
  // Load candidate appointments and check overlap in JS (small clinic volumes).
  const overlapping = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicianId, input.clinicianId),
        or(eq(appointments.status, "requested"), eq(appointments.status, "confirmed")),
        lte(appointments.startsAt, endsAt),
        gte(appointments.endsAt, input.startsAt),
      ),
    );
  if (overlapping.length > 0) return false;
  void conflictingAppts;

  const holds = await db
    .select()
    .from(bookingHolds)
    .where(
      and(
        eq(bookingHolds.clinicianId, input.clinicianId),
        lte(bookingHolds.startsAt, endsAt),
        gte(bookingHolds.endsAt, input.startsAt),
      ),
    );
  // A hold belonging to this holder does not block their own booking.
  const blockingHold = holds.some((h) => h.holderKey !== input.holderKey);
  return !blockingHold;
}
