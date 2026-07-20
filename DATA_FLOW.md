# Data flow — Sheffield Dermatology platform

How data moves through the platform, what lives locally versus in Semble, and
where personal health information (PHI) is **forbidden**. Companion to
[SECURITY.md](SECURITY.md), [ARCHITECTURE.md](ARCHITECTURE.md) and
[INTEGRATIONS.md](INTEGRATIONS.md).

## Principle: Semble is the clinical record

The local PostgreSQL database holds **operational** data (accounts, sessions,
roles, booking requests, tasks, team-file metadata, invoices, consents,
notification outbox, audit). Where Semble is connected, clinical records stay in
Semble; the platform holds only minimal cached projections keyed by `sembleId`
and reconciled — never a duplicated clinical record. AI-scribe notes exist
locally only as drafts until approved; the approved note is written to Semble
and retained locally as an audit stub.

## Where PHI must never appear

Enforced across the codebase:

| Channel | Rule | Enforcement |
|---|---|---|
| URLs | No patient identifiers or clinical detail in paths/query | Documents downloaded by opaque row id, authorised server-side (`src/app/patient/(app)/documents/[id]/download/route.ts`); storage keys never in URLs |
| Logs | No PHI in application logs | Audit `detail` carries entity references, not clinical content (`src/lib/audit/index.ts`) |
| Browser storage | No PHI in localStorage/sessionStorage | Only cookies used are `sd_session`, `sd_cookie_prefs`, CSRF |
| Analytics | None used | No analytics/advertising scripts exist (see `/cookies`) |
| Email / SMS | Minimal content, no clinical detail; direct to portal | Template layer builds every message (`src/lib/notify.ts`) — callers cannot pass arbitrary bodies |

## Flow 1 — Booking request (public)

```
Visitor → /book (BookingWizard)
  │  getAvailabilityForDay() ── server action ──▶ BookingProvider.getAvailability()
  │                                               (local engine: rules − exceptions
  │                                                − appointments − holds)
  ▼
createBooking() [server action]
  1. rate-limit (booking:<ip>)
  2. zod-validate; idempotency key
  3. price + duration read FROM DB (never the client)
  4. isSlotFree() re-check
  5. INSERT appointment  ── DB unique index blocks double-booking ──▶ status 'requested'
  6. record privacy + cancellation consents
  7. queueEmail(booking_request_received)  ──▶ outbox (dev: captured, prod: sent)
  8. recordAudit(booking.created)
  ▼
Success screen: "not confirmed yet" (request mode) + add-to-calendar (.ics)
```

No confirmed booking is shown unless `booking.live` + Semble are connected.

## Flow 2 — Patient portal (row-scoped)

```
Cookie sd_session ─▶ proxy.ts (coarse redirect) ─▶ (app)/layout requirePatient()
  ─▶ every query in src/lib/patient/data.ts filters WHERE patient_id = <own id>
```

A patient can never read another patient's rows even with a guessed id
(verified by `tests/integration/patient-scope.test.ts`). Documents are served
only when approved **and** released to the patient.

## Flow 3 — Staff access (RBAC)

```
Cookie sd_session ─▶ proxy.ts ─▶ (app)/layout requireStaff() (MFA required)
  ─▶ each page: rolesHavePermission(...) else <PermissionDenied/>
  ─▶ each server action: requirePermission(<perm>) — throws + audits on denial
```

UI hiding is never the only control; the server action re-checks.

## Flow 4 — AI scribe (consent-first)

```
Open verified patient ─▶ startScribeSession (status: awaiting_consent)
  ─▶ recordScribeConsent
        ├─ declined ─▶ status consent_declined; NO transcription; care unaffected
        └─ granted  ─▶ consent row saved BEFORE any transcription;
                       ScribeProvider.startSession() (dev: not connected)
  ─▶ saveScribeDraft (aiGenerated=true, labelled DRAFT)
  ─▶ approveScribeNote  [requires scribe.approve]
        ─▶ records approver + timestamp
        ─▶ EhrProvider.saveApprovedNote() when Semble connected
        ─▶ else stored locally, flagged pending EHR write
```

Audio retention defaults **off** (`scribe.audio_retention` flag). Unreviewed AI
output never enters the record.

## Flow 5 — Payment (webhook-verified)

```
Invoice ─▶ PaymentProvider.createCheckout() ─▶ hosted checkout URL
Provider ──POST──▶ /api/webhooks/payments
  1. verifyWebhook() — HMAC signature + timestamp tolerance (timing-safe)
  2. idempotency via webhook_events (provider, external_event_id)
  3. amount cross-checked against stored payment (mismatch ⇒ failed)
  4. payment.succeeded ⇒ verifiedByWebhook=true; invoice status recomputed
  5. recordAudit(payments.webhook_processed)
```

A browser redirect **never** marks an invoice paid.

## Flow 6 — Email / SMS outbox

```
queueEmail/queueSms(templateKey, params) ─▶ outbox_email/outbox_sms (queued)
  ─▶ enqueueJob(send_email/send_sms)
  ─▶ jobs runner ─▶ Provider.send()
        ├─ dev/disabled ⇒ status 'suppressed' (captured, nothing sent)
        └─ configured   ⇒ status 'sent' + provider message id
```

## Local vs Semble at a glance

| Data | Local DB | Semble (when connected) |
|---|---|---|
| Accounts, sessions, roles, audit | ✅ | — |
| Booking requests / appointments | ✅ (+ `sembleId` link) | ✅ system of record |
| Clinical notes | draft + audit stub only | ✅ full record |
| Documents (clinical) | metadata + encrypted bytes for uploads | linked in record |
| Invoices / payments | ✅ operational | reconciled where applicable |
| Tasks, team files, staff messages | ✅ | — |
