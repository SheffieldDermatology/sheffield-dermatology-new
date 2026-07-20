# Security — Sheffield Dermatology platform

This document records the security controls **implemented in code** (with file
references so they can be verified), the platform's UK GDPR / DPA 2018
position, and — explicitly — what has **not** been done yet. Nothing here is a
compliance claim; governance items require owner sign-off as noted.

Related documents: [DATA_FLOW.md](DATA_FLOW.md) (where data moves and where
PHI is forbidden), [DEPLOYMENT.md](DEPLOYMENT.md) (production hardening),
[CLINICAL_SAFETY.md](CLINICAL_SAFETY.md) (clinical risk), and
[OWNER_INPUTS.md](OWNER_INPUTS.md) (decisions only the owner can make).

## 1. Implemented technical controls

### 1.1 Sessions (`src/lib/auth/session.ts`, `src/lib/auth/tokens.ts`)

- The `sd_session` cookie holds a 32-byte random token (base64url); the
  database stores only its **SHA-256 hash** (`sessions.token_hash` is the
  primary key), so a database leak cannot be replayed as a session.
- Cookie flags: `httpOnly`, `secure` in production, `SameSite=Lax`, path `/`.
- Idle timeout: **30 minutes for staff, 60 minutes for patients**; absolute
  lifetime **12 hours**. Idle expiry revokes the session server-side.
- Sessions can be revoked individually or for all of a user's devices
  (`revokeSession`, `revokeAllUserSessions`); revoked and expired sessions are
  rejected on every request.
- Staff sessions carry an `mfa_verified` flag that is only set after a
  successful TOTP challenge; staff access is refused without it.

### 1.2 Passwords (`src/lib/auth/passwords.ts`)

- Node's built-in **scrypt** with OWASP-recommended parameters:
  `N = 2^17, r = 8, p = 1`, 64-byte derived key, 16-byte random salt, stored
  as `scrypt$N$r$p$salt$hash` (parameters embedded per hash for future
  upgrades). Verification is timing-safe; input is NFKC-normalised.
- Policy: 12–128 characters, at least three of four character classes,
  enforced server-side (`passwordMeetsPolicy` plus zod schemas at the form
  boundary).

### 1.3 Sign-in and lockout (`src/lib/auth/login.ts`)

- Progressive lockout: **8 failed attempts locks the account for 15 minutes**
  (`credentials.failed_attempts`, `locked_until`).
- Responses never reveal whether an account exists; unknown accounts still
  burn a scrypt verification to equalise timing.
- Failures and lockouts are audited (`auth.login_failed`, `auth.locked`).

### 1.4 Multi-factor authentication (`src/lib/auth/mfa.ts`)

- TOTP per RFC 6238 (otplib, verification window 1). Enrolment must be
  confirmed with a valid code before MFA counts as active.
- Secrets are stored **AES-256-GCM encrypted** at rest (`mfa_secrets.
  secret_encrypted`), with the key derived from `SESSION_SECRET`
  (`src/lib/auth/tokens.ts`).
- Eight single-use **recovery codes** are issued on enrolment and stored only
  as SHA-256 hashes; a used code is removed immediately.
- Staff cannot reach `/staff` or `/admin` without a confirmed-MFA session
  (`requireStaff`, `isVerifiedStaff`).

### 1.5 RBAC (`src/lib/rbac/permissions.ts`, `src/lib/auth/guards.ts`)

Roles: `system_admin`, `clinical_admin`, `consultant`, `nurse`,
`receptionist`, `finance`, `auditor` (read-only), `patient`. Permissions are
fine-grained strings checked server-side by `requirePermission` on every
server action; UI hiding is never the only control. Summary of the map (the
source of truth is `ROLE_PERMISSIONS` in code):

