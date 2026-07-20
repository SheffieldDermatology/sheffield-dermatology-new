# Owner inputs — Sheffield Dermatology

Every item below is information or a decision only the clinic owner (or Dr Vinod
Elangasinghe) can provide. Nothing in this list has been invented or filled with
placeholder content presented as real. Items marked **Blocks production: Yes**
must be resolved before the platform goes live; the restricted admin area shows
the same list as a live setup checklist (`/admin/setup`).

Legend — Status: `MISSING` (nothing supplied), `PARTIAL` (some information
supplied), `SUPPLIED` (complete, entered into the admin area), `VERIFIED`
(checked against an authoritative source).

## 1. Clinic identity and legal

| # | Information required | Why it is required | Where it will appear | Blocks production | Suggested safe default | Status |
|---|---|---|---|---|---|---|
| 1.1 | Legal entity name and company/registration number of the clinic (data controller) | UK GDPR requires a named data controller; needed for privacy notice, terms, invoices | Privacy notice, terms, invoice footer, admin settings | **Yes** | None — must be supplied | MISSING |
| 1.2 | ICO registration number | Data-controller registration evidence | Privacy notice | **Yes** | None | MISSING |
| 1.3 | Clinic street address in Sheffield | Contact page, invoices, structured data, appointment confirmations | Contact page, footer, booking emails | **Yes** | Site shows "Address to be confirmed" until supplied | MISSING |
| 1.4 | Clinic telephone number | Patient contact, urgent signposting | Notice bar, contact page, confirmations | **Yes** | Phone link hidden until supplied | MISSING |
| 1.5 | Clinic email address (and whether it is a secure mailbox) | Patient contact, transactional email reply-to | Contact page, email templates | **Yes** | Contact form only until supplied | MISSING |
| 1.6 | Opening hours | Contact page, booking rules, structured data | Contact page, admin availability rules | No | Site shows "Hours to be confirmed" | MISSING |
| 1.7 | CQC registration status and number (if applicable) | Independent healthcare providers in England normally require CQC registration; must be assessed | Footer, about page, compliance docs | **Yes** | None — legal assessment required, see CLINICAL_SAFETY.md | MISSING |

## 2. Clinician details

| # | Information required | Why it is required | Where it will appear | Blocks production | Suggested safe default | Status |
|---|---|---|---|---|---|---|
| 2.1 | Dr Vinod Elangasinghe — qualifications (as they should be published) | Cannot invent medical qualifications | About page, structured data | **Yes** | "[To be confirmed]" placeholder clearly labelled | MISSING |
| 2.2 | GMC registration number | Verifiable professional registration; patients and insurers expect it | About page | **Yes** | Omitted until supplied and verified against the GMC register | MISSING |
| 2.3 | Professional memberships (e.g. BAD) — only if genuinely held | Cannot invent memberships | About page | No | Section hidden until supplied | MISSING |
| 2.4 | Professional biography and verified experience | Cannot invent clinical experience | About page | **Yes** (for that page) | Neutral copy without unverifiable claims | MISSING |
| 2.5 | Professional portrait photograph | About page, structured data | About page | No | Branded placeholder retained | MISSING |
| 2.6 | Any additional clinicians and their details | Staff accounts, booking clinician choice | Booking, staff admin | No | Single-clinician configuration | MISSING |
| 2.7 | Insurer recognition list (which insurers recognise Dr Elangasinghe) | Cannot invent insurer recognition | Insurance page, fees page | **Yes** (for insurance page) | Page explains insurer billing generally, no named insurers | MISSING |

## 3. Services and fees

| # | Information required | Why it is required | Where it will appear | Blocks production | Suggested safe default | Status |
|---|---|---|---|---|---|---|
| 3.1 | Final approved service list | The prototype list must be clinically approved | Public services pages, booking service picker, admin services | **Yes** | Current draft list flagged "pending approval" in admin | PARTIAL — draft list exists, unapproved |
| 3.2 | Consultation and procedure prices | Cannot invent prices; CMA/consumer law requires accurate pricing | Fees page, booking, invoices | **Yes** | Fees page shows "Fees confirmed on booking" until supplied | MISSING |
| 3.3 | Deposit policy (whether deposits are taken and how much) | Booking payment step configuration | Booking checkout, cancellation policy | **Yes** (for payments) | Deposits disabled; booking is request-only | MISSING |
| 3.4 | Cancellation/rebooking rules and fee policy | Cancellation policy page, refund logic | Cancellation policy, booking terms | **Yes** | Conservative default: free cancellation ≥48h, no online fee taken | MISSING |
| 3.5 | Appointment durations per service | Calendar slot generation | Booking, admin services | No | 30 min default, 45 min new consultations (draft, needs approval) | PARTIAL |

## 4. Systems and integrations

