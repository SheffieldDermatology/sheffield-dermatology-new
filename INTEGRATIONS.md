# Integrations — Sheffield Dermatology platform

Every external service sits behind a provider adapter (`src/adapters/*`) with a
production implementation activated by environment variables and a clearly
labelled development implementation that never contacts external systems or
presents fake results as real. Status is shown at **Admin → Integrations**
(`/admin/integrations`).

> **Never put secrets in chat, email, or the repository.** Configure them only
> in the deployment platform's secret store (see [DEPLOYMENT.md](DEPLOYMENT.md)).
> The admin UI never collects secrets.

## Current status (development default)

| Provider | Built | Production-connected | Fallback behaviour |
|---|---|---|---|
| Semble (EHR) | Transport + health | ❌ awaiting API docs/credentials | Local booking (request-only); no clinical writes |
| Heidi (scribe) | Consent workflow | ❌ awaiting enterprise contract | Consent-first flow works; transcription "not connected" |
| Payments (Stripe) | Checkout + signed webhook | ❌ disabled | Invoices recorded unpaid; no online payment |
| Email | Resend-compatible send | ❌ outbox only | Captured in outbox, nothing sent |
| SMS | Twilio-compatible send | ❌ disabled | Captured in outbox, nothing sent |
| Storage | Local encrypted store ✅ | ✅ (local) / ❌ Graph/S3 | Encrypted files under `var/storage` |

## Semble — clinical system of record

**Adapter:** `src/adapters/semble/`. Semble authenticates a GraphQL endpoint
with an `x-token` header — this transport is implemented, with rate-limit-aware
retries and an authenticated reachability probe (GraphQL introspection).

**Deliberately not guessed:** specific Semble queries/mutations. `saveApprovedNote`
returns `{saved:false}` and live booking throws `NotConnected` until the
official API operations are verified. This prevents fabricating clinical data.

Environment: `SEMBLE_API_URL`, `SEMBLE_API_TOKEN`, `SEMBLE_WEBHOOK_SECRET`.
Webhook receiver: `/api/webhooks/semble` (HMAC-verified, idempotent, enqueues
`semble_sync`).

**Owner checklist / questions for Semble:**
- Confirm plan and enabled modules (EHR, scheduling, billing, video, portal).
- Official API base URL and authentication method for this account.
- GraphQL schema / documented operations for: patients, appointments,
  availability, consultation notes (write), documents, invoices, payments.
- Webhook event catalogue and signature scheme.
- Rate limits and pagination.
- Data-processing agreement and UK hosting confirmation.

Do not replace Semble until the separate [MIGRATION_PLAN.md](MIGRATION_PLAN.md)
is approved, tested and clinically validated.

## Heidi — AI scribe

**Adapter:** `src/adapters/heidi/`. Prefer the supported Semble-linked
integration. Without credentials, `startSession` returns `{connected:false}` and
the UI shows the transcription step as not connected — it never fabricates a
transcript. Environment: `HEIDI_API_URL`, `HEIDI_API_KEY`.

**Owner actions:** confirm the integration route (Semble-linked vs enterprise
API), approve the consent wording, decide audio retention (default off — see
[CLINICAL_SAFETY.md](CLINICAL_SAFETY.md)), and sign the DPA.

## Payments — Stripe or Semble Pay

**Adapter:** `src/adapters/payments/`. Stripe checkout via API; webhook
signature verified with the Stripe v1 scheme (HMAC over `timestamp.payload`,
timing-safe, 5-minute tolerance). Success is recognised **only** via the signed
webhook, never a browser redirect; amounts are cross-checked. Environment:
`PAYMENT_PROVIDER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Enable via the
`payments.online` feature flag once configured. Webhook: `/api/webhooks/payments`.

**Owner actions:** choose provider, decide deposit policy, complete PCI-relevant
supplier due diligence. Raw card details are never stored.

## Email (transactional)

**Adapter:** `src/adapters/email/`. Resend-compatible HTTPS send when
`EMAIL_PROVIDER` + `EMAIL_API_KEY` (+ `EMAIL_FROM`) are set. Bodies contain
minimal information and direct recipients to the secure portal. Without config,
messages stay in the outbox (viewable in admin).

**Owner actions:** choose a clinic-approved provider, verify the sending domain
(SPF/DKIM/DMARC), sign the DPA.

## SMS (optional reminders)

**Adapter:** `src/adapters/sms/`. Twilio-compatible send when `SMS_PROVIDER`,
`SMS_ACCOUNT_SID`, `SMS_AUTH_TOKEN`, `SMS_FROM` are set; enable via
`sms.reminders`. Off by default.

## Team file storage

**Adapter:** `src/adapters/storage/`. Default `local`: files encrypted at rest
(AES-256-GCM, key derived from `SESSION_SECRET`) under `var/storage`, random hex
keys, no path traversal. `microsoft-graph` and `s3` are structured stubs that
throw a clear "not configured" error until credentials are supplied
(`MS_GRAPH_*` or `S3_*`).

**Owner actions:** decide whether to use Microsoft 365 / SharePoint (via
Microsoft Graph) or S3-compatible storage; sign the DPA; confirm UK/EEA hosting.

## Health & reliability (all integrations)

- Statuses recorded in `integration_state`, refreshed on the admin screen and by
  the `integration_health_check` background job.
- Webhooks: signature verification, idempotency (`webhook_events`), audit.
- Jobs: retry with exponential backoff, dead-letter + admin alert on permanent
  failure (`src/lib/jobs/`).
- Secrets: environment only; token rotation is an operational task (rotate the
  env value and redeploy).
