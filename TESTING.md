# Testing — Sheffield Dermatology platform

## Principles

- **No real patient data, ever** — in tests, fixtures, seed data or screenshots.
  All test data is fictional and clearly labelled (`isDemo`, `.test` domains).
- Tests exercise the **real** migrations and the real security logic, not mocks
  of them.
- The demo TOTP secret is a fixed development-only value; production staff enrol
  their own authenticator.

## Layers

### Unit (`tests/unit/`, Vitest)
Pure logic with no I/O.
- `passwords.test.ts` — scrypt hashing, verification, salt uniqueness, policy.
- `rbac.test.ts` — the permission matrix (least privilege, role boundaries).

### Integration (`tests/integration/`, Vitest + in-memory PGlite)
Each test spins up a fresh in-memory PostgreSQL (PGlite) and applies the real
migrations via `tests/helpers/db.ts`.
- `migrations.test.ts` — migrations apply; core tables exist; the
  no-double-booking unique index is enforced.
- `booking.test.ts` — availability generation, slot exclusion after booking,
  24-hour lead time.
- `audit.test.ts` — hash-chained audit records verify, and tampering is
  **detected**.
- `patient-scope.test.ts` — a patient cannot read another patient's appointment
  or message thread even with the id.
- `scribe.test.ts` — consent-first invariants: audio retention off by default,
  declined consent yields no note, approved notes carry approver + timestamp and
  stay AI-flagged.

### End-to-end (`tests/e2e/`, Playwright, Chromium)
Drives a real browser against a freshly seeded server (`test:e2e:server` on port
3100).
- `public.spec.ts` — home/brand/CTAs, condition pages with urgent-care
  signposting, fees never invent prices, legal pages marked draft,
  robots/sitemap/health, authenticated-area redirects.
- `journeys.spec.ts` — patient registration → portal, full booking-request
  journey against genuine availability, staff sign-in enforces MFA.

## Running

```bash
npm run lint            # ESLint (flat config)
npm run typecheck       # tsc --noEmit
npm test                # unit + integration (Vitest)
npm run test:e2e        # Playwright (installs/uses Chromium; boots test server)
npm run build           # production build must succeed
npm run audit:deps      # dependency vulnerability audit (non-blocking)
```

For e2e locally, stop any dev server on the shared dev database first (the e2e
server reseeds `var/dev-db`).

## CI (`.github/workflows/ci.yml`)

- **quality:** lint, typecheck, migration-drift check (`db:generate` + `git
  diff`), unit + integration tests.
- **build:** production build (with a throwaway build-time `SESSION_SECRET`).
- **e2e:** Playwright with Chromium; uploads the HTML report artifact.
- **dependency-audit:** `npm audit --omit=dev` (non-blocking).

## What is not yet automated

- Accessibility auditing is manual/heuristic pending a formal WCAG 2.2 AA audit
  (see `/accessibility`).
- Load and penetration testing are out of scope for CI and are pre-production
  owner tasks (see DEPLOYMENT.md).
- Integration tests against real Semble/Heidi/payment providers require
  credentials and are not run in CI.
