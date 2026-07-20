# Architecture — Sheffield Dermatology platform

One integrated application serving the public website, patient booking, patient
portal, staff workspace and administration, with Semble as the clinical system
of record and all external services behind provider adapters.

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, strict mode | Server components, server actions with built-in origin checks, single deployable |
| UI | Hand-authored accessible React components + CSS custom properties | Preserves the approved Sheffield Dermatology visual identity (navy `#20245f`, sky `#50bce8`, coral `#eb8fa8`, DM Sans/Newsreader) |
| Database | PostgreSQL via Drizzle ORM (typed schema + generated SQL migrations) | Same SQL dialect in every environment |
| Dev database | PGlite (embedded Postgres) — file-backed under `var/dev-db`, in-memory for tests | Real Postgres semantics with zero local install; production requires `DATABASE_URL` pointing at managed Postgres |
| Auth | Database-backed sessions, httpOnly/secure/SameSite=Lax cookies, scrypt password hashing, TOTP MFA, account lockout | No third-party identity dependency; MFA required for staff |
| Validation | Zod v4 on every server boundary | Server-side validation regardless of client state |
| Jobs | `job_queue` table + in-process runner (dev) / worker or cron (prod) | Notifications, integration sync, retries with backoff |
| Email/SMS | Outbox pattern → provider adapter | Nothing external sent in development; minimal PHI in any message |
| Tests | Vitest (unit + integration on in-memory PGlite), Playwright (e2e) | Migrations and RBAC genuinely exercised in CI |
| CI | GitHub Actions: lint, typecheck, unit/integration, build, e2e, `npm audit` | |

## Application areas

```
/            Public website (SSG/ISR, no auth)
/book        Booking journey (public, server-validated, provider-backed)
/patient     Patient portal (patient session required)
/staff       Staff workspace (staff session + MFA required)
/admin       Administration (elevated roles only)
/api         Route handlers: webhooks, integrations, uploads, health
```

Route protection is enforced in **three layers**: `proxy.ts` (coarse redirect
for unauthenticated sessions), per-area `layout.tsx` (session + role check on
the server), and **every server action / route handler** (fine-grained
permission check + audit). UI hiding is never the only control.

## Repository layout

```
src/
  app/                  App Router routes
    (public)/           Public site + legal pages
    book/               Booking journey
    patient/            Patient portal
    staff/              Staff workspace
    admin/              Administration
    api/                Route handlers (webhooks, health, files)
  components/           Shared accessible UI components
  lib/
    db/                 Drizzle client, schema, migration runner
    auth/               Sessions, passwords, TOTP, guards
    rbac/               Roles, permissions, `requirePermission`
    audit/              Immutable audit trail writer
    security/           Rate limiting, headers, tokens
    validation/         Zod schemas
    jobs/               Queue + handlers
  adapters/             Provider interfaces + implementations
    semble/  heidi/  storage/  payments/  email/  sms/
  server/               Server actions grouped by feature
drizzle/                Generated SQL migrations
tests/                  unit/ integration/ e2e/
legacy/                 Original static prototype (reference only)
```

## Data model (principle: Semble owns the clinical record)

The local database stores **operational** data: accounts, sessions, roles,
audit events, bookings *requests*, tasks, messages, team files metadata,
invoices, consents, notification outbox, integration sync state. Where Semble
is connected, appointments/patients hold `semble_id` references and a cached
minimal projection (name, time, status) that is reconciled — never a full
duplicate clinical record. Clinical documents live in Semble; the portal links
to them. AI-scribe notes exist locally only as **drafts** until approved, then
are written to Semble and retained locally only as an audit stub.

Key tables: `users`, `credentials`, `sessions`, `mfa_secrets`, `roles`,
`user_roles`, `permissions_overrides`, `patients` (portal identity +
`semble_id`), `services`, `clinicians`, `availability_rules`, `appointments`,
`booking_holds`, `waiting_list`, `forms`, `form_responses`, `consents`,
`documents` (metadata + storage key), `file_libraries`, `file_entries`,
`file_versions`, `tasks`, `task_events`, `message_threads`, `messages`,
`notifications`, `outbox_email`, `outbox_sms`, `invoices`, `payments`,
`payment_events`, `scribe_sessions`, `scribe_notes`, `audit_events`
(append-only), `job_queue`, `integration_state`, `settings`, `feature_flags`,
`owner_inputs`.

