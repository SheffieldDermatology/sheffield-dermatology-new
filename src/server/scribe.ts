"use server";

/**
 * AI scribe workflow — CONSENT-FIRST and clinician-approved.
 *
 * Enforced order:
 *   1. A session is created for a verified patient.
 *   2. Patient consent (or refusal) is recorded BEFORE transcription.
 *   3. Transcription only starts after consent === granted.
 *   4. Any AI draft is stored as a DRAFT and clearly labelled.
 *   5. The clinician must review, edit and explicitly APPROVE before it is
 *      saved to the record; the approver and time are recorded.
 *   6. Only an approved note is written to Semble (when connected).
 *
 * Unreviewed AI output is never placed into the clinical record.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scribeSessions, scribeNotes, consents, patients, featureFlags } from "@/lib/db/schema";
import { requirePermission, auditAction } from "@/lib/auth/guards";
import { createScribeProvider } from "@/adapters/heidi";
import { createEhrProvider } from "@/adapters/semble";

export type ScribeActionState = { ok?: boolean; error?: string; sessionId?: string; message?: string };

const startSchema = z.object({ patientId: z.string().uuid() });

/** Step 1: create a session for a verified patient (status awaiting_consent). */
export async function startScribeSession(
  _prev: ScribeActionState,
  formData: FormData,
): Promise<ScribeActionState> {
  const user = await requirePermission("scribe.use");
  const parsed = startSchema.safeParse({ patientId: formData.get("patientId") });
  if (!parsed.success) return { error: "Please choose a patient first." };

  const db = getDb();
  const patientRows = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.id, parsed.data.patientId))
    .limit(1);
  if (!patientRows[0]) return { error: "That patient could not be found." };

  const [session] = await db
    .insert(scribeSessions)
    .values({
      clinicianUserId: user.id,
      patientId: parsed.data.patientId,
      status: "awaiting_consent",
      provider: "dev",
    })
    .returning({ id: scribeSessions.id });

  await auditAction(user, "scribe.session_started", "scribe_session", session!.id);
  return { ok: true, sessionId: session!.id };
}

const consentSchema = z.object({
  sessionId: z.string().uuid(),
  decision: z.enum(["granted", "declined"]),
});

/** Step 2/3: record consent, then (if granted) begin transcription. */
export async function recordScribeConsent(
  _prev: ScribeActionState,
  formData: FormData,
): Promise<ScribeActionState> {
  const user = await requirePermission("scribe.use");
  const parsed = consentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please record the patient's decision." };

  const db = getDb();
  const rows = await db
    .select()
    .from(scribeSessions)
    .where(and(eq(scribeSessions.id, parsed.data.sessionId), eq(scribeSessions.clinicianUserId, user.id)))
    .limit(1);
  const session = rows[0];
  if (!session) return { error: "Scribe session not found." };

  const granted = parsed.data.decision === "granted";
  const [consent] = await db
    .insert(consents)
    .values({
      patientId: session.patientId,
      kind: "ai_scribe",
      granted,
      wordingVersion: "ai-scribe-draft-1",
      recordedBy: user.id,
    })
    .returning({ id: consents.id });

  if (!granted) {
    await db
      .update(scribeSessions)
      .set({ status: "consent_declined", consentId: consent!.id, endedAt: new Date() })
      .where(eq(scribeSessions.id, session.id));
    await auditAction(user, "scribe.consent_declined", "scribe_session", session.id);
    revalidatePath(`/staff/scribe/${session.id}`);
    return { ok: true, message: "Consent declined recorded. Documentation will be written manually." };
  }

  // Consent granted → attempt to start provider transcription.
  const provider = createScribeProvider();
  const started = await provider.startSession({
    scribeSessionId: session.id,
    patientRef: session.patientId,
  });

  await db
    .update(scribeSessions)
    .set({
      consentId: consent!.id,
      status: started.connected ? "recording" : "ready",
      provider: provider.name,
      providerRef: started.providerRef ?? null,
      startedAt: new Date(),
    })
    .where(eq(scribeSessions.id, session.id));

  await auditAction(user, "scribe.consent_granted", "scribe_session", session.id, {
    providerConnected: started.connected,
  });
  revalidatePath(`/staff/scribe/${session.id}`);
  return {
    ok: true,
    message: started.connected
      ? "Consent recorded. Secure transcription has started."
      : "Consent recorded. The transcription provider is not connected in this environment — please document manually or paste a draft to review.",
  };
}

const draftSchema = z.object({
  sessionId: z.string().uuid(),
  draftText: z.string().trim().min(1).max(20000),
});

/**
 * Step 4: save/refresh a DRAFT note. In a connected environment the draft
 * would come from the provider; here a clinician may also paste a draft to
 * review. It is stored as ai-generated draft and never auto-saved to the EHR.
 */