| Role | Permissions (summary) |
|---|---|
| `system_admin` | All permissions |
| `clinical_admin` | Patients/appointments read+write+cancel, document review, task assignment, patient messaging, files write/share/restore, operational reports, users read, staff base |
| `consultant` | Patients/appointments read+write+cancel, clinical notes read/write, `scribe.use`/`scribe.approve`, document review, patient messaging, files write/share, billing read, operational reports, staff base |
| `nurse` | Patients read, appointments read/write, clinical notes read, document review, patient messaging, files write, staff base |
| `receptionist` | Patients read/write, appointments read/write/cancel, patient messaging, billing read, staff base |
| `finance` | Billing read/write/refund, financial + operational reports, patients/appointments read, staff base |
| `auditor` | `audit.read`, operational reports, users read — nothing else |
| `patient` | **No staff permissions.** Access is row-scoped in the data layer, not permission-based |

("Staff base" = `tasks.read`, `tasks.write`, `messages.staff`, `files.read`.)

Sensitive actions (`patients.export`, `files.delete`, `roles.manage`,
`users.manage`, `integrations.manage`, `settings.manage`, `retention.manage`,
`billing.refund`) are listed in `ELEVATED_PERMISSIONS` and require recent
authentication. Permission denials are audited as `authz.denied`.

Route protection is layered three deep: `proxy.ts` (coarse cookie check and
redirect), each area's `layout.tsx` (server-side session/role check), and
every server action / route handler (fine-grained permission check + audit).

### 1.6 Patient row scoping

Patients can only ever query rows keyed to their own `patient_id`
(`requirePatient` in `src/lib/auth/guards.ts` resolves the linked patient row;
data-access functions filter by it). This is enforced in the data layer, not
the UI. See [DATA_FLOW.md](DATA_FLOW.md) §3.

### 1.7 Audit trail (`src/lib/audit/index.ts`)

- `audit_events` is **append-only and hash-chained**: each row's SHA-256 hash
  covers its content plus the previous row's hash, so tampering or deletion is
  detectable by re-walking the chain (`verifyAuditChain`).
- Recorded with actor, action, entity type/id, IP and user agent.
- **Rule: no PHI in `detail`** — events reference entities by type/id only.
- In production, the database role used by the application should additionally
  be denied `UPDATE`/`DELETE` on `audit_events` (see
  [DEPLOYMENT.md](DEPLOYMENT.md)).

### 1.8 Rate limiting (`src/lib/security/rate-limit.ts`)

Database-backed fixed-window limiter (identical behaviour on dev PGlite and
multi-instance production Postgres). Configured rules:

| Rule | Limit | Window |
|---|---|---|
| `login` | 10 | 15 min |
| `mfa` | 8 | 15 min |
| `passwordReset` | 5 | 60 min |
| `registration` | 10 | 60 min |
| `booking` | 20 | 60 min |
| `messaging` | 30 | 60 min |
| `upload` | 30 | 60 min |

### 1.9 HTTP security headers (`next.config.ts`, `proxy.ts`)

- **CSP**: `default-src 'self'`; scripts and styles self-hosted
  (`'unsafe-inline'` only where Next.js requires it); images restricted to
  self/data/blob; `frame-ancestors 'none'`; `form-action 'self'`;
  `base-uri 'self'`; `object-src 'none'`; `upgrade-insecure-requests`. No
  external hosts anywhere — fonts are self-hosted, there are no third-party
  analytics.
- **HSTS**: `max-age=63072000; includeSubDomains; preload`.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, restrictive
  `Permissions-Policy` (microphone limited to self for the scribe workflow),
  `X-Powered-By` removed.
