# Sheffield Dermatology platform

One integrated Next.js application serving the Sheffield Dermatology public
website, appointment booking, patient portal, staff workspace and
administration area — with Semble as the intended clinical system of record and
every external service behind a provider adapter.

> **Important — demonstration data and production readiness**
>
> All seeded people, patients, appointments, tasks and files in this repository
> are **fictional** and clearly labelled as demo data (`is_demo` flags, `.test`
> email domains). The seed script refuses to run in production.
>
> This platform is **not production-ready** until every item marked
> "Blocks production: Yes" in [OWNER_INPUTS.md](OWNER_INPUTS.md) has been
> supplied and signed off by the clinic owner. Never enter real patient
> information into a development or staging deployment.

## What is here

| Area | Route | Access |
|---|---|---|
| Public website | `/` | Public, no authentication |
| Booking journey | `/book` | Public, server-validated, request-first |
| Patient portal | `/patient` | Patient session required |
| Staff workspace | `/staff` | Staff session + completed MFA required |
| Administration | `/admin` | Elevated staff roles only |
| API route handlers | `/api` | Webhooks, health, file streaming |

Core platform capabilities (see [ARCHITECTURE.md](ARCHITECTURE.md) for the full
design):

- **Authentication** — database-backed sessions, scrypt password hashing,
  TOTP multi-factor authentication with recovery codes, progressive account
  lockout (`src/lib/auth/`).
- **Authorisation** — fine-grained role-based access control checked
  server-side on every action (`src/lib/rbac/permissions.ts`,
  `src/lib/auth/guards.ts`); patients are row-scoped to their own records.
- **Audit** — append-only, hash-chained audit trail with a verification
  routine (`src/lib/audit/index.ts`).
- **Security headers and rate limiting** — CSP, HSTS and friends in
  `next.config.ts`; database-backed rate limiter in
  `src/lib/security/rate-limit.ts`.
- **Provider adapters** — Semble, Heidi, payments, email, SMS and file
  storage all sit behind typed interfaces (`src/adapters/types.ts`). In
  development every adapter runs in a clearly labelled offline mode; nothing
  external is contacted and nothing fake is presented as real. Production
  connections require credentials that only the clinic owner can obtain — see
  [INTEGRATIONS.md](INTEGRATIONS.md).

## Quick start (development)

Requirements: Node.js 20.9 or later (CI runs Node 22) and npm. No local
database install is needed — development uses an embedded PGlite (real
Postgres) database under `var/dev-db`.

```bash
npm install
npm run db:migrate   # apply SQL migrations from drizzle/
npm run db:seed      # fictional demo data (refuses to run in production)
npm run dev          # http://localhost:3000
```

### Demo sign-ins

The seed script prints these on completion (all accounts are fictional):

| Account | Email | Password | MFA |
|---|---|---|---|
| Staff — system admin | `admin@demo.sheffielddermatology.test` | `DevPassword123!` | TOTP secret `JBSWY3DPEHPK3PXP` |
| Staff — consultant | `consultant@demo.sheffielddermatology.test` | `DevPassword123!` | TOTP secret `JBSWY3DPEHPK3PXP` |
| Staff — other roles | `nurse@` / `reception@` / `finance@` / `auditor@` `…demo.sheffielddermatology.test` | `DevPassword123!` | MFA enrolment on first sign-in |
| Patient | `patient@demo.sheffielddermatology.test` | `DevPassword123!` | — |

Add the TOTP secret to any authenticator app to generate staff sign-in codes.
It is a publicly known RFC 6238 test secret and exists for development only.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (`output: "standalone"`) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:generate` | Generate SQL migrations from the Drizzle schema |
| `npm run db:migrate` | Apply migrations to the configured database |
| `npm run db:seed` | Insert fictional demo data (never in production) |
| `npm run jobs:run` | Background job runner (outbox, retries, housekeeping) |
| `npm test` | Vitest unit + integration tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run audit:deps` | `npm audit --omit=dev` |

## Repository layout

```
src/
  app/                  App Router routes: (public)/ book/ patient/ staff/ admin/ api/
  components/           Shared accessible UI components
  lib/
    db/                 Drizzle client, schema (FROZEN), migration runner
    auth/               Sessions, passwords, TOTP MFA, guards
    rbac/               Roles and the permission map
    audit/              Hash-chained append-only audit trail
    security/           Rate limiting
    clinic-info.ts      Owner-supplied contact details (null until entered)
    env.ts              Zod-validated environment configuration
  adapters/             Provider interfaces + implementations
  styles/               Approved visual identity (brand.css, public.css, portal.css)
drizzle/                Generated SQL migrations
scripts/                migrate.ts, seed.ts and operational scripts
proxy.ts                Coarse route protection at the request edge
next.config.ts          Security headers, standalone output
legacy/                 Original static prototype (reference only)
```

## Documentation

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, application areas, data model, adapter design |
| [OWNER_INPUTS.md](OWNER_INPUTS.md) | Everything only the clinic owner can supply; production blockers |
| [SECURITY.md](SECURITY.md) | Implemented controls, UK GDPR position, DPIA outline, incident response |
| [DATA_FLOW.md](DATA_FLOW.md) | How data moves through the system; where PHI is and is not allowed |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Per-provider status, environment variables, setup steps |
| [MIGRATION_PLAN.md](MIGRATION_PLAN.md) | Controlled Semble data-migration plan (future phase) |
| [CLINICAL_SAFETY.md](CLINICAL_SAFETY.md) | DCB0129/DCB0160, hazard log starter, CQC/DSPT/medical-device assessment |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production requirements, environment setup, backups, rollback |
| [TESTING.md](TESTING.md) | Test strategy, how to run, CI stages |
| [PLATFORM_PLAN.md](PLATFORM_PLAN.md) | Original platform plan and phasing |

## Production readiness

Go-live is gated. In addition to the technical checklist in
[DEPLOYMENT.md](DEPLOYMENT.md), production requires — at minimum — the owner
inputs marked blocking in [OWNER_INPUTS.md](OWNER_INPUTS.md), the governance
sign-offs described in [SECURITY.md](SECURITY.md) (DPIA, processor agreements)
and [CLINICAL_SAFETY.md](CLINICAL_SAFETY.md) (clinical-safety ownership), and a
penetration test of the final deployed architecture. None of these have been
completed yet.