export async function saveScribeDraft(
  _prev: ScribeActionState,
  formData: FormData,
): Promise<ScribeActionState> {
  const user = await requirePermission("scribe.use");
  const parsed = draftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please enter the draft note text." };

  const db = getDb();
  const rows = await db
    .select()
    .from(scribeSessions)
    .where(and(eq(scribeSessions.id, parsed.data.sessionId), eq(scribeSessions.clinicianUserId, user.id)))
    .limit(1);
  const session = rows[0];
  if (!session) return { error: "Scribe session not found." };
  if (session.status === "awaiting_consent" || session.status === "consent_declined") {
    return { error: "A draft can only be created after consent has been given." };
  }

  const existing = await db
    .select({ id: scribeNotes.id })
    .from(scribeNotes)
    .where(eq(scribeNotes.sessionId, session.id))
    .limit(1);
  if (existing[0]) {
    await db
      .update(scribeNotes)
      .set({ draftText: parsed.data.draftText })
      .where(eq(scribeNotes.id, existing[0].id));
  } else {
    await db.insert(scribeNotes).values({
      sessionId: session.id,
      draftText: parsed.data.draftText,
      aiGenerated: true,
    });
  }
  await db
    .update(scribeSessions)
    .set({ status: "draft_ready" })
    .where(eq(scribeSessions.id, session.id));
  await auditAction(user, "scribe.draft_saved", "scribe_session", session.id);
  revalidatePath(`/staff/scribe/${session.id}`);
  return { ok: true, message: "Draft saved. Review and edit it, then approve before saving to the record." };
}

const approveSchema = z.object({
  sessionId: z.string().uuid(),
  editedText: z.string().trim().min(1).max(20000),
});

/**
 * Step 5/6: clinician approves the (edited) note. Only now is it eligible to
 * be written to the record. Approver and time are recorded. Requires the
 * scribe.approve permission.
 */
export async function approveScribeNote(
  _prev: ScribeActionState,
  formData: FormData,
): Promise<ScribeActionState> {
  const user = await requirePermission("scribe.approve");
  const parsed = approveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please review the note text before approving." };

  const db = getDb();
  const rows = await db
    .select()
    .from(scribeSessions)
    .where(eq(scribeSessions.id, parsed.data.sessionId))
    .limit(1);
  const session = rows[0];
  if (!session) return { error: "Scribe session not found." };
  const noteRows = await db
    .select()
    .from(scribeNotes)
    .where(eq(scribeNotes.sessionId, session.id))
    .limit(1);
  const note = noteRows[0];
  if (!note) return { error: "There is no draft to approve." };

  const now = new Date();
  // Attempt to write to the EHR (Semble). Until Semble's verified write API is
  // available this returns saved:false, and the approved note remains stored
  // locally with its audit trail — never lost, never silently discarded.
  const ehr = createEhrProvider();
  const patientRow = await db
    .select({ sembleId: patients.sembleId })
    .from(patients)
    .where(eq(patients.id, session.patientId))
    .limit(1);
  let ehrRef: string | null = null;
  let savedToEhrAt: Date | null = null;
  if (patientRow[0]?.sembleId) {
    const result = await ehr.saveApprovedNote({
      patientSembleId: patientRow[0].sembleId,
      noteText: parsed.data.editedText,
      approvedByName: user.displayName,
      approvedAt: now,
    });
    if (result.saved) {
      ehrRef = result.ehrRef ?? null;
      savedToEhrAt = now;
    }
  }

  await db
    .update(scribeNotes)
    .set({
      editedText: parsed.data.editedText,
      approvedBy: user.id,
      approvedAt: now,
      savedToEhrAt,
      ehrRef,
    })
    .where(eq(scribeNotes.id, note.id));
  await db
    .update(scribeSessions)
    .set({ status: "approved", endedAt: now })
    .where(eq(scribeSessions.id, session.id));

  await auditAction(user, "scribe.note_approved", "scribe_session", session.id, {
    savedToEhr: !!savedToEhrAt,
  });
  revalidatePath(`/staff/scribe/${session.id}`);
  return {
    ok: true,
    message: savedToEhrAt
      ? "Note approved and saved to the clinical record."
      : "Note approved and stored securely. It will be written to the clinical record once Semble is connected.",
  };
}

/** Immediately stops a recording session. */
export async function stopScribeSession(
  _prev: ScribeActionState,
  formData: FormData,
): Promise<ScribeActionState> {
  const user = await requirePermission("scribe.use");
  const sessionId = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!sessionId.success) return { error: "Invalid session." };
  const db = getDb();
  await db
    .update(scribeSessions)
    .set({ status: "abandoned", endedAt: new Date() })
    .where(and(eq(scribeSessions.id, sessionId.data), eq(scribeSessions.clinicianUserId, user.id)));
  await auditAction(user, "scribe.session_stopped", "scribe_session", sessionId.data);
  revalidatePath(`/staff/scribe/${sessionId.data}`);
  return { ok: true, message: "Recording stopped." };
}

export async function audioRetentionEnabled(): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ enabled: featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, "scribe.audio_retention"))
    .limit(1);
  return rows[0]?.enabled ?? false;
}
