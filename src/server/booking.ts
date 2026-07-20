"use server";

/**
 * Booking server actions. Guarantees enforced here (never in the client):
 *  - price is read from the database, never from the request
 *  - the slot is re-validated as free before the appointment is created
 *  - a DB unique index blocks double-booking a clinician/time
 *  - a per-holder idempotency key prevents duplicate submissions
 *  - appointment details are only ever returned to the booking patient/staff
 */
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  services,
  clinicians,
  patients,
  appointments,
  bookingHolds,
  waitingList,
  consents,
} from "@/lib/db/schema";
import { getBookingProvider } from "@/lib/booking/provider";
import { isSlotFree } from "@/lib/booking/availability";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { recordAudit } from "@/lib/audit";
import { queueEmail } from "@/lib/notify";
import { generateToken } from "@/lib/auth/tokens";

const HOLDER_COOKIE = "sd_booking_holder";
const HOLD_MINUTES = 10;

async function holderKey(): Promise<string> {
  const store = await cookies();
  let key = store.get(HOLDER_COOKIE)?.value;
  if (!key) {
    key = generateToken(16);
    store.set(HOLDER_COOKIE, key, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
  }
  return key;
}

async function clientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// ── Availability query (used by the client date picker) ─────────────────

export async function getAvailabilityForDay(input: {
  serviceId: string;
  clinicianId?: string;
  dateISO: string; // YYYY-MM-DD clinic-local
  visitType?: "in_person" | "video";
}): Promise<{ slots: { startsAt: string; clinicianId: string; clinicianName: string; label: string }[] }> {
  const parsed = z
    .object({
      serviceId: z.string().uuid(),
      clinicianId: z.string().uuid().optional(),
      dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      visitType: z.enum(["in_person", "video"]).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { slots: [] };

  const from = new Date(`${parsed.data.dateISO}T00:00:00Z`);
  const to = new Date(`${parsed.data.dateISO}T23:59:59Z`);
  const provider = await getBookingProvider();
  const { clinicTimeLabel } = await import("@/lib/booking/time");
  const slots = await provider.getAvailability({
    serviceId: parsed.data.serviceId,
    clinicianId: parsed.data.clinicianId,
    from,
    to,
    visitType: parsed.data.visitType,
  });
  return {
    slots: slots.map((s) => ({
      startsAt: s.startsAt.toISOString(),
      clinicianId: s.clinicianId,
      clinicianName: s.clinicianName,
      label: clinicTimeLabel(s.startsAt),
    })),
  };
}

// ── Create booking (request-first) ──────────────────────────────────────

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  clinicianId: z.string().uuid(),
  startsAt: z.string().datetime(),
  visitType: z.enum(["in_person", "video"]),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  privacyConsent: z.literal("on"),
  cancellationConsent: z.literal("on"),
  idempotencyKey: z.string().min(8).max(64),
});

export type BookingState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "success";
      outcome: "confirmed" | "request";
      reference: string;
      summary: string;
    };

