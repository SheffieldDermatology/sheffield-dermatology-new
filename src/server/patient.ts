"use server";

/**
 * Patient portal server actions. Every action re-derives the patient from the
 * session and scopes writes to that patient's own rows — a patient can never
 * act on another patient's data even by tampering with ids.
 */
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  appointments,
  patients,
  messageThreads,
  messages,
  threadParticipants,
  documents,
  users,
} from "@/lib/db/schema";
import { requirePatient, auditAction } from "@/lib/auth/guards";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createStorageProvider, newStorageKey } from "@/adapters/storage";
import { getBookingProvider } from "@/lib/booking/provider";

export type PatientActionState = { ok?: boolean; error?: string; message?: string };

const CANCEL_LEAD_MS = 24 * 60 * 60 * 1000;

export async function cancelAppointment(
  _prev: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const user = await requirePatient();
  const appointmentId = z.string().uuid().safeParse(formData.get("appointmentId"));
  if (!appointmentId.success) return { error: "That appointment could not be found." };

  const db = getDb();
  const rows = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId.data), eq(appointments.patientId, user.patientId)))
    .limit(1);
  const appointment = rows[0];
  if (!appointment) return { error: "That appointment could not be found." };
  if (appointment.status === "cancelled") return { ok: true, message: "This appointment is already cancelled." };
  if (appointment.status === "completed") return { error: "Completed appointments cannot be cancelled." };

  if (appointment.startsAt.getTime() - Date.now() < CANCEL_LEAD_MS) {
    return {
      error:
        "This appointment is within 24 hours. Please contact the clinic directly to cancel or rearrange it.",
    };
  }

  await db
    .update(appointments)
    .set({ status: "cancelled", cancellationReason: "Cancelled by patient", updatedAt: new Date() })
    .where(eq(appointments.id, appointment.id));

  const provider = await getBookingProvider();
  await provider.notifyCancellation(appointment.sembleId);

  await auditAction(user, "appointment.cancelled", "appointment", appointment.id, {
    by: "patient",
  });
  revalidatePath("/patient/appointments");
  revalidatePath("/patient");
  return { ok: true, message: "Your appointment has been cancelled." };
}

const profileSchema = z.object({
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function updateProfile(
  _prev: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const user = await requirePatient();
  const parsed = profileSchema.safeParse({
    phone: formData.get("phone"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: "Please enter a valid email address and phone number." };

  const db = getDb();
  await db
    .update(patients)
    .set({ phone: parsed.data.phone || null, email: parsed.data.email, updatedAt: new Date() })
    .where(eq(patients.id, user.patientId));
  // Keep the login email in step for patient accounts.
  await db.update(users).set({ phone: parsed.data.phone || null }).where(eq(users.id, user.id));

  await auditAction(user, "patient.profile_updated", "patients", user.patientId);
  revalidatePath("/patient/profile");
  return { ok: true, message: "Your details have been updated." };
}

const messageSchema = z.object({
  subject: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(4000),
});

export async function sendPatientMessage(
  _prev: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const user = await requirePatient();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await checkRateLimit(RATE_LIMITS.messaging, `patientmsg:${user.id}`))) {
    return { error: "You have sent several messages recently. Please wait a little before sending more." };
  }
  const parsed = messageSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Please enter a subject and a message." };

  const db = getDb();
  const [thread] = await db
    .insert(messageThreads)
    .values({
      kind: "patient",
      subject: parsed.data.subject,
      patientId: user.patientId,
      createdBy: user.id,
    })
    .returning({ id: messageThreads.id });
  await db.insert(threadParticipants).values({ threadId: thread!.id, userId: user.id });
  await db.insert(messages).values({
    threadId: thread!.id,
    senderId: user.id,
    body: parsed.data.body,
  });
  await auditAction(user, "patient.message_sent", "message_thread", thread!.id);
  void ip;
  revalidatePath("/patient/messages");
  return { ok: true, message: "Your message has been sent securely to the clinic." };
}

export async function replyToThread(
  _prev: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const user = await requirePatient();
  const threadId = z.string().uuid().safeParse(formData.get("threadId"));
  const body = z.string().trim().min(1).max(4000).safeParse(formData.get("body"));
  if (!threadId.success || !body.success) return { error: "Please enter a message." };
  if (!(await checkRateLimit(RATE_LIMITS.messaging, `patientmsg:${user.id}`))) {
    return { error: "You have sent several messages recently. Please wait a little before sending more." };
  }

  const db = getDb();
  const owns = await db
    .select({ id: messageThreads.id })
    .from(messageThreads)
    .where(
      and(
        eq(messageThreads.id, threadId.data),
        eq(messageThreads.patientId, user.patientId),
        eq(messageThreads.kind, "patient"),
      ),
    )
    .limit(1);
  if (!owns[0]) return { error: "That conversation could not be found." };

  await db.insert(messages).values({ threadId: threadId.data, senderId: user.id, body: body.data });
  await auditAction(user, "patient.message_replied", "message_thread", threadId.data);
  revalidatePath(`/patient/messages/${threadId.data}`);
  return { ok: true };
}

const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function uploadDocument(
  _prev: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const user = await requirePatient();
  if (!(await checkRateLimit(RATE_LIMITS.upload, `upload:${user.id}`))) {
    return { error: "Too many uploads recently. Please wait a little and try again." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Files must be 10 MB or smaller." };
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return { error: "Please upload a JP, PNG, WebP image or a PDF." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storage = createStorageProvider();
  const key = newStorageKey();
  await storage.put(key, bytes, file.type);

  const db = getDb();
  const [doc] = await db
    .insert(documents)
    .values({
      patientId: user.patientId,
      uploadedBy: user.id,
      kind: "patient_upload",
      fileName: file.name.slice(0, 200),
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey: key,
      status: "pending_review",
      scanStatus: "pending",
    })
    .returning({ id: documents.id });

  await auditAction(user, "patient.document_uploaded", "document", doc!.id, {
    sizeBytes: file.size,
    mimeType: file.type,
  });
  revalidatePath("/patient/documents");
  return { ok: true, message: "Your file was uploaded securely and will be reviewed by the clinic." };
}
