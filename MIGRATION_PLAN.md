# Migration plan — Semble → platform (controlled, later phase)

This is a **standalone, controlled clinical-system migration plan**. It is **not**
part of the initial launch. Semble remains the clinical system of record until
this migration is separately approved, tested and clinically validated. Do not
begin migration work until the platform has operated stably alongside Semble and
the owner, clinical and information-governance leads have signed off.

Related: [PLATFORM_PLAN.md](PLATFORM_PLAN.md) (original phasing),
[CLINICAL_SAFETY.md](CLINICAL_SAFETY.md), [SECURITY.md](SECURITY.md),
[INTEGRATIONS.md](INTEGRATIONS.md).

## Guiding rule

A clinical-record migration is a controlled, high-risk exercise — **not** a
normal website import. Treat every record as clinically significant. Never run
an untested cutover. Always keep a tested rollback and a read-only archive.

## Phase M0 — Readiness gate

Proceed only when all are true:
- The platform has run alongside Semble for an agreed stabilisation period.
- A named clinical lead, information-governance lead and CSO are assigned.
- Semble's official data-export specification, API terms, attachment formats and
  contract-termination process are documented.
- A DPIA and clinical risk assessment specific to migration are approved.

## Phase M1 — Inventory & mapping

Produce a feature-by-feature and data-by-data inventory of current Semble use.

| Domain | Items to inventory | Notes |
|---|---|---|
| Patients | Demographics, identifiers, merge history | Identity is the highest-risk mapping |
| Appointments | Past/future, statuses, clinicians, locations | Map to local `appointments` + `sembleId` |
| Clinical notes | Consultation notes, letters, coded data | Retain provenance and authorship |
| Forms | Templates, responses | Version-aware |
| Prescriptions | Where supported/exported | Confirm legal retention |
| Laboratory results | Where supported/exported | Attachment formats |
| Documents / images | Files + metadata | Encryption, integrity checks |
| Invoices / payments | Financial records, insurers, Healthcode refs | Reconcile totals |
| Users / permissions | Accounts, roles, access history | Map to RBAC roles |
| Audit records | Historical audit where exportable | Preserve immutability |

For each: source field → target field, transformation rules, and data that will
**not** migrate (with justification and retention decision).

## Phase M2 — Retention & governance

- Define the record-retention schedule (owner input) and apply it.
- Identify data that will be archived read-only rather than migrated.
- Confirm lawful basis and special-category conditions for the migration itself.

## Phase M3 — Build & validate a test migration

- Build the extract-transform-load against a **representative sample** in an
  isolated environment (no production credentials, synthetic or securely handled
  sample data per governance).
- Validate: record counts reconcile; clinical samples reviewed by a clinician;
  attachments open and match checksums; financial totals reconcile.
- Fix mapping defects and re-run until clean.

## Phase M4 — Reconciliation

- Automated count reconciliation per domain (source vs target).
- Clinical spot-check sampling signed off by a clinician.
- Financial reconciliation signed off by finance.
- Document discrepancies and their resolution.

## Phase M5 — Parallel running

- Run both systems during an agreed safety window with a clear "source of truth"
  policy for each data type.
- Monitor for divergence; reconcile daily.

## Phase M6 — Cutover & rollback

- Cutover only after clinical, IG and operational sign-off.
- Maintain a **tested rollback** to Semble and a business-continuity plan for
  the cutover window.
- Preserve a **read-only archive** of Semble data where required.
- Post-cutover: intensive monitoring, rapid incident response, and a defined
  period before decommissioning the source.

## Sign-off gates (all required before cutover)

- [ ] Clinical lead sign-off (record fidelity, safety)
- [ ] Information-governance sign-off (DPIA, lawful basis, retention)
- [ ] Operational sign-off (workflows, training, support)
- [ ] Finance sign-off (reconciliation)
- [ ] Tested rollback and business-continuity plan in place
- [ ] Read-only archive arranged where required

## Explicit non-goals for launch

The initial platform launch does **not** migrate or replace Semble. It provides
the branded front door, booking, portals and staff tooling **around** Semble.
This plan is executed only as a separate, later, approved project.