| # | Information required | Why it is required | Where it will appear | Blocks production | Suggested safe default | Status |
|---|---|---|---|---|---|---|
| 4.1 | Semble account confirmation, plan and enabled modules | Semble is the clinical system of record | Integration settings | **Yes** (for live booking/records) | Adapter runs in development mode with labelled fictional data | MISSING |
| 4.2 | Semble API credentials (entered directly into the deployment environment — never share in chat/email) | Live availability, appointments, patient links | Server environment variables | **Yes** | Integration disabled, request-only booking fallback | MISSING |
| 4.3 | Heidi account and integration route (Semble-linked or enterprise API) | AI scribe workflow | Staff scribe launcher | **Yes** (for live scribe) | Consent workflow works; transcription marked "not connected" | MISSING |
| 4.4 | Approval of AI-scribe consent wording | Consent text is a clinical-governance decision | Scribe consent screen, patient info page | **Yes** | Draft wording provided, marked DRAFT until approved | PARTIAL — draft written |
| 4.5 | Decision on audio retention (recommended: real-time transcription, no audio retained) | DPIA and UK GDPR requirement | Scribe settings, privacy notice | **Yes** | Audio retention feature flag OFF | MISSING (decision) |
| 4.6 | Microsoft 365 / SharePoint tenancy details (if team files should use Microsoft Graph) | Team file storage provider choice | Staff files settings | No | Built-in secure storage provider used instead | MISSING |
| 4.7 | Payment provider decision (Semble Pay / Stripe / other) and account | Deposits and balance payments | Booking checkout, patient portal payments | **Yes** (for payments) | Payments disabled; invoices recorded without online payment | MISSING |
| 4.8 | Healthcode account details (if insurer e-billing wanted) | Insurer invoicing workflow | Finance area | No | Manual insurer invoicing recorded in app | MISSING |
| 4.9 | Transactional email provider account (e.g. clinic-approved provider) and sending domain | Booking confirmations, portal invitations | Server environment | **Yes** | Outbox captured in app, nothing sent externally | MISSING |
| 4.10 | SMS provider account and sender ID (optional) | Appointment reminders | Server environment | No | SMS disabled | MISSING |
| 4.11 | Accounting integration decision (e.g. Xero) | Finance exports | Finance area | No | CSV export only | MISSING |
| 4.12 | Video consultation platform decision (Semble video or other approved platform) | Video appointment joining links | Booking, patient portal | **Yes** (for video appointments) | Video option shown but marked "link sent after confirmation" | MISSING |

## 5. Governance and compliance decisions

| # | Information required | Why it is required | Where it will appear | Blocks production | Suggested safe default | Status |
|---|---|---|---|---|---|---|
| 5.1 | Named Data Protection lead / DPO decision | Accountability under UK GDPR | Privacy notice, SECURITY.md | **Yes** | None | MISSING |
| 5.2 | Completed DPIA sign-off | Special-category data processing at scale | Compliance records | **Yes** | Draft DPIA structure provided in SECURITY.md | MISSING |
| 5.3 | Clinical safety ownership (DCB0129/DCB0160 assessment) | See CLINICAL_SAFETY.md — assessment documented, owner must confirm | Compliance records | **Yes** | Assessment drafted; sign-off required | PARTIAL |
| 5.4 | DSPT (Data Security and Protection Toolkit) decision | Required if NHS data/services are involved | Compliance records | **Yes** if NHS work | Documented as "private-only pending confirmation" | MISSING (decision) |
| 5.5 | Record retention schedule approval | Deletion/retention automation | Admin retention settings | **Yes** | Conservative default: retain, no automated deletion | MISSING |
| 5.6 | Privacy notice, cookie policy, terms — legal review | Legal documents need professional review | Public legal pages | **Yes** | Complete drafts provided, marked "draft pending review" | PARTIAL — drafts written |
| 5.7 | Data-processing agreements with each supplier (Semble, Heidi, hosting, email, SMS, payments) | UK GDPR Art. 28 | Compliance records | **Yes** | Checklist in SECURITY.md | MISSING |
| 5.8 | Backup/disaster-recovery hosting decisions (region must be UK/EEA or adequacy) | Health data hosting requirement | DEPLOYMENT.md | **Yes** | Documented UK-region requirement | MISSING (decision) |
| 5.9 | Whether the clinic handles NHS-commissioned work or private only | Affects DSPT, consent flows, reporting | Compliance records | **Yes** (decision) | Treated as private-only until confirmed | MISSING |
| 5.10 | Staff list, roles and MFA enrolment | Account provisioning | Admin users | **Yes** | Only seeded development accounts exist | MISSING |

## 6. Content approvals

| # | Information required | Why it is required | Where it will appear | Blocks production | Suggested safe default | Status |
|---|---|---|---|---|---|---|
| 6.1 | Clinical review of all condition/treatment page copy | Medical content must be clinician-approved | All condition pages | **Yes** | Pages carry "content pending clinical review" flag in admin | MISSING |
| 6.2 | Patient-information leaflets/instructions to publish | Patient info page | Patient information | No | General NHS-signposting copy only | MISSING |
| 6.3 | Testimonials (only if genuine, consented and compliant) | Cannot invent testimonials | Not shown anywhere until supplied | No | No testimonial section rendered | MISSING |
| 6.4 | Photography of the clinic | Visual identity | Home/about | No | Illustrated brand visuals retained | MISSING |
| 6.5 | Domain DNS control for sheffielddermatology.com | Deployment | DNS | **Yes** | Deployed to staging URL only | MISSING |

## How to supply these

1. Sign in to the staff workspace as a system administrator.
2. Open **Admin → Setup checklist** (`/admin/setup`) — the same items appear there with forms.
3. Enter values directly; every change is validated, permission-checked and audited.
4. API credentials and secrets must be set as environment variables in the
   deployment platform (see `DEPLOYMENT.md` and `.env.example`) — never send
   them in chat or email, and never commit them to the repository.
