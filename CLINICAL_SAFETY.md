# Clinical safety — Sheffield Dermatology platform

This document is a **draft clinical-safety assessment**. It records the
platform's position against the relevant UK standards and a starter hazard log.
Nothing here is a compliance claim: every conclusion requires sign-off by a
named Clinical Safety Officer (CSO) and the clinic owner.

Related: [SECURITY.md](SECURITY.md), [OWNER_INPUTS.md](OWNER_INPUTS.md),
[DATA_FLOW.md](DATA_FLOW.md).

## 1. Standards applicability

### DCB0129 (clinical risk management — manufacturer)
This platform is **health IT software** used in the delivery of care
(scheduling, patient communication, documentation support). DCB0129 applies to
its development. **Required:** appoint a CSO, maintain a clinical risk
management file and hazard log, and produce a clinical safety case report before
production use. This document is the starting point, not the finished case.

### DCB0160 (clinical risk management — deploying organisation)
Sheffield Dermatology, as the deploying organisation, must run its own DCB0160
process: local hazard assessment, safety incident management, and sign-off.
**Required:** owner to nominate a CSO and complete deployment risk assessment.

### CQC (Care Quality Commission)
An independent doctor providing consultations in England is normally required to
register with the CQC. **Conclusion:** registration is expected; the owner must
confirm status and number (tracked in OWNER_INPUTS.md, `clinic.cqc`). The
platform surfaces this as a production blocker.

### DSPT (Data Security and Protection Toolkit)
Required if the clinic processes NHS patient data or connects to NHS services.
**Conclusion:** treated as **private-only pending owner confirmation**
(`governance.dsptp`/`5.9`). If NHS-commissioned work is undertaken, a DSPT
submission is required.

### UK medical device regulation (UK MDR 2002)
The booking, portal and administration functions are **non-diagnostic** and do
not make or drive clinical decisions, so they are **unlikely to be a medical
device**. However, the **AI-scribe pathway** (Heidi) requires a formal
assessment: because a clinician reviews and approves every note before it enters
the record and no diagnosis is automated, the intended-use argument is that it
is a documentation aid, not a device — but this **must be formally assessed and
documented** before the scribe is used in production. **Required:** owner/CSO to
complete and record the assessment.

### DTAC (Digital Technology Assessment Criteria)
If the clinic ever seeks NHS adoption, DTAC (clinical safety, data protection,
technical security, interoperability, usability/accessibility) provides a useful
consolidated checklist. Oriented here for future reference; not currently
required for private-only operation.

## 2. Hazard log (starter — to be completed by the CSO)

Severity/likelihood ratings are placeholders for the CSO to set.

| # | Hazard | Potential harm | Implemented mitigation (file) | Residual action for owner/CSO |
|---|---|---|---|---|
| H1 | Wrong-patient booking / record | Care recorded against wrong person | Bookings link to matched/created patient; staff open records by verified id; audit trail (`src/lib/audit`) | Confirm identity-matching policy; Semble as source of truth |
| H2 | Double-booking a clinician | Clinic disruption, missed care | DB unique index on (clinician, start) for live statuses; server-side `isSlotFree` re-check (`src/lib/booking/`) | Confirm slot rules with clinic |
| H3 | Missed urgent concern via portal/booking | Delayed care | Prominent urgent-care signposting (999/111) on public site, booking, portal; portal states it is not monitored (`/urgent-help`) | Confirm wording; staff triage process for enquiries |
| H4 | Unreviewed AI note reaching the record | Incorrect clinical documentation | Consent-first flow; drafts labelled AI; clinician approval required with recorded approver+time; audio retention off (`src/server/scribe.ts`) | CSO sign-off of scribe assessment (§1) |
| H5 | Notification/outbox failure | Patient not informed of appointment | Outbox with retry + dead-letter + admin alert (`src/lib/jobs/`); status visible in admin | Define fallback (phone) for failed notifications |
| H6 | Unauthorised access to records | Confidentiality breach | RBAC checked server-side on every action; MFA for staff; row-scoped patient access; hash-chained audit | Access review cadence; DPIA sign-off |
| H7 | Data loss | Loss of records | Postgres backups + storage backups (DEPLOYMENT.md) | Backup schedule + tested restore |
| H8 | Consent not captured/AI used without consent | Legal/ethical breach | Consent recorded before transcription; decline recorded; consent history in portal | Approve consent wording; DPIA |
| H9 | Payment marked paid in error | Financial/record error | Payment success only via signed webhook + amount cross-check | Reconciliation process |

## 3. Safety incident management

Owner/CSO to define: how staff report a suspected clinical-safety issue, triage
and severity assessment, corrective action, and the link to the information
governance incident process (SECURITY.md §incident response). The audit trail
(`/admin/audit`, hash-chained, integrity-checked) supports investigation.

## 4. Pre-production clinical-safety checklist

- [ ] CSO appointed (owner input)
- [ ] Clinical risk management file + hazard log completed and signed
- [ ] Clinical safety case report produced (DCB0129) and deployment assessment (DCB0160)
- [ ] AI-scribe medical-device assessment documented and signed
- [ ] CQC registration confirmed
- [ ] DSPT decision recorded (private-only vs NHS)
- [ ] Consent wording clinically approved
- [ ] Urgent-care signposting reviewed by a clinician
- [ ] Staff trained on triage, consent and incident reporting
