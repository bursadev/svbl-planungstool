---
type: note
project: "[[SVBL]]"
tags: [requirements, scheduling]
---
# Requirements

What the SVBL course-planning PoC has to do, grouped by capability. Each capability lists features. Each feature lists what has to exist for it: a rule (concept), a backend part, a frontend part. Add new items where they belong; add a new capability only when none fits.

Sources: [[30 Projects/SVBL/Notes/Roadmap|Roadmap]] (phases 2 and 3), [[30 Projects/SVBL/Notes/Interview Protocol|Interview Protocol]] (planning-team interview), [[30 Projects/SVBL/Notes/Open Questions|Open Questions]]. The domain model behind these requirements is in [[30 Projects/SVBL/Notes/Entities|Entities]], which also holds the German–English glossary.

Legend
- `#must` needed for the PoC to count as a success
- `#should` important, in the PoC if time allows
- `#nice` later phase ("Weitere Schritte" in the roadmap)
- `#question` unresolved with SVBL, see Open Questions

## 1. Authentication & Access
- Login
	- Login endpoint and session or token handling in the backend #must
	- Login form and page in the frontend #must
	- Logout and session expiry #must
	- Identity provider: start with Clerk to move quickly, behind an auth adapter so it can be swapped for Entra ID SSO or self-hosted auth later ([[ADR-0003 Start with Clerk for Authentication|ADR-0003]], proposed); precondition is SVBL's written acceptance that staff account data is stored in the US #question
	- Only account data (name, email, login metadata, role name) goes to the identity provider; planning, apprentice, and certificate data never do #must
