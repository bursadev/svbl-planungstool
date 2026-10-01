# Stammdaten: REST API and screens

Date: 2026-10-01. Status: approved in conversation, implementation started. Builds on the data model spec (`2026-10-01-data-model-design.md`).

Master-data screens (Stammdaten) with their CRUD API, so planners can enter instructors, locations, devices, course types, the curriculum and schools, and the web app stops using the prototype's hardcoded data. The matching engine comes after this and reads what these screens write.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Order | Stammdaten before the engine | The engine is only meaningful on real data; SVBL can start entering data during phase 2 |
| API style | REST, plural English nouns, no version prefix, arrays with server-side filters, no pagination | One client, small tables (largest: ~700 apprentices per school year) |
| Validation | `class-validator` DTOs, global `ValidationPipe`, one exception filter producing German field errors | One place for messages; the UI shows them unchanged |
| Roles | Clerk `publicMetadata.role` as a session-token claim, enforced by `@Roles()` in the backend; the frontend only hides | ADR-0003; "Durchsetzung im Backend" from the handoff |
| Delete | Hard delete when unreferenced, 409 on FK violation, otherwise `PATCH { active: false }` | History stays; no soft-delete machinery |
| UI kit | shadcn/ui themed with the handoff tokens | Accessible primitives as plain files SVBL IT can edit; prototype runtime is not for production |
| Data fetching | Server Components with the server-side Clerk token; filters in the URL | Pages render with data, shareable filter URLs, API is the single filter implementation |
| Forms | Client Components, react-hook-form + zod, dialogs like the prototype | Field errors from the API map onto the form |
| Apprentices | Read-only screens | School export is the source of truth (Requirements §7) |
| Prototype | Moved to `/prototyp`, styles scoped under `.proto` | Stays available for demos without leaking styles |

## Backend

### Routes

| Resource | Routes |
|---|---|
| Standorte | `GET/POST /locations`, `GET/PATCH/DELETE /locations/:id`, `GET/POST /locations/:id/rooms`, `PATCH/DELETE /rooms/:id` |
| Skills | `GET/POST /skills`, `PATCH/DELETE /skills/:id` |
| Zertifikatstypen | `GET/POST /certificate-types`, `PATCH/DELETE /certificate-types/:id`, `PUT /certificate-types/:id/maintenance-course-types` `{ courseTypeIds }` |
| Gerätetypen | `GET/POST /device-types`, `PATCH/DELETE /device-types/:id`, `PUT /device-types/:id/qualifications` `{ certificateTypeIds, skillIds }` |
| Geräte | `GET /devices?deviceTypeId&locationId&mobility&status`, `POST /devices`, `GET/PATCH/DELETE /devices/:id`, `GET/POST /devices/:id/moves`, `DELETE /device-moves/:id`, `GET/POST /devices/:id/maintenance-windows`, `PATCH/DELETE /maintenance-windows/:id` |
| Ausbilder | `GET /instructors?q&skillId&language&locationId&employmentType&status`, `POST /instructors`, `GET/PATCH/DELETE /instructors/:id`, `PUT /instructors/:id/skills` `{ skillIds }`, `GET/POST /instructors/:id/certificates`, `PATCH/DELETE /instructor-certificates/:id`, `GET/POST /instructors/:id/availabilities`, `PATCH/DELETE /availabilities/:id`, `POST /availabilities/:id/approve`, `POST /availabilities/:id/reject` |
| Kurstypen | `GET/POST /course-types`, `GET/PATCH/DELETE /course-types/:id`, `PUT /course-types/:id/requirements` `{ skillIds, certificateTypeIds, devices: [{ deviceTypeId, quantity }] }` |
| Bildungsplan | `GET/POST /curriculum-modules` (`prerequisiteModuleIds` array in the body), `PATCH/DELETE /curriculum-modules/:id`, `GET/POST /cohorts`, `PATCH/DELETE /cohorts/:id`, `GET /time-windows?cohortId`, `POST /time-windows`, `PATCH/DELETE /time-windows/:id` |
| Berufsschulen | `GET/POST /vocational-schools`, `GET/PATCH/DELETE /vocational-schools/:id`, `GET/POST /vocational-schools/:id/classes`, `PATCH/DELETE /school-classes/:id`, `PUT /school-classes/:id/days` `{ schoolYearStart, days: [{ weekday, evening }] }` |
| Lernende | `GET /apprentices?q&vocationalSchoolId&cohortId&track`, `GET /apprentices/:id` |
| Me | `GET /me` → `{ userId, role, email, displayName }` |