- Authenticated areas (`/patient`, `/staff`, `/admin`) are served with
  `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

### 1.10 Uploads and files

- File bytes live **outside the web root** with the `StorageProvider`
  (`var/storage` in development) under random storage keys; the database holds
  metadata only (`documents`, `file_entries`, `file_versions`).
- Every stored object carries a `scan_status`
  (`pending | clean | infected | unavailable`) — a malware-scan hook point;
  patient uploads default to `pending_review` and must be approved before
  release (`documents.status`, `released_to_patient_at`).
- Type and size allow-lists are enforced server-side at the upload boundary;
  downloads are streamed through authorised route handlers, never served as
  static files. Team files support versioning and soft delete with restore.

### 1.11 Secrets and configuration (`src/lib/env.ts`, `.env.example`)

- All secrets come from environment variables, validated with zod at startup.
- Production **fails fast** without `SESSION_SECRET` (min 32 chars) and
  `DATABASE_URL`; a missing integration credential disables that feature
  safely rather than substituting an insecure fake.
- No real secret exists anywhere in this repository. `.env` is git-ignored.

### 1.12 Webhooks and payments integrity

- Webhook payloads are recorded in `webhook_events` with a unique
  `(provider, external_event_id)` index for **idempotent** processing, and a
  `signature_valid` flag; the `PaymentProvider.verifyWebhook` contract
  (`src/adapters/types.ts`) requires signature verification.
- A payment may only be recorded as succeeded via a verified webhook —
  `payments.verified_by_webhook` — never from a browser redirect.

### 1.13 No PHI in logs

Application logging must never include patient-identifiable data: log entity
types and ids, not names, contact details or clinical content. The same rule
applies to audit `detail`, URLs, localStorage and outbound email/SMS bodies —
see [DATA_FLOW.md](DATA_FLOW.md) §8 for the full list of prohibited locations.

## 2. UK GDPR and DPA 2018 position

> **Status: DRAFT.** Prepared for review by the clinic's data-protection lead
> (to be appointed — OWNER_INPUTS 5.1). Nothing below is legal advice or a
> completed assessment.

### 2.1 Roles

- **Controller**: the clinic's legal entity (not yet supplied —
  OWNER_INPUTS 1.1; ICO registration 1.2).
- **Processors**: hosting provider, Semble, Heidi, email/SMS/payment/storage
  suppliers once connected. Each requires an Article 28 data-processing
  agreement — see the checklist in §2.5.

### 2.2 Lawful bases (proposed, for DPO confirmation)

| Processing | Article 6 basis | Special-category condition (Article 9) |
|---|---|---|
| Booking, appointment and portal administration | 6(1)(b) contract (steps prior to / performance of the care contract) | 9(2)(h) health or social care, with DPA 2018 Schedule 1 Part 1 para 2 — processing by or under the responsibility of a professional subject to an obligation of confidentiality |
| Clinical documentation (incl. approved scribe notes) | 6(1)(b) / 6(1)(c) where record-keeping duties apply | 9(2)(h) as above |
| Optional communications (e.g. SMS reminders) | 6(1)(a) consent or 6(1)(f) legitimate interests, per DPO decision; PECR applies to electronic marketing | n/a for non-clinical content |
| AI-scribe audio retention (currently **off** by feature flag) | Requires its own assessment and explicit consent wording before ever being enabled | 9(2)(h) plus explicit consent as a safeguard |
| Security logging and audit | 6(1)(f) legitimate interests / 6(1)(c) | 9 not engaged where PHI is excluded from logs (see §1.13) |

### 2.3 Data minimisation

- Semble remains the clinical system of record; this platform stores
  operational data and, where connected, a **minimal cached projection**
  (name, time, status) keyed by `semble_id` — never a duplicated clinical
  record (`src/lib/db/schema.ts` header, [ARCHITECTURE.md](ARCHITECTURE.md)).
- Emails and SMS carry minimal information and direct recipients to the
  secure portal (outbox template rule, `src/lib/db/schema.ts`).
- AI-scribe drafts exist locally only until approval; audio is not retained
  (feature flag `scribe.audio_retention` defaults off).

### 2.4 DPIA outline — **DRAFT, requires owner/DPO sign-off**

A DPIA is required: large-scale processing of special-category (health) data,
plus an AI-assisted documentation tool.

1. **Purpose** — operate a private dermatology clinic's website, booking,
   patient portal, staff workspace and administration; integrate with the
   clinical record (Semble) and an AI scribe (Heidi) under clinician control.
2. **Necessity and proportionality** — data collected is limited to what the
   booking/portal functions need; clinical records stay in Semble; retention
   defaults to "retain, no automated deletion" until the owner approves a
   schedule (OWNER_INPUTS 5.5).
3. **Risks (to individuals)** — unauthorised access to health data; wrong
   patient linkage; AI-generated inaccuracy entering the record; PHI leakage
   via messages/logs; supplier (processor) failure; data loss.
4. **Mitigations** — the controls in §1 (MFA, RBAC, row scoping, audit chain,
   rate limiting, headers, webhook verification, outbox minimisation); the
   clinician-approval gate on scribe notes; consent-first scribe workflow;
   processor due diligence (§2.5); backups and DR (§3); hazard management in
   [CLINICAL_SAFETY.md](CLINICAL_SAFETY.md).
5. **Residual risk and sign-off** — to be completed and signed by the
   data-protection lead and clinic owner before go-live. **Not yet done.**

### 2.5 Processor / DPA checklist (per supplier)

For each supplier, before production use, confirm and file:

| Check | Semble | Heidi | Hosting/DB | Email | SMS | Payments | Storage (Graph/S3) |
|---|---|---|---|---|---|---|---|
| Article 28 DPA signed | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| UK/EEA (or adequacy) data residency confirmed | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Sub-processor list reviewed | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Breach-notification terms (≤72 h chain) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Security certifications reviewed (e.g. ISO 27001, Cyber Essentials) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Deletion/return of data on exit | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

None of these are in place yet (OWNER_INPUTS 5.7).

## 3. Backup and disaster recovery (production requirements)

Defined in full in [DEPLOYMENT.md](DEPLOYMENT.md). Minimum requirements:

- Managed PostgreSQL in a **UK region** with automated daily backups and
  point-in-time recovery; independent `pg_dump` on a schedule, encrypted at
  rest, retention per the approved schedule.
- If the built-in storage provider is used, `var/storage` must be included in
  backups; object-storage providers need their own versioning/replication.
- A **restore rehearsal** into a scratch environment before go-live and at a
  regular cadence thereafter — an untested backup is not a backup.
- Documented recovery-time and recovery-point objectives agreed with the
  owner. **Not yet decided** (OWNER_INPUTS 5.8).

## 4. Incident response (outline — to be adopted formally by the owner)

1. **Detect and contain** — revoke affected sessions
   (`revokeAllUserSessions`), rotate secrets, disable affected integrations at
   `/admin/integrations`, preserve logs and the audit chain.
2. **Assess** — scope, data categories, individuals affected; run
   `verifyAuditChain` to check trail integrity.
3. **Notify** — if a personal-data breach is likely to result in risk, report
   to the **ICO within 72 hours** of awareness; inform affected individuals
   without undue delay where high risk; notify processors/controllers per
   contract.
4. **Record** — every incident, decision and timeline in the incident log,
   regardless of whether it is reportable.
5. **Review** — post-incident review with corrective actions; update the DPIA
   and hazard log ([CLINICAL_SAFETY.md](CLINICAL_SAFETY.md)).

## 5. Vulnerability reporting

Please report suspected vulnerabilities **privately** to the clinic's
designated contact (to be published once OWNER_INPUTS 1.5 is supplied; until
then, to the repository owner). Do not open public issues containing exploit
detail, do not test against any deployment holding real data, and allow
reasonable time for a fix before any disclosure.

## 6. Explicitly NOT yet done

Honesty list — none of the following exist yet, and go-live is blocked until
the marked items are resolved:

- **Penetration test** of the final deployed architecture (blocking).
- **DPIA completion and sign-off** (blocking — OWNER_INPUTS 5.2).
- **DSPT decision** — required if any NHS data or NHS-commissioned work is
  involved; pending the owner's decision (OWNER_INPUTS 5.4/5.9).
- Data-processing agreements with any supplier (blocking — OWNER_INPUTS 5.7).
- Appointment of a data-protection lead/DPO (blocking — OWNER_INPUTS 5.1).
- CQC registration confirmation ([CLINICAL_SAFETY.md](CLINICAL_SAFETY.md)).
- Approved retention schedule and automated deletion (OWNER_INPUTS 5.5).
- Malware-scanning engine behind the `scan_status` hook (hook exists; no
  scanner is connected).
- Production monitoring/alerting choice (e.g. Sentry — `SENTRY_DSN` is
  supported but nothing is configured).
- Backup restore rehearsal (blocking before go-live).