- Role-based access control
	- Roles: Planner, Sales, Management, Instructor, Trainer (external), Admin; see [[30 Projects/SVBL/Notes/Entities#Role|Role]] #must
	- Backend guard on every endpoint; the role decides read vs. write per resource #must
	- Role assignment lives in Clerk, one role per user; the backend reads the role from the verified session token and enforces permissions and row-level rules itself #must
	- Frontend hides or disables actions the current role may not perform #must
	- Instructors see only their own assignments, availabilities, and certificates; participant and customer data is restricted ("Restrictions on what can be seen") #must
	- External trainers (Lehrmeister) get a narrow role: enroll and view their own apprentices only #should
- Audit trail
	- Every change to a plan records who, when, before, and after #should
	- Four-eyes principle for confirming or changing plans #question

## 2. User & Role Management
- User administration
	- User accounts, role assignment, and deactivation are managed in Clerk (dashboard or embedded Clerk components); the tool mirrors users and roles read-only and keeps its internal User row in sync by webhook or on first login #must
	- Link a user account to an Instructor record so instructors can log in #should
	- Invitations through Clerk; Microsoft sign-in as a connection so SVBL staff can use their existing account #should
- Language and locale
	- UI in German first #must
	- French and Italian UI, since SVBL runs courses in all three languages #question
	- Dates, week numbers, and calendars in the Swiss convention (Monday first, ISO weeks) #must

## 3. Instructor Management (Ausbilder)
- Instructor master data
	- Person data, contact, employment type (employee, about 70, or freelancer, about 140), home location, languages (D, F, I), status #must
	- Work-time model and overtime rules per employment type #should
	- Cost rate for freelancers as input for later profitability analysis #nice
	- Backend: CRUD and list with filters (skill, certificate, language, location, availability) #must
	- Frontend: instructor list and detail page with tabs for skills, certificates, availability, assignments #must
- Skills and professions
	- Skill catalogue; assign skills to instructors #must
	- Skills are a hard requirement for assignment: a course type lists required skills, the instructor has to hold all of them #must
- Certificates
	- Certificate types with validity in years (1 to 5, or none) and issuer (SUVA, IPAF, internal) #must
	- Per instructor: certificate instances with issue date, expiry date, document #must
	- Validity is checked on every course day of an assignment, not only on the start date #must
	- Certificate traffic light: valid, expiring soon, expired; threshold configurable #must
	- Qualification-maintenance rules such as "aerial-platform (IPAF) courses must be taught at least 5 times a year", tracked per instructor #should, exact rule #question
- Device qualifications
	- Which certificate or skill qualifies an instructor for which device type (forklift categories S, BM, R1 to R4, aerial platforms, cranes) #must
	- Device qualification is a hard requirement for assignment #must
- Availability
	- Instructor calendar: available, absent, blocked, assigned #must
	- Instructors request vacation in the tool; planners approve or reject ("Ausbildner should request vacations") #should
	- Availability is a hard requirement; overlapping assignments are impossible #must
	- Freelancer availability: how it is queried today and which rules differ from employees #question
- Implicit knowledge
	- Free-text notes and structured preferences per instructor (preferred locations, max travel, pairings to avoid) so planner knowledge leaves the planners' heads #should

## 4. Locations & Facilities (Standorte)
- Location master data
	- The 11 training centres with address, canton, language region, contact, capacity (rooms, parallel courses) #must
	- External customer sites for company courses on site #should
	- Backend: CRUD; frontend: location list, detail, courses per location #must
- Vocational schools (Berufsschulen)
	- About 20 vocational schools mapped to the 5 locations that host ÜK ("20 Berufschule -> 5 Standorte") #must
	- Default location for an apprentice's ÜK is the location nearest their school #must
	- School days and holidays per school feed the time windows ("schooldays are calculated in") #should
- Travel
	- Travel time or distance between locations and from an instructor's home location #should
	- Location is a soft requirement in matching: preferred, never blocking #must

## 5. Devices & Equipment (Geräte)
- Device master data
	- Device types (forklift categories, aerial platforms, cranes) and individual devices with inventory number, current location, status #must
	- Which device types a course type needs, and how many #must
	- Backend: CRUD; frontend: device list per location and per type #must
- Device planning (Maschinenplanung)
	- A device is reserved per course day; double booking is impossible #must
	- Devices can move between locations; a move is planned with a date so availability follows #should, whether this happens #question
	- Maintenance windows block a device #should
	- Bottleneck alert when demand for a device type exceeds supply at a location in a week #should

## 6. Course Catalogue & Curriculum
- Course types (Kurstypen)
	- Code, name, kind (ÜK for apprentices, adult course, exam or re-examination), duration in days (1, 2, 4), may span weeks, weekday rule (adult courses partly Saturday to Saturday) #must
	- Track for ÜK: EFZ (about 80 % of apprentices) or EBA (about 20 %), with different courses #must
	- Required skills, required certificate types, required device types with quantity, offered languages, min and max participants #must
	- Backend: CRUD; frontend: catalogue with filters #must
- ÜK curriculum (Bildungsplan)
	- Per track the ordered list of ÜK modules; about 25 ÜK days per apprentice over 3 years #must
	- Which ÜK belongs to which semester is a hard rule; the exact time inside the semester is flexible #must
	- Dependencies between modules (module B needs module A) #must
	- Time window per module and cohort: the months between which the ÜK has to run ("Know which ÜK von bis") #must
- Adult courses (Erwachsene)
	- Forklift (SUVA categories), IPAF aerial platform, dangerous goods, safety, warehouse and transport technology, re-examinations #should
	- Public course dates and company courses at the customer's site #should

## 7. Apprentice Management (Lernende)
- Import from vocational schools
	- CSV import per school ("Kriegen CSV Export von Berufsschulen") with column mapping, preview, error report #must
	- Apprentices are not edited in the tool; the school export is the source of truth ("Lernende -> Können nicht editiert werden") #must
	- Re-import updates existing records and never duplicates; provenance per record #must
- Validation and duplicates
	- Scoring function that flags probable duplicates ("Er ist doppelt drin") with tolerant identifier matching ("Identifier -> Fehlertoleranz") #must
	- Review queue where a planner merges or dismisses a duplicate ("Fixing students") #must
- Apprentice record
	- External id, name, track (EFZ, EBA), start year and cohort, vocational school, training company, language #must
	- Progress: which ÜK modules attended, open, missed; each apprentice is schedulable on their own ("Jeder Lernende ist alleine organisierbar") #must
	- Frontend: apprentice list with filters (school, cohort, track, open modules) and a detail page with course history #must
- Attendance and no-shows
	- Mark attended, no-show, cancelled per course day #must
	- A no-show creates a follow-up enrollment in the next matching course ("Not coming student -> Directly follow up termin") #must
- Enrollment by trainers
	- Lehrmeister can enter their apprentices into a course ("Lehrmeister kann Lernende eintragen"); apprentices are then tracked course for course #should
	- Confirmation to the trainer and the apprentice #nice

## 8. Training Companies, Trainers & Customers
- Training companies (Lehrbetriebe) with contact and their apprentices #should
- Trainers (Lehrmeister, Berufsbildner) as external users with a narrow role (see 1) #should
- Customers (Kunden) booking adult or company courses, with contact and on-site locations #should
- Source of truth for customers and invoices stays in Abacus and OdAOrg for the PoC #question

## 9. Demand & Capacity Planning
- Demand
	- Demand per cohort, track, module, and region: number of apprentices → number of courses needed per time window ("We know how many courses we need to take in which week") #must
	- Demand for adult courses from Sales: expected participants per course type and region #should
- Planning order
	- Demand → courses → time windows → availability, in that order ("Planung: Demand -> Kurse -> Zeitfenster -> Availability") #must
	- Step 1: which week which courses run, with location ("First plan in which week which courses are taken") #must
	- Step 2: how many apprentices per course ("Wieviel lernende haben wir pro kurs") #must
	- Step 3: instructors and devices are allocated ("Ausbildner werden einbezogen") #must
- Capacity view
	- Per week and location: courses planned, instructor days available, device days available, gap #must
	- Utilization per instructor and per location over time (Auslastungsdashboard) #must

## 10. Course Scheduling (Kursdurchführungen)
- Course instances
	- Create a course from a course type: location, language, course days, capacity, status (demand, planned, open, confirmed, running, done, cancelled) #must
	- Course days can be non-consecutive and span weeks ("Wochen übergreifend ist möglich") #must
	- Backend: CRUD and calendar queries; frontend: create and edit dialog, calendar and list #must
- Scheduling into time windows
	- Open courses are placed into the time window of their module; the engine proposes weeks with free capacity ("Kurse werden in Zeitfenster gescheduled") #must
	- Validation: course inside its window, participants within min and max, prerequisites of enrolled apprentices met #must
- Changes and cancellations
	- Reschedule or cancel a course; enrolled apprentices get follow-ups, assigned resources are released #must
	- Change frequency and who may change what #question
- Publishing
	- Public course dates are published to the website through the existing integration ("Publishing webpages is using an integration") #should, which integration #question

## 11. Matching Engine (Ressourcenzuweisung)
- Feasibility check (deterministic)
	- Hard constraints: skills, certificates valid on every course day, device qualification, language, availability, device available at the location, course inside its time window #must
	- Soft constraints: location and travel, overtime, instructor preferences, continuity (same instructor for a cohort) #must
	- Result per candidate: feasible yes or no, list of violated hard constraints, soft score with reasons #must
	- Backend: pure functions over the data model, unit-tested per rule; exposed as REST endpoints for candidate search and validation #must
- Suggestion logic
	- Rank feasible instructors and devices for a course; propose alternative instructors or dates on conflict #must
	- Automatic allocation for a week or a whole time window ("Automatic Allocation"); the planner confirms #should
	- Resource optimization across courses: minimize device and instructor conflicts and travel ("Resource Optimization (Gerät & Ausbildner)") #should
- Explainability
	- Every proposal and every rejection carries a human-readable reason; the AI assistant reuses these #must
- Rules configuration
	- Constraint weights and thresholds (expiry warning days, max travel, overtime cap) configurable without a deployment #should

## 12. Planning Board & Dashboard
- Weekly overview
	- Week grid per location: courses as text blocks with instructor, device, participants, status colour ("Seeing Weekly Overview -> See Text Blöck") #must
	- Filters and search: location, course type, instructor, track, status #must
- Drag-and-drop editor
	- Move a course block to another week or location; drop an instructor or device onto a course; live feasibility feedback from the engine ("Drag And Drop Editor") #should
- Course calendar and resource view
	- Month and week calendar of courses; per-resource timeline for instructor, device, location #must
- Dashboard
	- Certificate traffic light, utilization overview, open courses without instructor or device, upcoming bottlenecks #must
	- Chat panel for the AI assistant #must
- Design
	- Aligned with the Swiss Logistics corporate identity #should
	- Desktop first; mobile use #question

## 13. Alerts & Notifications
- Certificate expiry alerts per instructor with lead time, visible on the dashboard #must
- Course without instructor or device inside n weeks #must
- Resource bottleneck alerts per week and location #should
- Instructor is notified about new or changed assignments #should
- Channel: in-app for the PoC; email or push later #nice

## 14. AI Assistant
- Natural-language queries
	- German questions are translated into deterministic calls on the matching engine and database (tool calling) #must
	- Read-only for the PoC: the assistant explains and justifies, it does not decide or change data ("erklärt und begründet, entscheidet aber nicht") #must
	- Answers cite the records and rules they rely on #must
	- Answer language German with Swiss spelling; French and Italian #question
- Guardrails
	- No free-text access to raw data outside the tools; the assistant declines when no tool applies #must
	- Evaluation set built from the planning team's top-10 real questions, collected before the concept phase #must
- Model and hosting
	- Provider choice: a model hosted in Switzerland (self-hosted on Exoscale or a Swiss-region API) vs. an API outside Switzerland with pseudonymized data; has to fit [[ADR-0001 Host in Switzerland on Exoscale|ADR-0001]] #question
	- Provider-agnostic integration so the model can be swapped #should
- Later: the assistant proposes actions the planner confirms ("plane Ausbilder X um") #nice

## 15. Data Import & Integrations
- Excel import
	- One-off pipeline from the planning Excel into the database: sheet analysis, mapping, cleaning report, import batch with provenance #must
	- Gaps, duplicates, and implicit rules found during import are logged for the planners #must
	- Parallel operation with the Excel during the test phase: cut-over date vs. sync #question
- School CSV import: see 7 #must
- OdAOrg and Abacus: read-only export or API, or out of scope for the PoC #question
- Website publishing integration: see 10 #should
- Export of course plan and assignments as Excel or PDF for people outside the tool #should

## 16. Reporting
- Utilization per instructor, location, device type, per week and month #must
- Certificate status overview #must
- Course completion and no-show rates per school and cohort #should
- Course profitability #nice

## 17. Non-Functional Requirements
- Data protection and residency
	- All data, including personal data of employees, freelancers, and apprentices, is hosted in Switzerland on Exoscale ([[ADR-0001 Host in Switzerland on Exoscale|ADR-0001]]); revDSG compliant #must
	- Retention and deletion periods for planning and personal data #question
- Hosting and operations
	- Exoscale in a Swiss zone, replacing Azure from the roadmap ([[ADR-0001 Host in Switzerland on Exoscale|ADR-0001]]); Docker, CI/CD pipeline, Git repository #must
	- Backup, monitoring, availability expectations for a PoC #question
	- Repository ownership and handover process (SVBL GitHub organisation vs. ETH juniors) #question
- Tech stack
	- PostgreSQL as the system of record ([[ADR-0002 Use PostgreSQL|ADR-0002]]); managed on Exoscale or self-run is decided in phase 2 #must
	- Frontend React or Next.js; backend TypeScript with NestJS (preferred) or Python with FastAPI (roadmap); decision as ADR #question
	- ORM: Drizzle vs. Prisma vs. TypeORM, decided after the data model #question
	- Maintainable by SVBL IT after handover: conventional stack, documentation, user manual on GitHub #must
- Quality
	- Matching rules covered by unit tests; import covered by fixture tests; test phase of 1 to 2 weeks with real planning cases #must
	- Weekly overview and feasibility check respond within about a second for the full data set #should
- Volume assumptions to confirm
	- Courses per year, instructors (about 210 incl. freelancers), 11 locations, devices, apprentices per cohort #question

## 18. Out of Scope for the PoC
- Customer portal and digital customer journey from login to invoice #nice
- Invoicing and Abacus write-back #nice
- Push notifications #nice
- On-call planning (Bereitschaftsplanung) #nice
- Course profitability analysis #nice
- "Digital Company Brain" expansion #nice