`GET` detail responses include the relations the screen needs (instructor: skills, certificates, availabilities, home location; location: rooms; course type: requirements; device: type, home location, moves, maintenance windows). List responses are flat rows with the names needed for the table (e.g. instructor rows carry `homeLocation { id, name }` and `skills [{ id, name }]`).

### Validation and errors

- `class-validator` + `class-transformer`; `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` registered globally.
- One DTO pair per resource: `CreateXDto`, `UpdateXDto = PartialType(CreateXDto)` from `@nestjs/mapped-types`. Enum fields use `@IsEnum`, ids `@IsUUID`, dates `@IsDateString` (date-only, `YYYY-MM-DD`), times `@Matches(/^\d{2}:\d{2}$/)`.
- Global `HttpExceptionFilter` shapes every error as `{ statusCode, message, errors? }`. Validation errors: `message: "Eingabe ungültig."` and `errors: [{ field, message }]`, with German texts from one constraint→message map (`isNotEmpty` → "Pflichtfeld.", `isEmail` → "Ungültige E-Mail-Adresse.", `isEnum` → "Ungültiger Wert.", `isUuid` → "Ungültige Referenz.", `isDateString` → "Ungültiges Datum.", `min`/`max` → "Wert ausserhalb des Bereichs.", default → "Ungültige Eingabe."). Unknown errors: 500 with "Unerwarteter Fehler." and a server-side log.
- `NotFoundException` → 404 "Nicht gefunden."; FK violation on delete (Postgres `23503`) → 409 "Der Eintrag wird noch verwendet und kann nicht gelöscht werden."; unique violation (`23505`) → 409 with the field when derivable ("Code ist bereits vergeben.").

### Roles and users

- Clerk holds the role in `publicMetadata.role` (one of `planner, sales, management, instructor, trainer, admin`). The Clerk session token is customised in the dashboard with `{ "role": "{{user.public_metadata.role}}" }`.
- `ClerkAuthGuard` sets `req.user = { userId, role }`. If the token has no `role` claim, the guard fetches the user from Clerk's backend API (`clerkClient.users.getUser`) and caches the result in memory for 10 minutes.
- `@Roles(...roles)` decorator and `RolesGuard` (global, after the auth guard). Policy for this slice: every signed-in role may read; `planner` and `admin` may write. Controllers declare `@Roles(UserRole.Planner, UserRole.Admin)` on write handlers.
- `UsersService.touch({ userId, role, email, displayName })` upserts the `user` row; the guard calls it at most once per user per 10 minutes (in-memory timestamp map). Email and name come from the token's standard claims when present, otherwise from the Clerk API fetch.
- `@CurrentUser()` returns `{ userId, role, dbUserId }`.

### Audit

