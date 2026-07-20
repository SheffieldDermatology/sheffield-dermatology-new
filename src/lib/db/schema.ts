/**
 * Sheffield Dermatology — operational database schema.
 *
 * Principle: Semble remains the clinical system of record. Tables here hold
 * operational data (accounts, booking requests, tasks, files metadata,
 * invoices, audit) plus minimal cached projections keyed by `sembleId` where
 * the integration is connected. No full clinical record is duplicated.
 *
 * All demonstration rows carry `isDemo: true` and are refused in production
 * by the seed script.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  bigserial,
  jsonb,
  date,
  time,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────────────

export const userKindEnum = pgEnum("user_kind", ["staff", "patient"]);
export const userStatusEnum = pgEnum("user_status", ["invited", "active", "locked", "disabled"]);
export const roleEnum = pgEnum("role", [
  "system_admin",
  "clinical_admin",
  "consultant",
  "nurse",
  "receptionist",
  "finance",
  "auditor",
  "patient",
]);
export const tokenKindEnum = pgEnum("token_kind", ["password_reset", "invite", "email_verify"]);
export const visitTypeEnum = pgEnum("visit_type", ["in_person", "video"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "requested",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
  "declined",
]);
export const appointmentSourceEnum = pgEnum("appointment_source", ["online", "staff", "semble"]);
export const consentKindEnum = pgEnum("consent_kind", [
  "privacy",
  "ai_scribe",
  "photography",
  "treatment",
  "communications",
]);
export const documentKindEnum = pgEnum("document_kind", [
  "patient_upload",
  "clinic_letter",
  "result",
  "invoice_pdf",
  "form_attachment",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "pending_review",
  "approved",
  "rejected",
]);
export const scanStatusEnum = pgEnum("scan_status", ["pending", "clean", "infected", "unavailable"]);
export const fileEntryKindEnum = pgEnum("file_entry_kind", ["folder", "file"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "normal", "high", "urgent"]);
export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
]);
export const threadKindEnum = pgEnum("thread_kind", ["staff", "patient"]);
export const outboxStatusEnum = pgEnum("outbox_status", ["queued", "sent", "failed", "suppressed"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "part_paid",
  "paid",
  "void",
  "refunded",
]);
export const payerTypeEnum = pgEnum("payer_type", ["self", "insurer"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "card_online",
  "card_terminal",
  "bank_transfer",
  "insurer",
  "other",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);
export const scribeStatusEnum = pgEnum("scribe_status", [
  "awaiting_consent",
  "consent_declined",
  "ready",
  "recording",
  "processing",
  "draft_ready",
  "approved",
  "abandoned",
]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "done", "failed", "dead"]);
export const integrationStatusEnum = pgEnum("integration_status", [
  "not_configured",
  "ok",
  "error",
  "disabled",
]);
export const ownerInputStatusEnum = pgEnum("owner_input_status", [
  "missing",
  "partial",
  "supplied",
  "verified",
]);
export const waitingListStatusEnum = pgEnum("waiting_list_status", [
  "open",
  "contacted",
  "booked",
  "closed",
]);

// ── Identity & access ────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    kind: userKindEnum("kind").notNull(),
    status: userStatusEnum("status").notNull().default("invited"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`)],
);

export const credentials = pgTable("credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).notNull().defaultNow(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
});

export const mfaSecrets = pgTable("mfa_secrets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  secretEncrypted: text("secret_encrypted").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  recoveryCodeHashes: jsonb("recovery_code_hashes").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    grantedBy: uuid("granted_by").references(() => users.id),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

export const sessions = pgTable(
  "sessions",
  {
    // Primary key is the SHA-256 hash of the session token; the raw token
    // exists only in the user's cookie.
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mfaVerified: boolean("mfa_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: tokenKindEnum("kind").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("auth_tokens_hash_unique").on(t.tokenHash)],
);

// ── Patients (portal identity; clinical record stays in Semble) ─────────

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: date("date_of_birth"),
    email: text("email"),
    phone: text("phone"),
    sembleId: text("semble_id"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("patients_user_idx").on(t.userId),
    uniqueIndex("patients_semble_unique")
      .on(t.sembleId)
      .where(sql`${t.sembleId} is not null`),
  ],
);

// ── Services, clinicians, availability ──────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    // Price is nullable on purpose: prices are an owner input and must never
    // be invented. Null renders as "fee confirmed on booking".
    pricePence: integer("price_pence"),
    depositPence: integer("deposit_pence"),
    active: boolean("active").notNull().default(true),
    // Clinical approval gate — unapproved services are flagged in admin.
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    sembleId: text("semble_id"),
  },
  (t) => [uniqueIndex("services_slug_unique").on(t.slug)],
);

export const clinicians = pgTable("clinicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  title: text("title").notNull().default(""),
  gmcNumber: text("gmc_number"),
  active: boolean("active").notNull().default(true),
  sembleId: text("semble_id"),
});

export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicianId: uuid("clinician_id")
    .notNull()
    .references(() => clinicians.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Sunday … 6 = Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  visitType: visitTypeEnum("visit_type"), // null = both
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
});

export const availabilityExceptions = pgTable("availability_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicianId: uuid("clinician_id")
    .notNull()
    .references(() => clinicians.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  // Null times block the whole day.
  startTime: time("start_time"),
  endTime: time("end_time"),
  reason: text("reason"),
});

// ── Appointments & booking ──────────────────────────────────────────────

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id),
    clinicianId: uuid("clinician_id")
      .notNull()
      .references(() => clinicians.id),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    visitType: visitTypeEnum("visit_type").notNull(),
    status: appointmentStatusEnum("status").notNull().default("requested"),
    source: appointmentSourceEnum("source").notNull().default("online"),
    sembleId: text("semble_id"),
    cancellationReason: text("cancellation_reason"),
    staffNotes: text("staff_notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("appointments_patient_idx").on(t.patientId),
    index("appointments_clinician_time_idx").on(t.clinicianId, t.startsAt),
    // Hard double-booking guard: one live appointment per clinician per start.
    uniqueIndex("appointments_no_double_booking")
      .on(t.clinicianId, t.startsAt)
      .where(sql`${t.status} in ('requested', 'confirmed')`),
  ],
);

export const bookingHolds = pgTable(
  "booking_holds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicianId: uuid("clinician_id")
      .notNull()
      .references(() => clinicians.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    holderKey: text("holder_key").notNull(), // anonymous browser session key
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One live hold per slot; expired holds are purged before insert.
    uniqueIndex("booking_holds_slot_unique").on(t.clinicianId, t.startsAt),
  ],
);

export const waitingList = pgTable("waiting_list", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  preferences: text("preferences"),
  status: waitingListStatusEnum("status").notNull().default("open"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Forms & consents ────────────────────────────────────────────────────

export const formTemplates = pgTable(
  "form_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    // JSON list of fields: { key, label, type, required, options?, helpText? }
    fields: jsonb("fields").$type<FormFieldDef[]>().notNull().default([]),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("form_templates_slug_version_unique").on(t.slug, t.version)],
);

export type FormFieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "date";
  required: boolean;
  options?: string[];
  helpText?: string;
};

export const formResponses = pgTable("form_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => formTemplates.id),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  answers: jsonb("answers").$type<Record<string, string | boolean>>().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  kind: consentKindEnum("kind").notNull(),
  granted: boolean("granted").notNull(),
  wordingVersion: text("wording_version").notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  recordedBy: uuid("recorded_by").references(() => users.id),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  note: text("note"),
});

// ── Patient documents (metadata; bytes live with the StorageProvider) ───

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    kind: documentKindEnum("kind").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    status: documentStatusEnum("status").notNull().default("pending_review"),
    scanStatus: scanStatusEnum("scan_status").notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id),
    releasedToPatientAt: timestamp("released_to_patient_at", { withTimezone: true }),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("documents_patient_idx").on(t.patientId)],
);

// ── Team files (SharePoint-style; not the patient record) ───────────────

export const fileLibraries = pgTable(
  "file_libraries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    // Roles allowed to read; write/delete governed by permissions. Empty = all staff.
    restrictedToRoles: jsonb("restricted_to_roles").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("file_libraries_slug_unique").on(t.slug)],
);

export const fileEntries = pgTable(
  "file_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    libraryId: uuid("library_id")
      .notNull()
      .references(() => fileLibraries.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    kind: fileEntryKindEnum("kind").notNull(),
    name: text("name").notNull(),
    currentVersionId: uuid("current_version_id"),
    retentionLabel: text("retention_label"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => users.id),
    isDemo: boolean("is_demo").notNull().default(false),
  },
  (t) => [index("file_entries_library_idx").on(t.libraryId, t.parentId)],
);

export const fileVersions = pgTable(
  "file_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => fileEntries.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    scanStatus: scanStatusEnum("scan_status").notNull().default("pending"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("file_versions_entry_version_unique").on(t.entryId, t.versionNumber)],
);

// ── Tasks ───────────────────────────────────────────────────────────────

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    teamRole: roleEnum("team_role"),
    createdBy: uuid("created_by").references(() => users.id),
    priority: taskPriorityEnum("priority").notNull().default("normal"),
    status: taskStatusEnum("status").notNull().default("open"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_assignee_idx").on(t.assigneeId, t.status)],
);

export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id),
  body: text("body").notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskEvents = pgTable("task_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id),
  kind: text("kind").notNull(), // created | status_changed | assigned | priority_changed | escalated
  fromValue: text("from_value"),
  toValue: text("to_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Messaging ───────────────────────────────────────────────────────────

export const messageThreads = pgTable(
  "message_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: threadKindEnum("kind").notNull(),
    subject: text("subject").notNull(),
    // Set only for patient threads; staff threads must never link a patient
    // conversation to the patient-facing channel.
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
    urgent: boolean("urgent").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    isDemo: boolean("is_demo").notNull().default(false),
  },
  (t) => [index("threads_patient_idx").on(t.patientId)],
);

export const threadParticipants = pgTable(
  "thread_participants",
  {
    threadId: uuid("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.threadId, t.userId] })],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => users.id),
    body: text("body").notNull(),
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId, t.createdAt)],
);

// ── Notifications & outbox ──────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    linkPath: text("link_path"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);

// Email/SMS outbox. Bodies must contain minimal information and direct
// recipients to the secure portal — enforced by the template layer.
export const outboxEmail = pgTable("outbox_email", {
  id: uuid("id").primaryKey().defaultRandom(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  templateKey: text("template_key").notNull(),
  status: outboxStatusEnum("status").notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  lastError: text("last_error"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const outboxSms = pgTable("outbox_sms", {
  id: uuid("id").primaryKey().defaultRandom(),
  toPhone: text("to_phone").notNull(),
  body: text("body").notNull(),
  templateKey: text("template_key").notNull(),
  status: outboxStatusEnum("status").notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  lastError: text("last_error"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// ── Billing ─────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNumber: text("invoice_number").notNull(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    payerType: payerTypeEnum("payer_type").notNull().default("self"),
    insurerName: text("insurer_name"),
    insurerAuthCode: text("insurer_auth_code"),
    currency: text("currency").notNull().default("GBP"),
    totalPence: integer("total_pence").notNull().default(0),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    pdfDocumentId: uuid("pdf_document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_number_unique").on(t.invoiceNumber),
    index("invoices_patient_idx").on(t.patientId),
  ],
);

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPence: integer("unit_pence").notNull(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id),
    amountPence: integer("amount_pence").notNull(),
    method: paymentMethodEnum("method").notNull(),
    provider: text("provider").notNull().default("manual"),
    providerRef: text("provider_ref"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    // Online payments may only become `succeeded` via a verified webhook —
    // never from a browser redirect.
    verifiedByWebhook: boolean("verified_by_webhook").notNull().default(false),
    recordedBy: uuid("recorded_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_invoice_idx").on(t.invoiceId)],
);

// Raw provider events for idempotent, signature-verified processing.
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    signatureValid: boolean("signature_valid").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
  },
  (t) => [uniqueIndex("webhook_events_provider_event_unique").on(t.provider, t.externalEventId)],
);

// ── AI scribe (consent-first; drafts until clinician approval) ──────────

export const scribeSessions = pgTable("scribe_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicianUserId: uuid("clinician_user_id")
    .notNull()
    .references(() => users.id),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  consentId: uuid("consent_id").references(() => consents.id),
  status: scribeStatusEnum("status").notNull().default("awaiting_consent"),
  provider: text("provider").notNull().default("dev"),
  providerRef: text("provider_ref"),
  // Audio retention is a governance decision; OFF unless the feature flag
  // and the recorded consent both allow it.
  audioRetained: boolean("audio_retained").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scribeNotes = pgTable("scribe_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => scribeSessions.id, { onDelete: "cascade" }),
  draftText: text("draft_text").notNull(),
  editedText: text("edited_text"),
  aiGenerated: boolean("ai_generated").notNull().default(true),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  savedToEhrAt: timestamp("saved_to_ehr_at", { withTimezone: true }),
  ehrRef: text("ehr_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Audit trail (append-only, hash-chained) ─────────────────────────────

export const auditEvents = pgTable(
  "audit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorId: uuid("actor_id"),
    actorType: text("actor_type").notNull().default("user"), // user | patient | system | integration
    action: text("action").notNull(), // e.g. auth.login, patients.read, files.delete
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    prevHash: text("prev_hash").notNull().default(""),
    hash: text("hash").notNull().default(""),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorId, t.at),
    index("audit_entity_idx").on(t.entityType, t.entityId),
  ],
);

// ── Jobs, integrations, settings ────────────────────────────────────────

export const jobQueue = pgTable(
  "job_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    idempotencyKey: text("idempotency_key"),
    status: jobStatusEnum("status").notNull().default("queued"),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("job_queue_due_idx").on(t.status, t.runAt),
    uniqueIndex("job_queue_idempotency_unique")
      .on(t.idempotencyKey)
      .where(sql`${t.idempotencyKey} is not null`),
  ],
);

export const integrationState = pgTable("integration_state", {
  provider: text("provider").primaryKey(), // semble | heidi | payments | email | sms | storage
  status: integrationStatusEnum("status").notNull().default("not_configured"),
  lastCheckAt: timestamp("last_check_at", { withTimezone: true }),
  lastOkAt: timestamp("last_ok_at", { withTimezone: true }),
  lastError: text("last_error"),
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description").notNull().default(""),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Owner-input checklist mirrored into the admin setup screen.
export const ownerInputs = pgTable("owner_inputs", {
  key: text("key").primaryKey(),
  section: text("section").notNull(),
  title: text("title").notNull(),
  why: text("why").notNull(),
  whereShown: text("where_shown").notNull(),
  blocksProduction: boolean("blocks_production").notNull().default(false),
  safeDefault: text("safe_default").notNull().default(""),
  status: ownerInputStatusEnum("status").notNull().default("missing"),
  value: jsonb("value"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// DB-backed rate limiting (shared across instances).
export const rateLimits = pgTable("rate_limits", {
  bucket: text("bucket").primaryKey(),
  windowStartsAt: timestamp("window_starts_at", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});
