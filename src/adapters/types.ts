/**
 * Provider adapter contracts. Every external service sits behind one of these
 * interfaces with (a) a production implementation activated by environment
 * configuration and (b) a clearly-labelled development implementation that
 * never contacts external systems and never presents fake results as real.
 *
 * `mode` tells the UI (and audit trail) exactly which implementation is live;
 * "development" modes must be surfaced in the interface wherever their output
 * is shown.
 */

export type AdapterMode = "production" | "development" | "disabled";

// ── Booking (Semble is the preferred production provider) ───────────────

export interface AvailabilitySlot {
  clinicianId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  visitType: "in_person" | "video";
}

export interface BookingProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  /**
   * Genuine bookable slots for a service/clinician between two instants.
   * Implementations must already exclude held and booked slots.
   */
  getAvailability(query: {
    serviceId: string;
    clinicianId?: string;
    from: Date;
    to: Date;
    visitType?: "in_person" | "video";
  }): Promise<AvailabilitySlot[]>;
  /**
   * Whether appointments created through this provider are confirmed slots
   * ("confirmed") or requests awaiting clinic confirmation ("request").
   */
  bookingOutcome(): "confirmed" | "request";
  /** Push a cancellation to the provider (no-op in development). */
  notifyCancellation(appointmentSembleId: string | null): Promise<void>;
}

// ── Storage ─────────────────────────────────────────────────────────────

export interface StorageProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ── Email / SMS ─────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string;
  subject: string;
  bodyText: string;
  templateKey: string;
}

export interface EmailProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  /** Returns a provider message id, or null when captured in dev outbox. */
  send(message: EmailMessage): Promise<string | null>;
}

export interface SmsMessage {
  to: string;
  body: string;
  templateKey: string;
}

export interface SmsProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  send(message: SmsMessage): Promise<string | null>;
}

// ── Payments ────────────────────────────────────────────────────────────

export interface CheckoutRequest {
  invoiceId: string;
  amountPence: number;
  currency: "GBP";
  description: string;
  successPath: string;
  cancelPath: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  /** Creates a hosted checkout and returns its URL, or null when disabled. */
  createCheckout(request: CheckoutRequest): Promise<{ url: string; providerRef: string } | null>;
  /**
   * Verifies a webhook signature and parses the event. Payment success may
   * ONLY be recorded through this path — never from a browser redirect.
   */
  verifyWebhook(rawBody: string, signatureHeader: string | null): Promise<{
    valid: boolean;
    eventId?: string;
    type?: "payment.succeeded" | "payment.failed" | "payment.refunded" | "other";
    providerRef?: string;
    amountPence?: number;
  }>;
}

// ── AI scribe ───────────────────────────────────────────────────────────

export interface ScribeProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  /**
   * Starts a provider transcription session AFTER consent has been recorded.
   * Development mode returns { connected: false } and the UI must show the
   * integration as not connected — it must never fabricate a transcript.
   */
  startSession(input: {
    scribeSessionId: string;
    patientRef: string;
  }): Promise<{ connected: boolean; providerRef?: string }>;
  /** Fetches the draft note for a completed provider session, if any. */
  fetchDraft(providerRef: string): Promise<{ draftText: string } | null>;
}

// ── Clinical record (Semble) ────────────────────────────────────────────

export interface EhrProvider {
  readonly name: string;
  readonly mode: AdapterMode;
  /** Link check used by the integration health screen. */
  healthCheck(): Promise<{ ok: boolean; detail?: string }>;
  /** Writes an approved clinical note to the patient record. */
  saveApprovedNote(input: {
    patientSembleId: string;
    noteText: string;
    approvedByName: string;
    approvedAt: Date;
  }): Promise<{ saved: boolean; ehrRef?: string }>;
}
