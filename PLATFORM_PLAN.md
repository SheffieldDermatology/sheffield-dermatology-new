# Sheffield Dermatology digital platform plan

## Recommended decision

Launch one branded digital front door, but do **not** replace Semble as the clinical record in the first release.

- `sheffielddermatology.com` — public information and appointment requests.
- `portal.sheffielddermatology.com` — secure staff workspace with single sign-on and multi-factor authentication.
- `patients.sheffielddermatology.com` — patient portal supplied by, or securely connected to, the approved practice-management system.

The staff workspace can make the tools feel like one product while Semble remains the system of record. Heidi can be launched through its supported Semble integration. The workspace should not silently copy clinical records into a second database.

## Why this route

Semble currently includes patient records, scheduling, prescribing, laboratory workflows, referrals, billing, reporting, online bookings, video consultations and a patient portal. It also advertises a public healthcare API and a direct Heidi AI scribe integration. Rebuilding all of these capabilities at once would introduce unnecessary migration, clinical-safety, privacy and business-continuity risk.

Semble states that customers can export their data. That makes a later move possible, but it should be treated as a controlled clinical-system migration—not a normal website import.

## Proposed product modules

### Public website

- Clinic and dermatologist profile
- Conditions and treatments
- Patient information
- Appointment request or live booking integration
- Contact information and urgent-care signposting
- Privacy, cookie, accessibility and terms pages

### Staff workspace

- Daily dashboard
- Clinic calendar
- Patient lookup through the EHR
- Consent-first Heidi scribe launcher
- Shared tasks and team messages
- Team files, policies and templates
- Billing and operational reporting links
- Role, access and audit administration

### Secure team files

The file workspace needs:

- Encryption in transit and at rest
- Role-based and folder-level permissions
- Multi-factor authentication
- Version history and restore
- Complete audit logs
- Retention and deletion rules
- Malware scanning
- Tested backups and disaster recovery
- UK GDPR-compliant contracts and hosting decisions

General clinic policies, templates and operational files may live here. Patient-specific clinical documents should normally remain attached to the patient record in the EHR unless the information-governance design explicitly approves another flow.

## Heidi workflow

1. Open the verified patient record.
2. Explain the AI scribe and record the patient's decision.
3. Start the approved Heidi session.
4. Generate a draft note.
5. Require the clinician to review and edit the draft.
6. Save only the approved note to the official clinical record.
7. Apply the agreed transcript/audio retention settings.

The website must never present AI-generated text as final clinical documentation without clinician approval.

## Delivery phases

### Phase 1 — public site and safe integration

- Approve content, services, professional details and contact information.
- Replace the demonstration appointment form with Semble online booking or another approved provider.
- Configure domain, hosting, privacy notice, cookie controls, accessibility and security headers.
- Complete penetration testing appropriate to the final architecture.

### Phase 2 — staff control centre

- Select an identity provider and require MFA.
- Define staff roles and least-privilege access.
- Connect Semble using supported authentication and APIs.
- Enable the supported Heidi integration.
- Connect approved file storage.
- Add task, notification and operational reporting workflows.
- Add central audit monitoring and incident response.

### Phase 3 — migration assessment

- Create a feature-by-feature inventory of current Semble use.
- Request the complete data-export specification, API terms, attachments format and termination process.
- Inventory patients, appointments, notes, letters, forms, prescriptions, labs, images, invoices, payments, insurers, templates, tasks, users, permissions and audit records.
- Define record-retention requirements and identify data that will not migrate.
- Complete a DPIA and clinical risk assessment.
- Build and validate a representative test migration.
- Reconcile record counts and test clinical samples.
- Run parallel systems during an agreed safety window.
- Obtain clinical, information-governance and operational sign-off before cutover.
- Preserve a read-only archive where required.
- Maintain a tested rollback and business-continuity plan.

## Production gates

Do not place real patient information into this prototype. Production requires, at minimum:

- A named data controller and documented processor relationships
- Lawful basis and special-category condition assessment
- Data Protection Impact Assessment
- Clinical safety ownership and documented hazard management
- Role-based access, MFA and session controls
- Full audit logging
- Secure development, independent testing and vulnerability management
- Backup, disaster recovery and downtime procedures
- Supplier due diligence and data-processing agreements
- Consent and transparency materials for AI-assisted documentation
- Staff training and incident-response procedures

## Information still needed

- Full professional details for Dr Vinod Elangasinghe
- Clinic legal entity and data-controller name
- Current Semble plan and enabled modules
- Number of staff, roles and locations
- Approximate number and size of patient records and attachments
- Current booking, payment, insurer, lab and pharmacy workflows
- Existing Microsoft 365 or identity-provider subscription
- Desired patient portal features
- Whether the clinic is private-only or also handles NHS-commissioned work
- Required launch date and budget range

## Current prototype status

The project includes:

- `index.html` — responsive public clinic website and appointment-request demonstration.
- `portal.html` — responsive staff control-centre demonstration.
- `styles.css` and `script.js` — public website styling and interactions.
- `portal.css` and `portal.js` — staff workspace styling and interactions.

All patients, appointments, files and workflows shown in the staff portal are fictional. The prototype does not authenticate users, access a microphone, send messages, store files, process payments or connect to Semble/Heidi.

## Official sources reviewed

- Semble platform: https://www.semble.io/platform
- Semble EHR: https://www.semble.io/platform/ehr
- Semble integrations and API: https://www.semble.io/platform/integrations-api
- Semble data migration: https://www.semble.io/platform/data-migration
- Heidi UK product workflow: https://www.heidihealth.com/en-gb/product/how-it-works
- Heidi data security: https://support.heidihealth.com/en/articles/8885107-data-security-at-heidi-health
- ICO guidance on health data: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-is-special-category-data/
- UK government guidance for digital health technologies: https://www.gov.uk/government/publications/code-of-conduct-for-data-driven-health-and-care-technology/initial-code-of-conduct-for-data-driven-health-and-care-technology