export async function createBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error:
        "Please complete every required field, choose a time, and agree to the privacy and cancellation terms.",
    };
  }
  const data = parsed.data;

  const ip = await clientIp();
  if (!(await checkRateLimit(RATE_LIMITS.booking, `booking:${ip}`))) {
    return { status: "error", error: "Too many booking attempts. Please try again shortly." };
  }

  const db = getDb();
  const startsAt = new Date(data.startsAt);

  // Idempotency: a repeat submission with the same key returns the same result.
  const priorByKey = await db
    .select()
    .from(appointments)
    .where(sql`${appointments.staffNotes} like ${"%idem:" + data.idempotencyKey + "%"}`)
    .limit(1);
  if (priorByKey[0]) {
    return {
      status: "success",
      outcome: priorByKey[0].status === "confirmed" ? "confirmed" : "request",
      reference: priorByKey[0].id.slice(0, 8).toUpperCase(),
      summary: "Your booking was already received.",
    };
  }

  // Server reads the price and duration from the database — never the client.
  const serviceRows = await db.select().from(services).where(eq(services.id, data.serviceId)).limit(1);
  const service = serviceRows[0];
  if (!service || !service.active) {
    return { status: "error", error: "That appointment type is no longer available." };
  }
  const clinicianRows = await db
    .select()
    .from(clinicians)
    .where(and(eq(clinicians.id, data.clinicianId), eq(clinicians.active, true)))
    .limit(1);
  const clinician = clinicianRows[0];
  if (!clinician) {
    return { status: "error", error: "That clinician is not available. Please choose another time." };
  }

  const key = await holderKey();
  const free = await isSlotFree({
    serviceId: data.serviceId,
    clinicianId: data.clinicianId,
    startsAt,
    holderKey: key,
  });
  if (!free) {
    return {
      status: "error",
      error: "Sorry — that time has just been taken. Please choose another slot.",
    };
  }

  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60000);
  const provider = await getBookingProvider();
  const outcome = provider.bookingOutcome();

  // Link to an existing patient (portal user or matching email) or create one.
  const sessionUser = await getSessionUser();
  let patientId: string | undefined;
  if (sessionUser?.kind === "patient" && sessionUser.patientId) {
    patientId = sessionUser.patientId;
  } else {
    const existing = await db
      .select({ id: patients.id })
      .from(patients)
      .where(sql`lower(${patients.email}) = ${data.email}`)
      .limit(1);
    patientId = existing[0]?.id;
    if (!patientId) {
      const [created] = await db
        .insert(patients)
        .values({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
        })
        .returning({ id: patients.id });
      patientId = created!.id;
    }
  }

  // Create the appointment. The DB unique index enforces no double-booking; a
  // race that slips past isSlotFree fails the insert, which we handle.
  let appointmentId: string;
  try {
    const [created] = await db
      .insert(appointments)
      .values({
        patientId: patientId!,
        clinicianId: data.clinicianId,
        serviceId: data.serviceId,
        startsAt,
        endsAt,
        visitType: data.visitType,
        status: outcome === "confirmed" ? "confirmed" : "requested",
        source: "online",
        staffNotes: [data.notes ? `Patient note: ${data.notes}` : "", `idem:${data.idempotencyKey}`]
          .filter(Boolean)
          .join("\n"),
      })
      .returning({ id: appointments.id });
    appointmentId = created!.id;
  } catch {
    return {
      status: "error",
      error: "Sorry — that time has just been taken. Please choose another slot.",
    };
  }

  // Record booking consents.
  await db.insert(consents).values([
    {
      patientId: patientId!,
      kind: "privacy",
      granted: true,
      wordingVersion: "privacy-draft-1",
      appointmentId,
    },
    {
      patientId: patientId!,
      kind: "treatment",
      granted: true,
      wordingVersion: "cancellation-draft-1",
      appointmentId,
    },
  ]);

  // Release any hold this holder had.
  await db.delete(bookingHolds).where(eq(bookingHolds.holderKey, key));

  // Confirmation email (minimal content; via outbox).
  await queueEmail(
    data.email,
    outcome === "confirmed" ? "booking_confirmed" : "booking_request_received",
    { firstName: data.firstName },
  );

  await recordAudit({
    actorId: sessionUser?.id ?? null,
    actorType: sessionUser ? "patient" : "system",
    action: "booking.created",
    entityType: "appointment",
    entityId: appointmentId,
    ipAddress: ip === "local" ? null : ip,
    detail: { outcome, serviceId: data.serviceId, visitType: data.visitType },
  });

  const { clinicDateLabel, clinicTimeLabel } = await import("@/lib/booking/time");
  const summary = `${service.name} (${data.visitType === "video" ? "Video consultation" : "In person"}) with ${clinician.fullName} on ${clinicDateLabel(startsAt)} at ${clinicTimeLabel(startsAt)}`;

  return {
    status: "success",
    outcome,
    reference: appointmentId.slice(0, 8).toUpperCase(),
    summary,
  };
}

// ── Waiting list ────────────────────────────────────────────────────────

const waitingSchema = z.object({
  serviceId: z.string().uuid().optional().or(z.literal("")),
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  preferences: z.string().trim().max(500).optional().or(z.literal("")),
  privacyConsent: z.literal("on"),
});

export type WaitingState = { status: "idle" } | { status: "error"; error: string } | { status: "success" };

export async function joinWaitingList(
  _prev: WaitingState,
  formData: FormData,
): Promise<WaitingState> {
  const parsed = waitingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: "Please complete your name, a valid email address and agree to the privacy notice." };
  }
  const ip = await clientIp();
  if (!(await checkRateLimit(RATE_LIMITS.booking, `waiting:${ip}`))) {
    return { status: "error", error: "Too many requests. Please try again shortly." };
  }
  const db = getDb();
  await db.insert(waitingList).values({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    serviceId: parsed.data.serviceId || null,
    preferences: parsed.data.preferences || null,
  });
  await recordAudit({ actorType: "system", action: "booking.waiting_list_joined" });
  return { status: "success" };
}