`AuditService.record({ actorUserId, entityType, entityId, action, before, after, summary })` writes an `audit_entry`. Every create/update/delete in the services calls it with `before`/`after` snapshots (the entity's plain columns) and a German `summary` ("hat Raum «Halle A» in Rupperswil angelegt"). Actions: `create`, `update`, `delete`, `approve`, `reject`, `replace_skills`, `replace_requirements`, …

### Module layout

Each domain module from the data-model spec gains `*.controller.ts`, `*.service.ts` and `dto/*.dto.ts`. Shared pieces in `src/common/`: `http-exception.filter.ts`, `roles.decorator.ts`, `roles.guard.ts`, `audit.service.ts` (in `system/`), `database-errors.ts` (Postgres error mapping).

### Tests

- e2e per controller (`test/<resource>.e2e-spec.ts`) with supertest against the configured database. The test module overrides `ClerkAuthGuard` with `TestAuthGuard`, which reads `x-test-role` and `x-test-user` headers; without the headers the request is 401.
- Each test creates its own rows with unique codes and removes them in `afterEach`; tests assert the response shape, the role policy (403 for `instructor` on writes), validation errors (400 with `errors[]`), 404, and the 409 on a referenced delete.
- Unit tests for `RolesGuard`, the exception filter's message mapping, and the Postgres error mapping.

## Frontend

### Foundation

- shadcn/ui initialised into `src/components/ui/` (Tailwind 4; components: button, input, textarea, select, checkbox, switch, label, form, dialog, alert-dialog, table, tabs, badge, card, dropdown-menu, sonner, skeleton, tooltip, command, popover, calendar).
- Theme in `globals.css`: shadcn variables mapped to the handoff tokens (`--background: var(--bg)`, `--card: var(--surface)`, `--muted: var(--surface-2)`, `--border: var(--line)`, `--input: var(--line-strong)`, `--primary: var(--accent)`, `--primary-foreground: var(--accent-ink)`, `--destructive: var(--bad)`, `--ring: var(--accent)`, `--radius: 6px`); `ok`, `warn`, `bad`, `alt` and their `-soft` variants as Tailwind colours; fonts IBM Plex Sans / Mono via the existing `next/font` variables.
- The prototype's stylesheet is moved to `src/proto/proto.css` with every rule prefixed by `.proto`; the prototype page becomes `/prototyp` and wraps its root in `<div className="proto">`.
- `lib/api/server.ts`: `serverApiFetch<T>(path, options)` using `auth().getToken()` from `@clerk/nextjs/server`; `lib/api/client.ts` keeps the browser path and gains `errors?: ApiFieldError[]` on `ApiError`.
- `lib/api/<resource>.ts`: typed functions (`listInstructors(filters)`, `getInstructor(id)`, `createInstructor(dto)`, …) and the response types; usable from server and client.
- `lib/format.ts`: Swiss date formatting (`1.10.2026`, `Do 1.10.2026`), ISO week (`KW 40`), language and enum labels in German.

### Shell

- `app/(app)/layout.tsx`: 220px sidebar with groups **Planung** (Dashboard `/`, Planungslauf `/planung`, Zeitplan `/zeitplan`), **Stammdaten** (Kurse `/kurse`, Ausbilder `/ausbilder`, Lernende `/lernende`, Berufsschulen `/berufsschulen`, Standorte `/standorte`, Geräte `/geraete`, Kataloge `/kataloge`), **System** (Import `/import`, Einstellungen `/einstellungen`); instructors see **Mein Bereich** (Meine Einsätze, Profil & Zertifikate, Ferien). Items hidden by role from Clerk's `publicMetadata.role`. Header with page title and date "Do 1.10.2026 · KW 40". Bottom user card with Clerk's `UserButton`.
- Pages not yet built render a short placeholder card ("Kommt mit dem Zeitplan.").

### Screens

| Route | Content |
|---|---|
| `/standorte` | Search; table: Standort (name, address, ÜK badge), Räume (count), Kontakt, Aktiv. Dialog "Standort anlegen". |
| `/standorte/[id]` | Header (name, code, address, contact, edit dialog). Tabs **Räume** (table: Raum, Art, Plätze, Aktiv; dialog "Raum hinzufügen", edit, delete with confirm), **Geräte** (read-only: devices whose home is this location). |
| `/kataloge` | Tabs **Skills** (table + dialog), **Zertifikatstypen** (code, name, issuer, validity years, warning days, maintenance rule with course types), **Gerätetypen** (code, name, category, qualifying certificate types / skills). |
| `/ausbilder` | Filters Suche, Skill, Sprache, Standort, Anstellung, Status in the URL; table with initials avatar, name, employment, location, languages, skills. Dialog "Ausbilder anlegen" (name, email, phone, employment, home location, languages). |
| `/ausbilder/[id]` | Header with avatar, employment, location, languages. Tabs **Skills & Wissen** (skill chips with ×, "Skill hinzufügen" picker; contact card with edit dialog incl. max travel and preferred locations; implicit knowledge textarea with save), **Zertifikate** (table: Zertifikat, Aussteller, ausgestellt, gültig bis, status dot valid/expiring/expired by `warning_lead_days`; dialog "Zertifikat erfassen"; edit, delete), **Verfügbarkeit** (table of periods: von, bis, Art, Status; Genehmigen/Ablehnen for requested; dialog "Absenz erfassen"). |
| `/geraete` | Filters Typ, Standort, Mobilität, Status; table: Inventar, Typ, Standort (home), Mobilität, Status, Zeitraum (rental) / letzte Bewegung. Dialogs "Gerät hinzufügen" (type, inventory number, location, mobility; rental fields when mobility = Miete), "Bearbeiten", "Verschieben" (to location, effective date), "Wartung" (from, to, note). |
| `/kurse/typen` | Cards: code, name, kind, duration, track, skills, certificates, devices (type × quantity), participants, languages, published. Dialog (wide) with requirement pickers (multi-select for skills and certificate types, rows for device type + quantity). `/kurse` placeholder. |
| `/bildungsplan` | Track switch EFZ / EBA; table of modules: Semester, Reihenfolge, Kurstyp, Tage, Voraussetzungen; dialog with prerequisite picker. Section **Jahrgänge** (table + dialog). Section **Zeitfenster** per cohort (table: Modul, von, bis, Standort; inline edit dialog). |
| `/berufsschulen` | Table: Schule, Sprache, ÜK-Standort (select), Klassen, Lernende; dialog "Berufsschule anlegen". Row expand or detail dialog for classes: code, Lehrgang, Startjahr, Schultage per school year (weekday checkboxes + Abend). |
| `/lernende`, `/lernende/[id]` | Read-only list with filters Berufsschule, Lehrgang, Jahrgang and search; detail with Stammdaten fields, school, class, company, trainer, cohort. Note that the school export is the source of truth. |

Dialogs follow the prototype: max 440px (Kurstypen 640px), title, fields, Abbrechen / Speichern, validation errors under the field, API field errors mapped onto the fields, toast on success. Destructive actions use `AlertDialog` naming the consequence.

### Slices

1. Foundation: backend validation, error filter, roles, user upsert, audit service, `/me`; frontend shadcn + theme, shell, server fetch, form kit, prototype moved to `/prototyp`.
2. Standorte and Räume (sets the list / detail / dialog pattern).
3. Kataloge: Skills, Zertifikatstypen, Gerätetypen.
4. Ausbilder with skills, certificates, availabilities.
5. Geräte with moves and maintenance windows.
6. Kurstypen with requirements.
7. Bildungsplan: modules, prerequisites, cohorts, time windows.
8. Berufsschulen with classes and school days; Lernende read-only.

Each slice ships with its e2e tests, `next build` and lint clean, and a manual pass through the screen against the seeded data (create, edit, validation error, delete).

## Out of scope

Courses and assignments screens, the schedule, planning runs, the engine, the import, instructor self-service (own vacation requests), notifications, settings UI, and automated frontend tests (Playwright is the candidate once the shell is stable).

## Open points

- Clerk session-token claim: has to be configured in the Clerk dashboard once; until then the guard's API fallback handles roles.
- Whether `/kataloge` stays its own page or moves under `/einstellungen` later.
- Device location "today" in the Geräte table needs `deviceAt`; this slice shows the home location and the last move, the engine slice replaces it with the computed location.
