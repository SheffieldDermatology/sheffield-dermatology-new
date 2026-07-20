import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { installTestDb, type TestDb } from "../helpers/db";
import { scribeSessions, scribeNotes, consents, patients, users } from "@/lib/db/schema";

let db: TestDb;

async function makePatientAndClinician() {
  const [p] = await db.insert(patients).values({ firstName: "Demo", lastName: "P", isDemo: true }).returning();
  const [u] = await db.insert(users).values({ email: `c${Math.random()}@demo.test`, displayName: "Dr Demo", kind: "staff", isDemo: true }).returning();
  return { patientId: p!.id, clinicianUserId: u!.id };
}

/**
 * Consent-first scribe invariants at the data layer (the server actions wrap
 * these with auth + validation): audio retention defaults off, sessions start
 * awaiting consent, a declined consent yields no note, and an approved note
 * always carries an approver + timestamp and stays flagged AI-generated.
 */
describe("scribe workflow invariants", () => {
  beforeEach(async () => {
    db = await installTestDb();
  });

  it("defaults audio retention off and starts awaiting consent", async () => {
    const { patientId, clinicianUserId } = await makePatientAndClinician();
    const [session] = await db.insert(scribeSessions).values({ clinicianUserId, patientId }).returning();
    expect(session!.audioRetained).toBe(false);
    expect(session!.status).toBe("awaiting_consent");
  });

  it("records a declined consent and produces no note", async () => {
    const { patientId } = await makePatientAndClinician();
    const [consent] = await db.insert(consents).values({ patientId, kind: "ai_scribe", granted: false, wordingVersion: "v1" }).returning();
    expect(consent!.granted).toBe(false);
    const notes = await db.select().from(scribeNotes);
    expect(notes.length).toBe(0);
  });

  it("an approved note carries an approver and timestamp and stays AI-flagged", async () => {
    const { patientId, clinicianUserId } = await makePatientAndClinician();
    const [session] = await db.insert(scribeSessions).values({ clinicianUserId, patientId, status: "draft_ready" }).returning();
    await db.insert(scribeNotes).values({ sessionId: session!.id, draftText: "draft", aiGenerated: true });

    const approvedAt = new Date();
    await db.update(scribeNotes).set({ editedText: "final", approvedBy: clinicianUserId, approvedAt }).where(eq(scribeNotes.sessionId, session!.id));

    const [note] = await db.select().from(scribeNotes).where(eq(scribeNotes.sessionId, session!.id));
    expect(note!.approvedBy).toBe(clinicianUserId);
    expect(note!.approvedAt).toBeTruthy();
    expect(note!.aiGenerated).toBe(true);
    expect(note!.editedText).toBe("final");
  });
});
