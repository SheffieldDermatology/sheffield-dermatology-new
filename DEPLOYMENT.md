# Deployment — Sheffield Dermatology platform

How to deploy the platform safely. Production must use managed PostgreSQL in a
UK/EEA (or adequacy-covered) region and serve over HTTPS. No real patient data
may exist in development or staging.

Related: [SECURITY.md](SECURITY.md), [INTEGRATIONS.md](INTEGRATIONS.md),
[OWNER_INPUTS.md](OWNER_INPUTS.md), [CLINICAL_SAFETY.md](CLINICAL_SAFETY.md).

## 1. Requirements

- Node.js 20+ (CI uses 22)
- Managed PostgreSQL (UK/EEA region), connection string
- HTTPS with a valid certificate
- A secrets store (platform secret manager) — never a committed file
- A process/scheduler to run background jobs

## 2. Environment configuration

Copy `.env.example` and set values in the deployment's secret store. Generate
secrets with, for example:

```bash
openssl rand -base64 48   # SESSION_SECRET (32+ chars required in production)
```

Minimum for production:

```
NODE_ENV=production
APP_ORIGIN=https://sheffielddermatology.com
SESSION_SECRET=<generated>
DATABASE_URL=postgres://…@…:5432/sheffield_dermatology   # UK/EEA region
```

Integrations (Semble, Heidi, payments, email, SMS, storage) are added only when
the owner has supplied them — see [INTEGRATIONS.md](INTEGRATIONS.md). Absent
integrations degrade safely (request-only booking, outbox-only messaging).

The app validates configuration at startup (`src/lib/env.ts`) and refuses to
start in production without `SESSION_SECRET` and `DATABASE_URL`.

## 3. Build and run

```bash
npm ci
npm run db:migrate     # apply migrations to the production database
npm run build          # Next.js standalone output
npm run start          # or run the standalone server
```

`next.config.ts` uses `output: "standalone"`, so the built server can run from
the standalone bundle behind a reverse proxy.

## 4. Background jobs

Notifications, integration sync and housekeeping run via a **separate** process:

```bash
npm run jobs:run
```

Run this as a long-lived service (systemd unit or platform worker), not inside
the web server. In development the embedded PGlite database is single-process,
so the jobs runner needs a real shared PostgreSQL to see the web server's data —
this is a production requirement, not just a preference.

## 5. Reverse proxy (example: nginx + TLS)

```nginx
server {
  listen 443 ssl http2;
  server_name sheffielddermatology.com;
  ssl_certificate     /etc/letsencrypt/live/sheffielddermatology.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sheffielddermatology.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server {
  listen 80;
  server_name sheffielddermatology.com;
  return 301 https://$host$request_uri;
}
```

Security headers (CSP, HSTS, frame-deny, etc.) are set by the app
(`next.config.ts`); the proxy must forward `X-Forwarded-For`/`Proto`.

## 6. systemd units (example)

```ini
# /etc/systemd/system/sheffderm-web.service
[Service]
WorkingDirectory=/opt/sheffderm
EnvironmentFile=/etc/sheffderm/env
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
User=sheffderm

# /etc/systemd/system/sheffderm-jobs.service
[Service]
WorkingDirectory=/opt/sheffderm
EnvironmentFile=/etc/sheffderm/env
ExecStart=/usr/bin/npx tsx scripts/run-jobs.ts
Restart=always
User=sheffderm
```

## 7. Backups and disaster recovery

- **Database:** scheduled `pg_dump` (e.g. hourly incremental + daily full),
  stored encrypted in a UK/EEA region with tested restores.
- **Files:** back up `var/storage` (or the configured object store) on the same
  schedule; files are already encrypted at rest.
- **Restore rehearsal:** periodically restore into a staging environment and run
  `npm run db:migrate` + smoke tests. Record the recovery time objective (RTO)
  and recovery point objective (RPO) with the owner.
- **Secrets:** stored in the platform secret manager, recoverable independently
  of the app.

## 8. Zero secrets in the repository

`.gitignore` excludes `.env*` (except `.env.example`) and `var/`. Never commit
real secrets. Rotate a secret by changing the environment value and redeploying.

## 9. Production go-live checklist (gated by OWNER_INPUTS.md)

- [ ] All `Blocks production: Yes` items in OWNER_INPUTS.md resolved (see
      `/admin/setup`)
- [ ] `SESSION_SECRET` and `DATABASE_URL` set; UK/EEA database region confirmed
- [ ] HTTPS + valid certificate; security headers verified
- [ ] Migrations applied; **no seed/demo data present** (`npm run db:seed` is
      blocked in production)
- [ ] Background jobs service running
- [ ] Backups scheduled and a restore rehearsed
- [ ] DPIA, clinical-safety and legal sign-offs complete
- [ ] Penetration test appropriate to the final architecture
- [ ] Integrations configured or safely disabled; statuses green/expected at
      `/admin/integrations`
- [ ] DNS for sheffielddermatology.com pointed at the deployment

## 10. Rollback

Keep the previous build artifact and a pre-migration database backup. To roll
back: redeploy the previous artifact and, only if a migration must be reversed,
restore the pre-migration backup (migrations are additive; prefer forward
fixes). Announce downtime per the business-continuity plan.
