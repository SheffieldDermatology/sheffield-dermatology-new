/**
 * Development seed data — FICTIONAL demonstration data only.
 *
 * Every person here is invented and clearly labelled "Demo". No realistic
 * addresses, NHS numbers or medical histories are created. The script
 * REFUSES to run in production. `npm run db:seed`.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { runMigrations } from "../src/lib/db/migrate";
import {
  users,
  credentials,
  userRoles,
  mfaSecrets,
  patients,
  services,
  clinicians,
  availabilityRules,
  fileLibraries,
  formTemplates,
  featureFlags,
  integrationState,
  ownerInputs,
  settings,
  tasks,
} from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/passwords";
import { encryptSecret } from "../src/lib/auth/tokens";

if (process.env.NODE_ENV === "production") {
  console.error("Seeding is forbidden in production. No demonstration data may exist there.");
  process.exit(1);
}

const DEV_PASSWORD = "DevPassword123!";
// Fixed 20-byte base32 secret — DEVELOPMENT sign-in convenience ONLY. Real
// staff enrol their own authenticator on first sign-in; this never ships to
// production (seeding is blocked there).
const DEV_ADMIN_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

async function main() {
  const db = getDb();
  await runMigrations(db);

  const passwordHash = await hashPassword(DEV_PASSWORD);

  // ── Staff accounts (fictional) ──────────────────────────────────────
  const staffAccounts = [
    { email: "admin@demo.sheffielddermatology.test", name: "Demo Administrator", role: "system_admin" as const, mfa: true },
    { email: "consultant@demo.sheffielddermatology.test", name: "Demo Consultant", role: "consultant" as const, mfa: true },
    { email: "nurse@demo.sheffielddermatology.test", name: "Demo Nurse", role: "nurse" as const, mfa: false },
    { email: "reception@demo.sheffielddermatology.test", name: "Demo Receptionist", role: "receptionist" as const, mfa: false },
    { email: "finance@demo.sheffielddermatology.test", name: "Demo Finance", role: "finance" as const, mfa: false },
    { email: "auditor@demo.sheffielddermatology.test", name: "Demo Auditor", role: "auditor" as const, mfa: false },
  ];

  async function ensureUser(
    email: string,
    displayName: string,
    kind: "staff" | "patient",
  ): Promise<typeof users.$inferSelect> {
    const existing = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);
    if (existing[0]) return existing[0];
    const [created] = await db
      .insert(users)
      .values({
        email,
        displayName,
        kind,
        status: "active",
        emailVerifiedAt: new Date(),
        isDemo: true,
      })
      .returning();
    return created!;
  }

  const staffIds = new Map<string, string>();
  for (const account of staffAccounts) {
    const user = await ensureUser(account.email, account.name, "staff");
    staffIds.set(account.role, user.id);
    await db
      .insert(credentials)
      .values({ userId: user.id, passwordHash })
      .onConflictDoNothing();
    await db
      .insert(userRoles)
      .values({ userId: user.id, role: account.role })
      .onConflictDoNothing();
    if (account.mfa) {
      await db
        .insert(mfaSecrets)
        .values({
          userId: user.id,
          secretEncrypted: encryptSecret(DEV_ADMIN_TOTP_SECRET),
          confirmedAt: new Date(),
          recoveryCodeHashes: [],
        })
        .onConflictDoNothing();
    }
  }

  // ── Demo patient with portal account ────────────────────────────────
  const patientUser = await ensureUser(
    "patient@demo.sheffielddermatology.test",
    "Demo Patient One",
    "patient",
  );
  {
    await db
      .insert(credentials)
      .values({ userId: patientUser.id, passwordHash })
      .onConflictDoNothing();
    await db
      .insert(userRoles)
      .values({ userId: patientUser.id, role: "patient" })
      .onConflictDoNothing();
    await db
      .insert(patients)
      .values({
        userId: patientUser.id,
        firstName: "Demo",
        lastName: "Patient One",
        email: "patient@demo.sheffielddermatology.test",
        isDemo: true,
      })
      .onConflictDoNothing();
  }

  // Additional demo patients without portal accounts.
  const patientCount = await db.select().from(patients);
  if (patientCount.length <= 1) {
    for (const n of ["Two", "Three", "Four"]) {
      await db.insert(patients).values({ firstName: "Demo", lastName: `Patient ${n}`, isDemo: true });
    }
  }

  // ── Clinician ───────────────────────────────────────────────────────
  // Real name supplied by the owner; no qualifications or GMC number are
  // invented — those fields stay null until verified (see OWNER_INPUTS.md).
  const existingClinician = await db.select().from(clinicians).limit(1);
  let clinicianId = existingClinician[0]?.id;
  if (!clinicianId) {
    const [clinician] = await db
      .insert(clinicians)
      .values({
        fullName: "Dr Vinod Elangasinghe",
        title: "Consultant Dermatologist",
        userId: staffIds.get("consultant"),
        active: true,
      })
      .returning();
    clinicianId = clinician!.id;
  }

  // ── Services (draft list — pending clinical approval) ───────────────
  const serviceRows = [
    { slug: "mole-assessment", name: "Mole or skin lesion assessment", shortDescription: "New, changing or concerning moles and other skin lesions.", durationMinutes: 30, sortOrder: 1 },
    { slug: "acne-rosacea", name: "Acne or rosacea consultation", shortDescription: "Breakouts, redness or sensitive skin.", durationMinutes: 30, sortOrder: 2 },
    { slug: "eczema-psoriasis", name: "Eczema or psoriasis consultation", shortDescription: "Persistent or complex inflammatory skin conditions.", durationMinutes: 30, sortOrder: 3 },
    { slug: "hair-scalp-nails", name: "Hair, scalp or nail consultation", shortDescription: "Hair loss, scalp symptoms or nail changes.", durationMinutes: 30, sortOrder: 4 },
    { slug: "general-dermatology", name: "General dermatology consultation", shortDescription: "Rashes, pigmentation and other adult skin concerns.", durationMinutes: 45, sortOrder: 5 },
    { slug: "follow-up", name: "Follow-up appointment", shortDescription: "Review of an existing treatment plan.", durationMinutes: 20, sortOrder: 6 },
  ];
  for (const row of serviceRows) {
    await db.insert(services).values(row).onConflictDoNothing();
  }

  // ── Draft availability (owner must confirm real clinic hours) ──────
  const existingRules = await db.select().from(availabilityRules).limit(1);
  if (existingRules.length === 0 && clinicianId) {
    for (const weekday of [1, 2, 3, 4, 5]) {
      await db.insert(availabilityRules).values({
        clinicianId,
        weekday,
        startTime: "09:00",
        endTime: "17:00",
      });
    }
  }

  // ── Team file libraries ─────────────────────────────────────────────
  const libraries = [
    { slug: "clinic-operations", name: "Clinic operations", description: "Checklists, rotas and operational documents.", sortOrder: 1 },
    { slug: "clinical-policies", name: "Clinical policies", description: "Approved clinical policies and guidance.", sortOrder: 2 },
    { slug: "patient-resources", name: "Patient resources", description: "Leaflets and information sheets for patients.", sortOrder: 3 },
    { slug: "letter-templates", name: "Letter templates", description: "Referral and clinic letter templates.", sortOrder: 4 },
    { slug: "finance-insurers", name: "Finance & insurers", description: "Fee schedules and insurer documents.", restrictedToRoles: ["system_admin", "clinical_admin", "finance"], sortOrder: 5 },
  ];
  for (const library of libraries) {
    await db.insert(fileLibraries).values(library).onConflictDoNothing();
  }

  // ── Intake form template ───────────────────────────────────────────
  await db
    .insert(formTemplates)
    .values({
      slug: "new-patient-intake",
      name: "New patient details",
      description: "Basic details we need before your first appointment.",
      fields: [
        { key: "gp_practice", label: "Your GP practice (optional)", type: "text", required: false },
        { key: "current_medication", label: "Current medication", type: "textarea", required: false, helpText: "List any regular medication, or write 'none'." },
        { key: "allergies", label: "Known allergies", type: "textarea", required: false },
        { key: "concern_duration", label: "How long have you had this concern?", type: "select", required: true, options: ["Less than a month", "1–6 months", "6–12 months", "More than a year"] },
        { key: "photos_consent", label: "I consent to medical photography if clinically needed", type: "checkbox", required: false },
      ],
    })
    .onConflictDoNothing();

  // ── Feature flags (conservative defaults) ───────────────────────────
  const flags = [
    { key: "scribe.audio_retention", enabled: false, description: "Retain consultation audio (requires DPIA, consent wording and supplier agreements — see CLINICAL_SAFETY.md)." },
    { key: "payments.online", enabled: false, description: "Take card payments online (requires payment provider configuration and owner decision on deposits)." },
    { key: "booking.live", enabled: false, description: "Confirmed-slot booking via connected provider. Off = request-only booking." },
    { key: "sms.reminders", enabled: false, description: "Send SMS appointment reminders (requires SMS provider)." },
  ];
  for (const flag of flags) {
    await db.insert(featureFlags).values(flag).onConflictDoNothing();
  }

  // ── Integration states ─────────────────────────────────────────────
  for (const provider of ["semble", "heidi", "payments", "email", "sms", "storage"]) {
    await db
      .insert(integrationState)
      .values({ provider, status: provider === "storage" ? "ok" : "not_configured" })
      .onConflictDoNothing();
  }

  // ── Consent wording (DRAFT — requires clinical approval) ────────────
  await db
    .insert(settings)
    .values({
      key: "consent.ai_scribe.wording",
      value: {
        version: "draft-1",
        status: "draft_pending_approval",
        text:
          "We would like to use an AI-assisted scribe (Heidi) to help write the notes for " +
          "today's consultation. The conversation is transcribed in real time to draft a " +
          "clinical note; audio is not kept. Your clinician reviews, corrects and approves " +
          "every note before it is saved to your record. You can say no, or change your " +
          "mind at any point, and it will not affect your care in any way.",
      },
    })
    .onConflictDoNothing();

  // ── Owner-input checklist (mirrors OWNER_INPUTS.md) ────────────────
  const inputs: (typeof ownerInputs.$inferInsert)[] = [
    { key: "clinic.legal_entity", section: "Clinic identity", title: "Legal entity / data controller name", why: "UK GDPR requires a named data controller.", whereShown: "Privacy notice, terms, invoices", blocksProduction: true, safeDefault: "None — must be supplied" },
    { key: "clinic.ico_registration", section: "Clinic identity", title: "ICO registration number", why: "Data-controller registration evidence.", whereShown: "Privacy notice", blocksProduction: true, safeDefault: "None" },
    { key: "clinic.address", section: "Clinic identity", title: "Clinic street address", why: "Contact page, confirmations, invoices.", whereShown: "Contact page, footer, emails", blocksProduction: true, safeDefault: "Shown as 'to be confirmed'" },
    { key: "clinic.phone", section: "Clinic identity", title: "Clinic telephone number", why: "Patient contact and urgent signposting.", whereShown: "Header, contact page", blocksProduction: true, safeDefault: "Hidden until supplied" },
    { key: "clinic.email", section: "Clinic identity", title: "Clinic email address", why: "Patient contact and reply-to address.", whereShown: "Contact page, emails", blocksProduction: true, safeDefault: "Contact form only" },
    { key: "clinic.opening_hours", section: "Clinic identity", title: "Opening hours", why: "Contact page and booking rules.", whereShown: "Contact page", blocksProduction: false, safeDefault: "Shown as 'to be confirmed'" },
    { key: "clinic.cqc", section: "Compliance", title: "CQC registration status", why: "Independent providers in England normally require CQC registration.", whereShown: "Footer, about page", blocksProduction: true, safeDefault: "Assessment required" },
    { key: "clinician.qualifications", section: "Clinician", title: "Qualifications for Dr Elangasinghe", why: "Cannot be invented; must be verified.", whereShown: "About page", blocksProduction: true, safeDefault: "Labelled 'to be confirmed'" },
    { key: "clinician.gmc", section: "Clinician", title: "GMC registration number", why: "Verifiable professional registration.", whereShown: "About page", blocksProduction: true, safeDefault: "Omitted until verified" },
    { key: "clinician.biography", section: "Clinician", title: "Approved biography", why: "Cannot invent clinical experience.", whereShown: "About page", blocksProduction: true, safeDefault: "Neutral copy without claims" },
    { key: "clinician.insurers", section: "Clinician", title: "Insurer recognition list", why: "Cannot invent insurer recognition.", whereShown: "Insurance page", blocksProduction: true, safeDefault: "General explanation only" },
    { key: "services.approval", section: "Services", title: "Clinical approval of service list", why: "Draft list must be approved before publication.", whereShown: "Public services, booking", blocksProduction: true, safeDefault: "Draft flagged in admin", status: "partial" },
    { key: "services.prices", section: "Services", title: "Consultation and procedure prices", why: "Prices cannot be invented; consumer law requires accuracy.", whereShown: "Fees page, booking, invoices", blocksProduction: true, safeDefault: "'Fee confirmed on booking'" },
    { key: "booking.deposits", section: "Services", title: "Deposit policy", why: "Configures the booking payment step.", whereShown: "Booking checkout", blocksProduction: true, safeDefault: "Deposits disabled" },
    { key: "booking.cancellation", section: "Services", title: "Cancellation rules and fees", why: "Cancellation policy page and refund logic.", whereShown: "Cancellation policy", blocksProduction: true, safeDefault: "Free cancellation ≥48h, no online fees" },
    { key: "integrations.semble", section: "Integrations", title: "Semble account and API credentials", why: "Live availability, appointments and records.", whereShown: "Server environment", blocksProduction: true, safeDefault: "Request-only booking" },
    { key: "integrations.heidi", section: "Integrations", title: "Heidi account / integration route", why: "AI scribe transcription.", whereShown: "Server environment", blocksProduction: true, safeDefault: "Scribe marked 'not connected'" },
    { key: "integrations.payments", section: "Integrations", title: "Payment provider decision and account", why: "Deposits and balance payments.", whereShown: "Server environment", blocksProduction: true, safeDefault: "Payments disabled" },
    { key: "integrations.email", section: "Integrations", title: "Transactional email provider", why: "Booking confirmations and portal invitations.", whereShown: "Server environment", blocksProduction: true, safeDefault: "In-app outbox only" },
    { key: "integrations.video", section: "Integrations", title: "Video consultation platform", why: "Video appointment joining links.", whereShown: "Booking, patient portal", blocksProduction: true, safeDefault: "'Link sent after confirmation'" },
    { key: "governance.dpo", section: "Governance", title: "Data protection lead / DPO", why: "UK GDPR accountability.", whereShown: "Privacy notice", blocksProduction: true, safeDefault: "None" },
    { key: "governance.dpia", section: "Governance", title: "DPIA sign-off", why: "Special-category processing requires assessment.", whereShown: "Compliance records", blocksProduction: true, safeDefault: "Draft structure in SECURITY.md" },
    { key: "governance.clinical_safety", section: "Governance", title: "Clinical safety sign-off (DCB0129/0160)", why: "See CLINICAL_SAFETY.md.", whereShown: "Compliance records", blocksProduction: true, safeDefault: "Assessment drafted", status: "partial" },
    { key: "governance.retention", section: "Governance", title: "Record retention schedule", why: "Deletion/retention automation.", whereShown: "Admin retention settings", blocksProduction: true, safeDefault: "Retain everything, no automated deletion" },
    { key: "governance.legal_review", section: "Governance", title: "Legal review of privacy/cookies/terms", why: "Legal documents need professional review.", whereShown: "Public legal pages", blocksProduction: true, safeDefault: "Drafts marked 'pending review'", status: "partial" },
    { key: "content.clinical_review", section: "Content", title: "Clinical review of condition pages", why: "Medical content must be clinician-approved.", whereShown: "All condition pages", blocksProduction: true, safeDefault: "Flagged in admin" },
    { key: "content.ai_consent_wording", section: "Content", title: "Approval of AI-scribe consent wording", why: "Consent text is a governance decision.", whereShown: "Scribe consent screen", blocksProduction: true, safeDefault: "Draft provided", status: "partial" },
  ];
  for (const input of inputs) {
    await db.insert(ownerInputs).values(input).onConflictDoNothing();
  }

  // ── A few demo tasks so the staff dashboard has content ────────────
  const consultantId = staffIds.get("consultant");
  const existingTasks = await db.select().from(tasks).limit(1);
  if (existingTasks.length === 0 && consultantId) {
    await db.insert(tasks).values([
      { title: "Review pathology result", description: "Demonstration task.", priority: "urgent", status: "open", assigneeId: consultantId, createdBy: staffIds.get("system_admin"), dueAt: new Date(Date.now() + 4 * 3600_000), isDemo: true },
      { title: "Approve clinic letter", description: "Demonstration task.", priority: "normal", status: "open", assigneeId: consultantId, createdBy: staffIds.get("system_admin"), dueAt: new Date(Date.now() + 24 * 3600_000), isDemo: true },
      { title: "Insurance pre-authorisation", description: "Demonstration task.", priority: "high", status: "open", teamRole: "receptionist", createdBy: staffIds.get("system_admin"), dueAt: new Date(Date.now() + 48 * 3600_000), isDemo: true },
    ]);
  }

  console.log("Seed complete. Development sign-ins (fictional demo accounts):");
  console.log(`  Staff:   admin@demo.sheffielddermatology.test / ${DEV_PASSWORD} (TOTP secret ${DEV_ADMIN_TOTP_SECRET})`);
  console.log(`           consultant@demo.sheffielddermatology.test / ${DEV_PASSWORD} (TOTP secret ${DEV_ADMIN_TOTP_SECRET})`);
  console.log(`           nurse@/reception@/finance@/auditor@… / ${DEV_PASSWORD} (MFA enrolment on first sign-in)`);
  console.log(`  Patient: patient@demo.sheffielddermatology.test / ${DEV_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