## Provider adapters

Every external service sits behind a TypeScript interface with (a) a production
implementation activated by environment configuration and (b) a clearly
labelled development implementation that never contacts external systems and
never presents fake results as production ones.

| Adapter | Production target | Development behaviour |
|---|---|---|
| `BookingProvider` | Semble API (availability, appointments) | Deterministic labelled dev availability; bookings stored as *requests*, never shown as confirmed; disabled entirely if `NODE_ENV=production` without credentials |
| `ScribeProvider` | Heidi (via Semble/enterprise integration) | Consent workflow fully functional; transcription step returns "not connected" |
| `StorageProvider` | Microsoft Graph/SharePoint or S3-compatible | Server-side encrypted files under `var/storage` with DB metadata, versioning, soft delete |
| `PaymentProvider` | Semble Pay / Stripe (webhook-verified) | Payments disabled; invoices recorded unpaid; no fake "paid" states |
| `EmailProvider` | Clinic-approved transactional provider | Outbox rows only, viewable in admin |
| `SmsProvider` | Clinic-approved SMS provider | Outbox rows only |

Integration rules: secrets only from environment variables; webhook signature
verification; idempotency keys on event handling; retry queue with exponential
backoff; failure alerts as staff notifications; health shown at
`/admin/integrations`; every sync audited.

## Security model

- RBAC roles: `system_admin`, `clinical_admin`, `consultant`, `nurse`,
  `receptionist`, `finance`, `auditor` (read-only), `patient`. Permissions are
  fine-grained strings (e.g. `patients.read`, `files.delete`, `audit.read`)
  mapped per role, checked server-side by `requirePermission`.
- Patients can only ever query rows keyed to their own `patient_id`; enforced
  in the data-access layer, not in the UI.
- Sessions: 128-bit random tokens stored hashed; absolute + idle expiry;
  rotation on privilege change; staff sessions require completed MFA.
- Rate limiting on auth, booking and messaging endpoints.
- CSP, HSTS, frame-deny and referrer headers set in `next.config.ts` +
  `proxy.ts`.
- Append-only `audit_events` (no update/delete grants; hash-chained rows).
- Uploads: type + size allow-list, stored outside the web root under random
  keys, streamed with authorisation checks, malware-scan hook.
- No PHI in logs, URLs, localStorage or third-party analytics.

Full detail in `SECURITY.md`; data flows in `DATA_FLOW.md`.

## Environments

| | Development | Test/CI | Production |
|---|---|---|---|
| DB | PGlite file (`var/dev-db`) | PGlite in-memory | Managed PostgreSQL (UK region) — `DATABASE_URL` required |
| Integrations | Dev adapters, labelled | Dev adapters | Real adapters only when configured; features stay disabled otherwise |
| Seed data | Fictional, clearly labelled | Fictional | **None** — seeding refuses to run in production |
| Email/SMS | Outbox only | Outbox only | Real provider |

## Phased implementation plan

1. **Foundation** — scaffold, DB schema + migrations, auth/MFA/RBAC, audit,
   security headers, base UI system. *(this build)*
2. **Public site** — migrate and complete all public pages, SEO, legal drafts,
   cookie preferences. *(this build)*
3. **Booking** — request-first journey on the BookingProvider adapter, holds,
   double-booking prevention, waiting list, confirmations via outbox. *(this build)*
4. **Portals** — patient portal + staff workspace + admin, tasks, messaging,
   files, scribe workflow, billing records. *(this build)*
5. **Hardening** — tests, CI, docs, accessibility pass. *(this build)*
6. **Go-live** — owner inputs (see `OWNER_INPUTS.md`), real credentials into
   the deployment environment, DPIA/clinical-safety sign-off, pen test, DNS.
7. **Semble migration assessment** — only after live operation; see
   `MIGRATION_PLAN.md`.
