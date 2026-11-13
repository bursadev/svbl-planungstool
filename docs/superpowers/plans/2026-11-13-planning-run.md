# Planungslauf (Planning Run) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A planner opens a Planungslauf for a semester, lets the engine derive the demand, place courses with dates and rooms, pack the apprentices and propose instructors, resolves the conflicts the engine reports, and commits the whole run into the schedule in one transaction; the same engine staffs the existing OdAOrg courses that have no instructor today.

**Architecture:** Pure engine functions in `backend/src/planning/engine/` work on an in-memory `PlanningSnapshot` plus a `Ledger` of bookings (instructor-day, location-day, room-day, device-type-day, apprentice-day). A thin `PlanningRunsService` loads the snapshot, calls the engine per stage and persists the result as ordinary draft rows tagged with the run (`course.status = demand`, `assignment.status = proposed`, `enrollment.planning_run_id`), so the schedule, the ledger and the audit see one kind of course. The web app renders the four stages of the design (Bedarf · Kurse & Termine · Ausbilder · Übernahme) and the Kurs-Drawer with candidates on the Durchführungen list.

**Tech Stack:** NestJS 12 + TypeORM 1.1 on PostgreSQL (Neon), vitest (unit `*.spec.ts`, e2e `test/*.e2e-spec.ts` against the configured database), Next.js 16 App Router + Tailwind + shadcn/ui, react-hook-form + zod, date-fns.

**Spec:** `docs/superpowers/specs/2026-10-30-planning-engine-design.md` (planning steps, algorithms, function table, build order, decisions 1–4). Binding rule texts and the reference implementation: `docs/design-handoff/README.md` section «Engine» and `web/src/proto/svbl-planung.logic.ts` (`check`, `genDemand`, `proposeCourses`, `freeSlot`, `fixOptions`). UI reference: the prototype screen «Planungslauf» (`web/src/proto/svbl-planung.view.tsx` lines 801–1340, route `/prototyp` in the dev server, Claude Design «SVBL Planung»). Planning steps as presented to SVBL: deck of 2026-10-30, slides «Planungs-Engine» and «Nächste Schritte».

## Decisions taken in this plan

The spec left these open or the data since the Kunden removal (2026-11-12) forced them. They bind every task below.

1. **Four stages in the UI, seven steps in the engine.** The run page shows Bedarf → Kurse & Termine → Ausbilder → Übernahme as in the design. Readiness (step 0) is computed when the run is created and shown above the stages. Apprentice packing (step 3) happens inside «Kurse & Termine»: a proposed course carries its members, the table shows «Plätze 12/12». Validate and fix (step 5) are the «Lösung finden» buttons of stages 2 and 3 plus the balance on Übernahme. The `planning_run_stage` enum stays as it is; `stage` is the furthest stage with data, the UI tab is `?stufe=1..4`.
2. **Draft rows.** Proposed courses are `course` rows with `status = demand`, `planning_run_id`, their `course_day` rows (with `room_id`) and `capacity = seats`. Proposed instructors are `assignment` rows with `status = proposed`, `check_result` and `score`. Draft enrollments get the new nullable `enrollment.planning_run_id`. Demand groups are `demand` rows plus the new link table `demand_apprentice` and the new column `demand.blocked_weekdays smallint[]` (the members and the full school-day set; `school_weekday` keeps the first one for the pill in the UI). Readiness is stored on the run (`planning_run.readiness jsonb`).
3. **Commit** sets courses to `planned` (never `open`; «ohne Ausbilder» is derived from the assignments), demand to `planned`, leaves assignments `proposed` for the planner to confirm, keeps the enrollments as they are, writes one audit entry per course and marks the run `committed`. Discard deletes the draft courses first (their FK to the run is RESTRICT), then the run (demand cascades). Draft courses (status `demand`) stay out of `GET /courses` unless a status or run filter asks for them; draft enrollments of uncommitted runs count neither as coverage nor as bookings in the snapshot.
4. **Demand covers the period's semester only.** Catch-ups (modules of earlier semesters without a covering enrollment) are counted and shown as «Nachholer (nicht eingeplant)» but not turned into courses: the import holds no attendance before August 2026, so every older module would look open.
5. **Variant and elective modules are skipped** with a readiness warning: `üK 5.1.D`, `5.1.L`, `5.2.D` … `6.4.D`, `5.HAB`, `5.Kran`, `6.R3`, `6.R4` (regex in `isVariantModule`). No apprentice has a profession code, so the school → variant mapping of spec decision 2 cannot run yet.
6. **Time window fallback.** A module without a window for the cohort uses the run period as its window and the demand row says so (`timeWindowId = null`). The run is not blocked (there are 0 windows today); the readiness item lists the modules.
7. **Existing courses count** (spec decision 1): free seats of non-cancelled courses of the same course type, location and language whose first day lies in the window reduce the group; the ledger books their days, rooms and instructors.
8. **Balanced sizes** (spec question 6): `k = ceil(n / max)`, sizes differ by at most one; a group below `min_participants` still gets one course and an issue «unter Minimum».
9. **Apprentices without a class** have no blocked weekdays; the readiness item counts them (123 today).
10. **Holidays:** the Swiss national holidays (1.1., Good Friday, Easter Monday, Ascension, Whit Monday, 1.8., 25.12., 26.12.) are built into the calendar and never get a course day. School holidays are not excluded (spec question 7 open).
11. **Leftover apprentices** (classes larger than a course, no class, conflicts) are placed greedily by cost, not with a min-cost flow: no apprentice choice and school → location fixed make the leftover set small. The cost function stays the spec's (distance, class split, lateness) so a flow solver can replace the loop later.
12. **Deferred:** partial staffing per course day, device reservations (no devices in the database), travel time (no distances), weekly-hours balance. `deviceCheck` and `deviceLocationOn` are implemented and unit-tested so the slot search uses them as soon as devices exist.
13. **Weights** come from `DEFAULT_WEIGHTS` in code and are overridden by the setting `planning.weights` (same keys) when present.
14. **Re-running a stage** deletes that stage's drafts and everything after it (a new demand deletes draft courses, assignments and enrollments). Manual fixes are lost on a re-run; the UI confirms this.
15. **The Durchführungen list and the Kurs-Drawer are part of this plan** because staffing works on the 2 250 existing unstaffed ÜK courses. The Zeitplan week grid with drag-and-drop and the dashboard flows (Absenz, Nichterscheinen, Protokoll) are separate plans.
16. The drawer uses the shadcn `sheet` component (to add with `pnpm dlx shadcn@latest add sheet`).

## Global Constraints

- UI language German with Swiss spelling: «ss» never «ß», quotes «…», dates `d.M.yyyy`, weeks «KW 40», Monday first, ISO weeks (handoff README). Enum labels reuse `web/src/lib/labels.ts` and `backend/src/common/labels.ts`.
- Dates in the engine are ISO strings `YYYY-MM-DD`, never a week counter (handoff: «Kalenderwochen niemals als interne Laufnummer»).
- Deterministic tie-breaks: sort by score, then earliest date, then `id` ascending, so a re-run yields the same plan (spec §4).
- Every rejection and every proposal carries a German reason string (`reason`, `why`, `effects`) that the UI and later the assistant show verbatim.
- Engine files are pure (no Nest, no TypeORM); each rule has a unit test in the sibling `*.spec.ts` (vitest, `pnpm test` in `backend/`). Persistence is tested e2e in `backend/test/*.e2e-spec.ts` against the configured database with fixture rows prefixed `E2EP-` (cleanup in `beforeAll`/`afterAll`, files run in parallel).
- Backend writes require `@Roles(...WRITE_ROLES)`; every write records an audit entry through `AuditService.record` with a German `summary`.
- Backend lint `pnpm lint` (oxlint, type-aware) and `pnpm format`; web `pnpm lint` and `pnpm exec tsc --noEmit` must be clean before a commit. `pnpm` runs through the corepack shim (`exec corepack pnpm@10 "$@"`).
- Commits per task with a minimal message, no Claude mention; `git push deploy main` at the end of Part A and Part B (the live app runs on the same Neon database, so a migration is pushed together with the code that needs it).
- Keep `backend/src/scripts/import-odaorg.ts`, `tools/odaorg-crawler/` and `docs/odaorg/` out of the commits.

## Review Focus

1. A multi-day course in a week with a holiday or at the week's end: `dayPatterns` must not place a day on a Saturday, Sunday, holiday or blocked weekday, and a 4-day course must not start on a Thursday unless the type may span weeks (test in Task 1).
2. A certificate valid on the first course day and expired on the last: the hard check fails and the reason names the first uncovered day (test in Task 3).
3. An apprentice whose two modules land on the same date: the second course skips them or they become an issue, never two enrollments on one date (test in Task 14).
4. Re-running «Bedarf» after courses and enrollments exist: no draft course, assignment or enrollment of the run survives, and the demand ids change (e2e in Task 12).
5. Discarding a run with draft courses and committing a run twice: the discard deletes courses before the run (FK RESTRICT), the second commit is a 409 (e2e in Task 17).

## File Structure

Backend (`backend/src/planning/`):

- `engine/types.ts` — snapshot record types, `EngineWeights`, `DEFAULT_WEIGHTS`, shared result types.
- `engine/calendar.ts` — date helpers, semesters, holidays, `dayPatterns`.
- `engine/ledger.ts` — `Ledger` of bookings.
- `engine/check.ts` — `checkInstructor`, `staticallyEligible`, `rankCandidates`.
- `engine/maintenance.ts` — qualification-maintenance counts.
- `engine/devices.ts` — `deviceLocationOn`, `deviceCheck`.
- `engine/staffing.ts` — `staffCourses` (most-constrained-first + 2-swap).
- `engine/readiness.ts` — `checkReadiness`.
- `engine/demand.ts` — `openModules`, `generateDemand`, `mergeGroups`, `sizeCourses`.
- `engine/slots.ts` — `feasibleSlots`, `scoreSlot`.
- `engine/propose.ts` — `proposeCourses`, `packApprentices`.
- `engine/fixes.ts` — `validateRun`, `fixOptions`, `applyPatch`.
- `engine/fixture.ts` — `buildSnapshot()` for unit tests (one small world, see Task 1).
- `snapshot.service.ts` — loads a `PlanningSnapshot` from the database for a date range.
- `courses.service.ts`, `courses.controller.ts`, `dto/course.dto.ts` — Durchführungen list/detail, candidates, assignments, auto staffing.
- `planning-runs.service.ts`, `planning-runs.controller.ts`, `dto/planning-run.dto.ts` — run lifecycle and stages.
- `demand-apprentice.entity.ts` (new), changes to `demand.entity.ts`, `planning-run.entity.ts`, `../apprentices/enrollment.entity.ts`, `../database/migrations/<ts>-PlanningRunDrafts.ts`.
- `planning.module.ts` — registers everything above.

Web:

- `web/src/lib/api/courses.ts`, `web/src/lib/api/planning-runs.ts` — typed clients.
- `web/src/components/kurse/courses-table.tsx`, `courses-filters.tsx`, `course-drawer.tsx`, `check-list.tsx`, `candidate-list.tsx`, `auto-staff-dialog.tsx`, `course-status.ts`; `web/src/app/(app)/kurse/page.tsx` replaces the placeholder.
- `web/src/components/planung/overview-kpis.tsx`, `runs-table.tsx`, `new-run-dialog.tsx`, `readiness-list.tsx`, `stage-bar.tsx`, `demand-stage.tsx`, `courses-stage.tsx`, `staffing-stage.tsx`, `commit-stage.tsx`, `fix-dialog.tsx`, `labels.ts`; pages `web/src/app/(app)/planung/page.tsx` and `web/src/app/(app)/planung/[id]/page.tsx`.

---

# Part A — Engine core and staffing of existing courses

Ships on its own: planners see candidates with reasons on every course and can staff the unstaffed OdAOrg courses by hand or automatically.

### Task 1: Engine types, fixture and calendar helpers

**Files:**
- Create: `backend/src/planning/engine/types.ts`
- Create: `backend/src/planning/engine/fixture.ts`
- Create: `backend/src/planning/engine/calendar.ts`
- Test: `backend/src/planning/engine/calendar.spec.ts`

**Interfaces:**
- Produces (`types.ts`):

```ts
export type IsoDate = string; // 'YYYY-MM-DD'
export interface SnapshotLocation { id: string; code: string; name: string; languageRegion: Language; hostsUk: boolean; parallelCourseCapacity: number; active: boolean }
export interface SnapshotRoom { id: string; locationId: string; name: string; kind: RoomKind; capacity: number | null; active: boolean }
export interface SnapshotCourseType { id: string; code: string; name: string; kind: CourseKind; track: Track | null; durationDays: number; maySpanWeeks: boolean; weekdayRule: WeekdayRule; languages: Language[]; minParticipants: number | null; maxParticipants: number; requiredSkillIds: string[]; requiredCertificateTypeIds: string[]; requiredDevices: { deviceTypeId: string; quantity: number }[] }
export interface SnapshotModule { id: string; track: Track; courseTypeId: string; semester: number; sequence: number; active: boolean; prerequisiteModuleIds: string[] }
export interface SnapshotCohort { id: string; track: Track; startYear: number; label: string }
export interface SnapshotTimeWindow { id: string; curriculumModuleId: string; cohortId: string; locationId: string | null; startsOn: IsoDate; endsOn: IsoDate }
export interface SnapshotCertificateType { id: string; code: string; name: string; maintenanceMinPerYear: number | null; maintenanceCourseTypeIds: string[] }
export interface SnapshotInstructor { id: string; firstName: string; lastName: string; employmentType: EmploymentType; homeLocationId: string; languages: Language[]; status: InstructorStatus; preferredLocationIds: string[]; avoidInstructorIds: string[]; skillIds: string[]; certificates: { certificateTypeId: string; validUntil: IsoDate | null }[] }
export interface SnapshotAvailability { instructorId: string; startsOn: IsoDate; endsOn: IsoDate; kind: AvailabilityKind; status: AvailabilityStatus }
export interface SnapshotDeviceQualification { deviceTypeId: string; certificateTypeId: string | null; skillId: string | null }
export interface SnapshotDevice { id: string; deviceTypeId: string; homeLocationId: string; mobility: DeviceMobility; status: DeviceStatus; rentalFrom: IsoDate | null; rentalUntil: IsoDate | null; moves: { effectiveOn: IsoDate; toLocationId: string }[]; maintenance: { startsOn: IsoDate; endsOn: IsoDate }[] }
export interface SnapshotCourseDay { id: string; heldOn: IsoDate; roomId: string | null; locationId: string | null }
export interface SnapshotAssignment { id: string; instructorId: string; role: AssignmentRole; status: AssignmentStatus }
export interface SnapshotCourse { id: string; courseTypeId: string; locationId: string; language: Language; cohortId: string | null; status: CourseStatus; capacity: number; booked: number; planningRunId: string | null; days: SnapshotCourseDay[]; assignments: SnapshotAssignment[]; enrolledApprenticeIds: string[] }
export interface SnapshotSchool { id: string; name: string; nearestLocationId: string; language: Language }
export interface SnapshotClass { id: string; schoolId: string; code: string; blockedWeekdays: number[] } // ISO weekdays of the snapshot's school year
export interface SnapshotApprentice { id: string; firstName: string; lastName: string; cohortId: string; track: Track; language: Language; schoolId: string; schoolClassId: string | null; trainingCompanyId: string | null; status: ApprenticeStatus; coveredCourseTypeIds: string[] } // course types with an enrollment registered/confirmed/attended on a non-cancelled course
export interface EngineWeights { base: number; homeLocation: number; sameRegion: number; otherRegion: number; preferredLocation: number; cohortContinuity: number; employee: number; openVacationRequest: number; maintenanceOpen: number; avoidPairing: number }
export const DEFAULT_WEIGHTS: EngineWeights = { base: 50, homeLocation: 30, sameRegion: 12, otherRegion: -10, preferredLocation: 8, cohortContinuity: 10, employee: 5, openVacationRequest: -15, maintenanceOpen: 10, avoidPairing: -20 };
export interface PlanningSnapshot { asOf: IsoDate; schoolYearStart: number; locations: Map<string, SnapshotLocation>; rooms: Map<string, SnapshotRoom>; courseTypes: Map<string, SnapshotCourseType>; modules: Map<string, SnapshotModule>; cohorts: Map<string, SnapshotCohort>; timeWindows: SnapshotTimeWindow[]; certificateTypes: Map<string, SnapshotCertificateType>; instructors: Map<string, SnapshotInstructor>; availabilities: SnapshotAvailability[]; deviceQualifications: SnapshotDeviceQualification[]; devices: Map<string, SnapshotDevice>; courses: Map<string, SnapshotCourse>; schools: Map<string, SnapshotSchool>; classes: Map<string, SnapshotClass>; apprentices: Map<string, SnapshotApprentice>; weights: EngineWeights; holidays: Set<IsoDate> }
```

- Produces (`calendar.ts`):

```ts
export function addDays(date: IsoDate, days: number): IsoDate
export function isoWeekday(date: IsoDate): number            // Monday = 1 … Sunday = 7
export function isoWeek(date: IsoDate): { year: number; week: number }
export function mondayOf(date: IsoDate): IsoDate
export function datesBetween(from: IsoDate, to: IsoDate): IsoDate[]   // inclusive
export function mondaysBetween(from: IsoDate, to: IsoDate): IsoDate[]  // Monday of every ISO week touching [from, to]
export function schoolYearStart(date: IsoDate): number        // Aug–Dec → year, Jan–Jul → year − 1
export function cohortSemester(cohort: Pick<SnapshotCohort, 'startYear' | 'track'>, periodStartsOn: IsoDate): number | null // 2·(schoolYearStart − startYear) + (month < 8 ? 2 : 1); null outside 1–6 (EFZ) or 1–4 (EBA)
export function publicHolidays(year: number): IsoDate[]       // 01-01, Good Friday, Easter Monday, Ascension, Whit Monday, 08-01, 12-25, 12-26
export function dayPatterns(req: { weekMonday: IsoDate; durationDays: number; weekdayRule: WeekdayRule; maySpanWeeks: boolean; blockedWeekdays: ReadonlySet<number>; holidays: ReadonlySet<IsoDate>; notBefore?: IsoDate }): IsoDate[][]
```

`dayPatterns` returns every list of `durationDays` dates that starts in the given week, in ascending order of the first date: for `weekdays` the dates are consecutive Monday–Friday days; a holiday or a blocked weekday breaks the block (the handoff demands «zusammenhängend»), and only a weekend may be skipped, which needs `maySpanWeeks`; for `saturday` they are `durationDays` consecutive Saturdays starting with that week's Saturday. Dates before `notBefore` disqualify a pattern.

- Produces (`fixture.ts`): `buildSnapshot(overrides?: Partial<PlanningSnapshot>): PlanningSnapshot` with this world, `asOf = '2026-11-13'`, `schoolYearStart = 2026`:
  - Locations `RUP` (de, hostsUk, capacity 2), `MAR` (fr, hostsUk, capacity 1), `BER` (de, no ÜK). Rooms at RUP: `T1` theory cap 12, `T2` theory cap 24, `H1` practice_hall cap 20; at MAR: `MT1` theory cap 16.
  - Skills `stapler`; certificate type `SUVA` (maintenance 2 per year on `UK-2`); device type `forklift` qualified by `SUVA`.
  - Course types `UK-1` (uk, efz, 1 day, max 12, no requirements), `UK-2` (uk, efz, 4 days, max 20, skill `stapler`, cert `SUVA`, device forklift ×2), `UK-V` code `üK 5.1.D EFZ` (variant), `AD-1` (adult, 2 days, saturday rule). Modules: `UK-1` semester 4 sequence 401, `UK-2` semester 4 sequence 402 (prerequisite `UK-1`), `UK-V` semester 5. Cohort `2025 EFZ`; time window for (`UK-1`, cohort) `2027-02-01`–`2027-04-30`, none for `UK-2`.
  - School `S1` (de → RUP) with classes `K1` (blocked [1]) and `K2` (blocked [2, 4]); school `S2` (fr → MAR) with class `F1` (blocked [5]).
  - Apprentices: 20 in `K1`, 10 in `K2`, 2 of `S1` without class, 6 in `F1`; all cohort 2025 EFZ, active, `coveredCourseTypeIds = []` except apprentice `a01` who has `UK-1` covered.
  - Instructors: `I1` employee at RUP, de, skill `stapler`, SUVA until `2028-01-01`; `I2` freelancer at MAR, fr+de, no skills; `I3` employee at RUP, de, skill `stapler`, SUVA until `2027-03-03`; `I4` inactive at RUP with everything.
  - Availabilities: `I1` vacation approved `2027-03-15`–`2027-03-19`; `I3` vacation requested `2027-02-08`–`2027-02-12`.
  - Existing course `X1`: `UK-1` at RUP, de, `2027-02-02` in `T1`, capacity 12, booked 0, assignment `I1` confirmed; `X2`: `AD-1` at RUP, confirmed, days `2027-03-06` and `2027-03-13`, no assignment.
  - Devices: two forklifts at RUP (one in maintenance `2027-03-01`–`2027-03-05`), none elsewhere.

- [ ] **Step 1: Write the failing tests** in `calendar.spec.ts`:

```ts
describe('calendar', () => {
  it('isoWeekday and isoWeek follow ISO 8601', () => {
    expect(isoWeekday('2026-11-13')).toBe(5);
    expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
    expect(mondayOf('2026-11-13')).toBe('2026-11-09');
  });
  it('cohortSemester counts from the August of the start year', () => {
    expect(cohortSemester({ startYear: 2024, track: 'efz' }, '2026-08-01')).toBe(5);
    expect(cohortSemester({ startYear: 2025, track: 'efz' }, '2027-02-01')).toBe(4);
    expect(cohortSemester({ startYear: 2025, track: 'eba' }, '2027-08-01')).toBeNull(); // 5 > 4
    expect(cohortSemester({ startYear: 2027, track: 'efz' }, '2027-02-01')).toBeNull();
  });
  it('publicHolidays knows the moving feasts', () => {
    expect(publicHolidays(2027)).toEqual(expect.arrayContaining(['2027-03-26', '2027-03-29', '2027-05-06', '2027-05-17', '2027-08-01']));
  });
  it('dayPatterns keeps blocked weekdays, weekends and holidays free', () => {
    const base = { weekMonday: '2027-03-22', durationDays: 2, weekdayRule: 'weekdays', maySpanWeeks: false, holidays: new Set(['2027-03-26']) } as const;
    expect(dayPatterns({ ...base, blockedWeekdays: new Set([1]) })).toEqual([['2027-03-23', '2027-03-24'], ['2027-03-24', '2027-03-25']]);
    expect(dayPatterns({ ...base, durationDays: 4, blockedWeekdays: new Set() })).toEqual([['2027-03-22', '2027-03-23', '2027-03-24', '2027-03-25']]);
    expect(dayPatterns({ ...base, durationDays: 4, blockedWeekdays: new Set([3]) })).toEqual([]);
  });
  it('dayPatterns spans weeks only when the type allows it', () => {
    const req = { weekMonday: '2027-03-01', durationDays: 4, weekdayRule: 'weekdays', blockedWeekdays: new Set<number>(), holidays: new Set<string>() } as const;
    expect(dayPatterns({ ...req, maySpanWeeks: false }).map((p) => p[0])).toEqual(['2027-03-01', '2027-03-02']);
    expect(dayPatterns({ ...req, maySpanWeeks: true }).at(-1)).toEqual(['2027-03-05', '2027-03-08', '2027-03-09', '2027-03-10']);
  });
  it('dayPatterns uses consecutive Saturdays for the Saturday rule', () => {
    expect(dayPatterns({ weekMonday: '2027-03-01', durationDays: 2, weekdayRule: 'saturday', maySpanWeeks: true, blockedWeekdays: new Set(), holidays: new Set() })).toEqual([['2027-03-06', '2027-03-13']]);
  });
});
```

- [ ] **Step 2: Run** `cd backend && pnpm test src/planning/engine/calendar.spec.ts` → FAIL (module not found).
- [ ] **Step 3: Implement** `types.ts`, `calendar.ts` (Easter by the Anonymous Gregorian algorithm; all date arithmetic in UTC to avoid DST shifts) and `fixture.ts`.
- [ ] **Step 4: Run** the test → PASS. Run `pnpm lint`.
- [ ] **Step 5: Commit** `Add the planning engine calendar and fixture`.

### Task 2: Ledger

**Files:**
- Create: `backend/src/planning/engine/ledger.ts`
- Test: `backend/src/planning/engine/ledger.spec.ts`

**Interfaces:**
- Consumes: `PlanningSnapshot`, `SnapshotCourse` from Task 1.
- Produces:

```ts
export interface LedgerCourse { id: string; courseTypeId: string; locationId: string; dates: IsoDate[]; roomId: string | null; instructorIds: string[]; apprenticeIds: string[] }
export class Ledger {
  static fromSnapshot(snapshot: PlanningSnapshot, opts?: { exclude?: ReadonlySet<string> }): Ledger // books every course whose status is not cancelled/done, assignments proposed|confirmed, enrollments as given
  clone(): Ledger
  bookCourse(course: LedgerCourse): void
  releaseCourse(courseId: string): void
  bookInstructor(instructorId: string, dates: IsoDate[], courseId: string): void
  instructorBusyOn(instructorId: string, date: IsoDate): string | null       // the course id or null
  locationLoad(locationId: string, date: IsoDate): number                    // courses with a day there
  roomBusyOn(roomId: string, date: IsoDate): string | null
  deviceUse(locationId: string, deviceTypeId: string, date: IsoDate): number // quantity booked by course types' requiredDevices
  bookApprentices(apprenticeIds: string[], dates: IsoDate[], courseId: string): void
  apprenticeBusyOn(apprenticeId: string, date: IsoDate): string | null
}
```

- [ ] **Step 1: Write the failing tests**: `fromSnapshot` books `X1` (`instructorBusyOn('I1','2027-02-02') === 'X1'`, `locationLoad('RUP','2027-02-02') === 1`, `roomBusyOn('T1','2027-02-02') === 'X1'`), ignores a cancelled course added via overrides, `clone()` leaves the original untouched after a `bookCourse`, `releaseCourse` frees instructor, room, location and apprentices, `deviceUse` sums `requiredDevices.quantity` of a booked `UK-2` course (2).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** with `Map<string, Map<IsoDate, …>>` keyed by id then date. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Add the planning ledger`.

### Task 3: Instructor check, candidates and maintenance

**Files:**
- Create: `backend/src/planning/engine/check.ts`, `backend/src/planning/engine/maintenance.ts`, `backend/src/planning/engine/devices.ts`
- Test: `check.spec.ts`, `maintenance.spec.ts`, `devices.spec.ts` (same folder)

**Interfaces:**
- Consumes: `Ledger` (Task 2), `AssignmentCheckResult` from `backend/src/courses/assignment.entity.ts` (`{ ok, hard: {label, ok, reason}[], soft: {text, delta}[], score }`).
- Produces:

```ts
export interface EngineContext { snapshot: PlanningSnapshot; ledger: Ledger; today: IsoDate }
export interface CourseToStaff { id: string; courseTypeId: string; locationId: string; language: Language; cohortId: string | null; dates: IsoDate[]; coInstructorIds?: string[] }
export interface Candidate { instructor: SnapshotInstructor; result: AssignmentCheckResult }
export function staticallyEligible(courseType: SnapshotCourseType, language: Language, instructor: SnapshotInstructor, snapshot: PlanningSnapshot): boolean // active, speaks language, holds all skills, holds every required certificate type (any validity) incl. device qualifications
export function checkInstructor(course: CourseToStaff, instructor: SnapshotInstructor, ctx: EngineContext): AssignmentCheckResult
export function rankCandidates(course: CourseToStaff, ctx: EngineContext, opts?: { limit?: number; includeInfeasible?: boolean }): Candidate[] // feasible first by score desc, then lastName/firstName/id
export function maintenanceStatus(instructor: SnapshotInstructor, year: number, ctx: EngineContext): { certificateTypeId: string; name: string; min: number; taught: number; open: number; ok: boolean; courseTypeIds: string[] }[] // taught = lead assignments proposed|confirmed on courses of the rule's types with first day in `year`
export function deviceLocationOn(device: SnapshotDevice, date: IsoDate): string | null // null outside rental period or when retired; last move with effectiveOn <= date wins
export function deviceCheck(course: Pick<CourseToStaff, 'courseTypeId' | 'locationId' | 'dates'>, ctx: EngineContext): { deviceTypeId: string; needed: number; total: number; maintenance: number; reserved: number; free: number; ok: boolean }[]
```

Hard rules of `checkInstructor`, in this order and with these labels: `Status` («inaktiv»), `Skills` («fehlt: …» / list), one `Zertifikat` row per required certificate type and per device qualification («<Name> nicht vorhanden» · «<Name> abgelaufen am d.M.yyyy – Kurstag d.M. nicht gedeckt» · «<Name> läuft ab am … – Kurstag … nicht gedeckt» · ok «<Name> gültig bis …»), `Gerätequalifikation` (only when the type needs devices), `Sprache` («spricht Deutsch» / «spricht kein Französisch (de/it)»), `Verfügbarkeit` («bereits eingesetzt: <Kurscode> <Standort> KW n» from the ledger · «Ferien d.M.–d.M.yyyy (genehmigt)» for approved/blocked kinds other than `available` · ok «frei an allen Kurstagen» or «frei – offener Ferienantrag KW n»). Soft deltas use `snapshot.weights`: home location, same language region, other region, preferred location, cohort continuity (another assignment of this instructor on a course with the same `cohortId`), employee, open vacation request, maintenance open for this course type, avoid pairing (a `coInstructorId` is in `avoidInstructorIds` or vice versa). Score clamps to 0–100. A course with `dates = []` returns `ok: false` with one hard row `Termine` «Kurs hat keine Kurstage».

- [ ] **Step 1: Write the failing tests** (fixture from Task 1, course `UK-2` at RUP on `2027-03-01`…`03-04`):
  - `I1` passes all hard rules, score `50 + 30 + 5 + 10 = 95` (home location, employee, open maintenance of SUVA on `UK-2`), soft texts contain «Heimstandort Rupperswil (+30)» and «Festangestellt, keine Zusatzkosten (+5)»; with `cohortId` of 2025 EFZ also «Kontinuität» +10, clamped to 100.
  - `I3` fails `Zertifikat` with reason matching `/SUVA läuft ab am 3\.3\.2027 – Kurstag 4\.3\. nicht gedeckt/` (valid on day 1, not on day 4).
  - `I2` fails `Skills` («fehlt: stapler») and `Zertifikat` («SUVA nicht vorhanden»); a course in `fr` passes `Sprache`, in `it` fails with «spricht kein Italienisch (fr/de)».
  - `I1` on `2027-02-02` (busy on `X1`) fails `Verfügbarkeit` with «bereits eingesetzt: UK-1 Rupperswil KW 5»; on `2027-03-16` fails with the approved vacation; `I3` on `2027-02-09` passes with «offener Ferienantrag» and −15.
  - `I4` fails `Status`.
  - `rankCandidates` returns `[I1]` feasible first, `includeInfeasible` adds the rest ordered by score; `limit` cuts.
  - `maintenanceStatus(I1, 2027)` → `{ min: 2, taught: 0, open: 2 }`; after booking a `UK-2` course with `I1` in the snapshot → `taught: 1, open: 1`; `checkInstructor` then adds «Qualifikationspflege» +10.
  - `deviceLocationOn`: fixed device → home; a move on `2027-04-01` → new location from that date; rental outside its period → null.
  - `deviceCheck(UK-2 at RUP, 2027-03-01…04)` → `{ needed: 2, total: 2, maintenance: 1, reserved: 0, free: 1, ok: false }`; on `2027-03-08` ok.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the three files; `formatDate` helper for «d.M.yyyy» in `calendar.ts`. **Step 4: Run** → PASS, lint clean.
- [ ] **Step 5: Commit** `Add the instructor check, candidate ranking and device check`.

### Task 4: Snapshot loader

**Files:**
- Create: `backend/src/planning/snapshot.service.ts`
- Modify: `backend/src/planning/planning.module.ts` (import the entities it reads, `SystemModule`; provide and export `SnapshotService`)
- Test: `backend/test/snapshot.e2e-spec.ts`

**Interfaces:**
- Produces: `SnapshotService.load(range: { from: IsoDate; to: IsoDate }, opts?: { today?: IsoDate }): Promise<PlanningSnapshot>` — courses with at least one day in `[from − 14 days, to + 14 days]` (the margin covers certificate and continuity checks), all active locations/rooms/course types/modules/cohorts/time windows/certificate types/device qualifications/devices (with moves and maintenance windows), all instructors (inactive included, flagged by status), availabilities overlapping the range, apprentices with status `active` and their classes' blocked weekdays of `schoolYearStart(from)`, `coveredCourseTypeIds` from enrollments `registered|confirmed|attended` on non-cancelled courses (all dates), `holidays` = `publicHolidays` of every year the range touches, `weights` = `DEFAULT_WEIGHTS` merged with the setting `planning.weights`. Four to six bulk queries with `IN`, no per-row loads.

- [ ] **Step 1: Write the failing e2e test**: seed with prefix `E2EP-` a location, room, course type, module, cohort, school with nearest location, class with a Tuesday school day for 2026, two apprentices (one in the class), an instructor with a certificate, a course with two days and a confirmed assignment, one enrollment; `load({ from: '2027-02-01', to: '2027-07-31' })` returns them with the derived fields (`blockedWeekdays: [2]`, `coveredCourseTypeIds` of the enrolled apprentice, `booked: 1`); a `planning.weights` setting `{ homeLocation: 40 }` overrides only that key.
- [ ] **Step 2: Run** `pnpm test:e2e test/snapshot.e2e-spec.ts` → FAIL. **Step 3: Implement**. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Load the planning snapshot from the database`.

### Task 5: Durchführungen API

**Files:**
- Create: `backend/src/planning/courses.service.ts`, `backend/src/planning/courses.controller.ts`, `backend/src/planning/dto/course.dto.ts`
- Modify: `backend/src/planning/planning.module.ts`, `backend/README.md` (route table)
- Test: `backend/test/courses.e2e-spec.ts`

**Interfaces:**
- Produces:

```ts
export class ListCoursesQuery extends ListPageQuery { from?: IsoDate; to?: IsoDate; locationId?: string; courseTypeId?: string; kind?: CourseKind; status?: CourseStatus; staffing?: 'unstaffed' | 'staffed'; planningRunId?: string; q?: string } // sortable: startsOn (default asc), location, courseType, status
export interface CourseRow { id: string; courseType: { id; code; name; kind; durationDays }; location: { id; code; name }; language: Language; status: CourseStatus; capacity: number; booked: number; startsOn: IsoDate | null; endsOn: IsoDate | null; dayCount: number; isoWeek: number | null; instructors: { id; firstName; lastName; role: AssignmentRole; status: AssignmentStatus; assignmentId: string }[]; planningRunId: string | null; planningIssue: string | null; externalRef: string | null }
export interface CourseDetail extends CourseRow { cohort: { id; label } | null; timeWindow: { id; startsOn; endsOn } | null; days: { id; heldOn; startsAt; endsAt; sequence; room: { id; name; kind } | null }[]; assignments: { id; instructor: {id; firstName; lastName; employmentType; homeLocation: {id; code; name}}; role; status; score: number | null; checkResult: AssignmentCheckResult | null; confirmedAt: Date | null }[]; notes: string | null }
```

Routes: `GET /courses` (paged, `X-Total-Count` like the Stammdaten lists; `q` searches course type code/name, location name, external ref), `GET /courses/:id`. Without `from` the list starts today; `staffing=unstaffed` means no assignment with status proposed|confirmed.

- [ ] **Step 1: Write the failing e2e test**: seed two courses (one staffed), list filters `staffing`, `locationId`, `from/to`, paging header, detail with days and assignments, 404 for unknown id, instructor role may read.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** with a query builder over `course` joined to `course_day` aggregates (`min/max(held_on)`, `count`), `applySearch`, `pageOf`. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Add the Durchführungen endpoints`.

### Task 6: Candidates, check and manual assignment

**Files:**
- Modify: `backend/src/planning/courses.service.ts`, `courses.controller.ts`, `dto/course.dto.ts`
- Test: `backend/test/staffing.e2e-spec.ts`

**Interfaces:**
- Consumes: `SnapshotService.load`, `Ledger.fromSnapshot`, `rankCandidates`, `checkInstructor`.
- Produces routes:
  - `GET /courses/:id/candidates?limit=6&all=true` → `CandidateView[]` `{ instructor: {id, firstName, lastName, employmentType, homeLocation}, result: AssignmentCheckResult }`; the course's own assigned instructors are excluded; `all=true` includes infeasible ones.
  - `GET /courses/:id/check/:instructorId` → `AssignmentCheckResult`.
  - `POST /courses/:id/assignments` body `{ instructorId: string; role?: 'lead' | 'assistant'; force?: boolean }` → 201 with the assignment (status `proposed`, `checkResult`, `score`); 409 `{ message: 'Harte Regel verletzt: <first failing reason>', checkResult }` when `!ok` and not `force`; 409 when the instructor is already on the course. Audit «hat <Name> dem Kurs <Code> <Standort> KW n zugewiesen (Score s)».
  - `POST /assignments/:id/confirm` → status `confirmed`, `confirmedByUserId`, `confirmedAt`; audit.
  - `DELETE /assignments/:id` → 204, row deleted; audit «hat die Zuweisung von <Name> … aufgehoben».
  The snapshot for one course is loaded for the course's date range (`from = first day`, `to = last day`).

- [ ] **Step 1: Write the failing e2e test**: two instructors (one lacking the language), candidates lists the feasible one first with `ok: true`, check of the other returns the `Sprache` failure, assign the infeasible one → 409 with `checkResult`, with `force: true` → 201, assign the feasible one → 201 with score ≥ 50, confirm → `confirmed`, delete → 204 and candidates lists them again; instructor role → 403 on writes.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Add candidates, check and manual assignment for courses`.

### Task 7: Automatic staffing

**Files:**
- Create: `backend/src/planning/engine/staffing.ts`
- Test: `backend/src/planning/engine/staffing.spec.ts`, extend `backend/test/staffing.e2e-spec.ts`
- Modify: `courses.service.ts`, `courses.controller.ts`, `dto/course.dto.ts`

**Interfaces:**
- Produces:

```ts
export interface StaffingResult { staffed: { courseId: string; instructorId: string; result: AssignmentCheckResult; candidateCount: number }[]; unstaffed: { courseId: string; reason: string; candidateCount: number }[] }
export function staffCourses(courses: CourseToStaff[], ctx: EngineContext, opts?: { improve?: boolean }): StaffingResult
```

Algorithm: pre-filter per (courseTypeId, language) with `staticallyEligible`; order courses by feasible-candidate count ascending, then first date, then id; take the best candidate, book the dates in `ctx.ledger` (the ledger is mutated: callers pass a clone); when `improve` (default true) try for each unstaffed course a 2-swap: an instructor A assigned in this result to course Y moves to the unstaffed course if Y has another feasible candidate B; apply the first swap found (deterministic order). Reasons: «kein Ausbilder erfüllt die harten Regeln (n statisch geeignet, alle an den Kurstagen belegt oder ohne gültiges Zertifikat)» or «kein Ausbilder mit Skills, Sprache und Zertifikaten für <Code>».

Route `POST /courses/staff` body `{ from: IsoDate; to: IsoDate; locationId?: string; kind?: CourseKind; dryRun?: boolean }` → `{ dryRun, staffed: CourseRow-like[{courseId, code, location, isoWeek, instructor, score}], unstaffed: [{courseId, code, location, isoWeek, reason}] }`; without `dryRun` it inserts proposed assignments (and audit entries) for the unstaffed courses of the range (`staffing=unstaffed`, status planned|confirmed|open).

- [ ] **Step 1: Write the failing unit tests**: two `UK-2` courses in the same week with only `I1` feasible → one staffed, one unstaffed with `candidateCount: 1`; the swap test: course A feasible for I1 only, course B feasible for I1 and I3, greedy takes I1 for B first (fewest candidates ordering makes A first, so build the case where B has fewer feasible dates) — assert both staffed after `improve`; determinism: same input twice → deep-equal results.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. Add the e2e case: `dryRun` writes nothing, the real call creates `proposed` assignments.
- [ ] **Step 5: Commit** `Staff courses automatically`.

### Task 8: Web — Durchführungen list

**Files:**
- Create: `web/src/lib/api/courses.ts`, `web/src/components/kurse/courses-table.tsx`, `courses-filters.tsx`, `course-status.ts`
- Modify: `web/src/app/(app)/kurse/page.tsx` (replace the placeholder), `web/src/lib/api/index.ts`

**Interfaces:**
- Produces: `listCoursesPage(filters: CourseFilters, fetcher?)`, `getCourse(id, fetcher?)`, `listCandidates(id, opts?, fetcher?)`, `checkInstructor(id, instructorId, fetcher?)`, `assignInstructor(id, dto, fetcher?)`, `confirmAssignment(id)`, `removeAssignment(id)`, `autoStaff(dto)`; types mirror Task 5–7. `COURSE_STATUS_LABELS` («Bedarf», «geplant», «offen», «bestätigt», «laufend», «durchgeführt», «abgesagt») and `courseTone(row): StatusTone` (cancelled → muted, no instructor → warn, planned → accent, else ok) in `course-status.ts`.
- URL params in German like the other lists: `?von=&bis=&standort=&art=&status=&besetzung=offen|besetzt&q=&seite=…`; default `von` = today, `bis` = today + 8 weeks.

Columns as in the handoff («Kurse», tab Durchführungen): Code (mono) · Kurs · Standort · KW (mono) · Tage («Mo–Do 1.3.–4.3.2027» via a `formatDayRange(days)` helper) · Ausbilder (last names, «—» in warn tone when none) · TN («12/20» mono) · Status (`StatusDot`). Row click sets `?kurs=<id>` (the drawer of Task 9 reads it). Header actions: `CsvMenu` is not needed; a «Automatisch besetzen» button opens the dialog of Task 9.

- [ ] **Step 1:** Build the API client and the page with filters, table and `Pagination`; `pnpm exec tsc --noEmit` and `pnpm lint` clean.
- [ ] **Step 2:** Verify in the browser against the local backend: the default list shows the next eight weeks, `besetzung=offen` shows only unstaffed courses, sorting by KW works.
- [ ] **Step 3: Commit** `Add the Durchführungen list`.

### Task 9: Web — Kurs-Drawer with candidates and auto-staffing dialog

**Files:**
- Create: `web/src/components/ui/sheet.tsx` (via `pnpm dlx shadcn@latest add sheet`), `web/src/components/kurse/course-drawer.tsx`, `check-list.tsx`, `candidate-list.tsx`, `auto-staff-dialog.tsx`
- Modify: `web/src/app/(app)/kurse/page.tsx` (render the drawer for `?kurs=`)

**Interfaces:**
- Consumes: `getCourse`, `listCandidates`, `assignInstructor`, `confirmAssignment`, `removeAssignment`, `autoStaff` (Task 8).
- Drawer (right, 560px, handoff §5): header with code chip, status dot, name, «Standort · KW · Tage · Sprache · n/max». Sections: **Zugewiesene Ausbilder** (per assignment: `InitialsAvatar`, name, Anstellung, role badge, verdict «machbar»/«Konflikt», `CheckList` of the stored `checkResult.hard` rows with dot and reason, buttons «Bestätigen» (proposed only) and «Zuweisung aufheben» with `ConfirmDialog`); **Kandidaten** (`CandidateList`: up to 6 from `listCandidates`, score in mono, soft reasons joined with « · », infeasible ones collapsed under «n weitere, nicht machbar» with their violated rule, button «Zuweisen» → `assignInstructor`, on 409 a toast with the reason and a second button «Trotzdem zuweisen» that sends `force: true`); **Kurstage** (date, room). Footer: «Schliessen». Every write calls `router.refresh()` and toasts.
- `AutoStaffDialog`: fields Von/Bis (default the list's range), Standort (optional), «Nur prüfen» checkbox (dryRun); result list staffed/unstaffed with reasons; «Vorschläge speichern» runs the real call.

- [ ] **Step 1:** Implement; `tsc` and lint clean.
- [ ] **Step 2:** Verify in the browser: open a course without instructor, assign the first candidate, confirm it, remove it; run «Automatisch besetzen» as dry run for one week at Rupperswil and read the reasons.
- [ ] **Step 3: Commit** `Add the Kurs-Drawer with candidates and automatic staffing`, then `git push deploy main`.

---

# Part B — Planungslauf

### Task 10: Draft-row schema

**Files:**
- Create: `backend/src/planning/demand-apprentice.entity.ts`
- Modify: `backend/src/planning/demand.entity.ts` (`blockedWeekdays: number[]` as `smallint[]` default `'{}'`, `existingFreeSeats: number` smallint default 0, `OneToMany` members), `backend/src/planning/planning-run.entity.ts` (`readiness: ReadinessReport | null` jsonb), `backend/src/apprentices/enrollment.entity.ts` (`planningRunId: string | null` with `ManyToOne(PlanningRun, { onDelete: 'CASCADE' })` and `@Index`), `backend/src/database/entities.ts`, `backend/src/planning/planning.module.ts`
- Create: `backend/src/database/migrations/<timestamp>-PlanningRunDrafts.ts` (generated with `pnpm migration:generate src/database/migrations/PlanningRunDrafts`, then reviewed)
- Modify: `backend/README.md` (46 tables), `docs/superpowers/specs/2026-10-01-data-model-design.md` (demand_apprentice, new columns, dated note)

**Interfaces:**
- Produces: `DemandApprentice { demandId: string (PK); apprenticeId: string (PK) }` with cascade on demand delete and RESTRICT on apprentice; `ReadinessReport` type lives in `engine/readiness.ts` (Task 11) — declare it in `engine/types.ts` now: `{ checkedAt: string; items: ReadinessItem[] }`, `ReadinessItem { rule: ReadinessRule; status: 'ok' | 'warning' | 'skipped'; count: number; message: string; details?: string[] }`, `ReadinessRule = 'time_windows' | 'prerequisites' | 'school_days' | 'variants' | 'semesters' | 'requirements' | 'devices' | 'availability' | 'uk_locations' | 'holidays'`.

- [ ] **Step 1:** Change the entities, generate the migration, read it: it must add the table, the three columns, the FK `enrollment.planning_run_id` → `planning_run` ON DELETE CASCADE and the index; `down` reverses them.
- [ ] **Step 2:** `pnpm test:e2e test/schema.e2e-spec.ts` → PASS («migrations match the entities»). This also applies the migration to the configured database (`neondb`).
- [ ] **Step 3: Commit** `Add the draft rows of a planning run`.

### Task 11: Readiness and run lifecycle

**Files:**
- Create: `backend/src/planning/engine/readiness.ts`, `backend/src/planning/planning-runs.service.ts`, `backend/src/planning/planning-runs.controller.ts`, `backend/src/planning/dto/planning-run.dto.ts`
- Test: `backend/src/planning/engine/readiness.spec.ts`, `backend/test/planning-runs.e2e-spec.ts`

**Interfaces:**
- Produces (engine): `checkReadiness(snapshot: PlanningSnapshot, period: { startsOn: IsoDate; endsOn: IsoDate }): ReadinessReport` with these items and messages:
  - `time_windows`: modules of the period's semesters (per cohort with active apprentices) without a window → warning «n Module ohne Zeitfenster – der Lauf verwendet die Periode als Fenster», details «üK 2.0 EFZ · 2025 EFZ».
  - `prerequisites`: 0 links → skipped «Keine Modul-Voraussetzungen erfasst – Reihenfolge wird nicht geprüft».
  - `school_days`: active apprentices of the period's cohorts without class → warning «n Lernende ohne Klasse – ÜK-Tage können auf Schultage fallen».
  - `variants`: `isVariantModule(code)` among the period's modules → warning «n Varianten- und Wahlmodule werden nicht geplant (Zuordnung Schule → Variante fehlt)».
  - `semesters`: modules whose semester exceeds the track's length (EBA > 4) → warning.
  - `requirements`: course types of the period's modules without skills and certificates → skipped «Skills und Zertifikate: n von m Kurstypen ohne Anforderungen – Regel prüft nur Sprache und Verfügbarkeit».
  - `devices`: no device rows → skipped «Keine Geräte erfasst – Gerätebestand wird nicht geprüft»; else ok.
  - `availability`: no availabilities in the period → skipped «Keine Abwesenheiten erfasst».
  - `uk_locations`: schools (with active apprentices) whose nearest location has `hostsUk = false` → warning with details.
  - `holidays`: always ok «Nationale Feiertage werden ausgespart; Schulferien nicht».
  `isVariantModule(code: string): boolean` matches `/\.(D|L)\b|5\.HAB|5\.Kran|6\.R[34]/`.
- Produces (service/controller):

```ts
export class CreatePlanningRunDto { label?: string; periodStartsOn: IsoDate; periodEndsOn: IsoDate } // 400 when endsOn < startsOn or the period is longer than 12 months; 409 when a draft or committed run with the same period exists
export interface PlanningRunView { id; label; periodStartsOn; periodEndsOn; stage: PlanningRunStage; status: PlanningRunStatus; readiness: ReadinessReport | null; createdAt; committedAt; createdBy: string | null; counts: { demandGroups: number; apprentices: number; coursesNeeded: number; coursesProposed: number; coursesUnplannable: number; coursesStaffed: number; unassignedApprentices: number; catchUps: number } }
```
Routes: `GET /planning-runs` (newest first), `POST /planning-runs` (planner; computes readiness from a snapshot of the period; default label «Herbstsemester 2026» when the period starts in Aug–Jan of a school year, «Frühlingssemester 2027» otherwise), `GET /planning-runs/:id`, `DELETE /planning-runs/:id` (discard: 409 when committed; deletes draft courses of the run first, then the run; sets nothing else), `GET /planning/overview` → `{ apprenticesWithoutFutureUk: number; unstaffedCourses: number (first day within the next 56 days, status planned|confirmed|open, kind uk); modulesWithoutTimeWindow: number (current school year's semesters); activeApprentices: number }`.

- [ ] **Step 1: Unit tests** on the fixture: `time_windows` names `UK-2 · 2025 EFZ` for period `2027-02-01`–`2027-07-31`; `variants` counts 1; `school_days` counts 2; `requirements` says 1 of 2; `devices` ok (fixture has devices), and after `devices = new Map()` → skipped.
- [ ] **Step 2: e2e**: create a run → 201 with `readiness.items.length === 10` and `stage: 'demand'`; duplicate period → 409; list contains it; overview returns numbers; discard → 204 and 404 afterwards; instructor role → 403 on create.
- [ ] **Step 3:** Run both → FAIL, implement, run → PASS, lint.
- [ ] **Step 4: Commit** `Add planning runs with a readiness check`.

### Task 12: Demand

**Files:**
- Create: `backend/src/planning/engine/demand.ts`
- Test: `backend/src/planning/engine/demand.spec.ts`, extend `backend/test/planning-runs.e2e-spec.ts`
- Modify: `planning-runs.service.ts`, `planning-runs.controller.ts`, `dto/planning-run.dto.ts`

**Interfaces:**
- Produces (engine):

```ts
export interface DemandGroup { key: string; cohortId: string; moduleId: string; courseTypeId: string; timeWindowId: string | null; window: { startsOn: IsoDate; endsOn: IsoDate }; locationId: string; language: Language; blockedWeekdays: number[]; memberIds: string[]; classIds: string[]; existingFreeSeats: number; participantCount: number; coursesNeeded: number; sizes: number[]; notes: string[] }
export interface DemandResult { groups: DemandGroup[]; catchUps: number; skippedVariantModules: string[]; apprenticesWithoutClass: number }
export function openModules(apprentice: SnapshotApprentice, semester: number, snapshot: PlanningSnapshot): { current: SnapshotModule[]; catchUp: SnapshotModule[] } // current = active modules of the track with that semester not covered; catchUp = earlier semesters not covered; variant modules excluded from both
export function generateDemand(snapshot: PlanningSnapshot, period: { startsOn: IsoDate; endsOn: IsoDate }): DemandResult
export function mergeGroups(groups: DemandGroup[], snapshot: PlanningSnapshot): DemandGroup[] // same (module, cohort, location, language), smallest first, merge when dayPatterns(durationDays, union of blocked) is non-empty for a plain week
export function sizeCourses(participants: number, max: number, min: number | null): number[] // [] for 0; balanced; participants < min → one course
```
`generateDemand`: per cohort with `cohortSemester` ≠ null and active members → per apprentice `openModules` → group by (moduleId, cohortId, school.nearestLocationId, apprentice.language, sorted blocked weekdays of the class or `[]`); window = time window of (module, cohort) with `locationId` null or equal to the group's location, else the period; `existingFreeSeats` = Σ `capacity − booked` of snapshot courses with the group's course type, location, language, status not cancelled, first day inside the window; `participantCount = members − existingFreeSeats` floored at 0 — members are still all kept in `memberIds` (the packing of Task 14 fills existing courses first); `coursesNeeded = sizes.length`; sorted by cohort label, module sequence, location code, blocked weekdays. Notes: «Zeitfenster: Periode (kein Fenster erfasst)», «n freie Plätze in bestehenden Kursen angerechnet».
- Produces (persistence): `POST /planning-runs/:id/demand` (planner; 409 when committed) deletes the run's draft courses and demand rows, writes `demand` + `demand_apprentice` rows (`source: school_import`, `status: open`, `schoolWeekday = blockedWeekdays[0] ?? null`, `participantCount`, `coursesNeeded`, `existingFreeSeats`, `note` = notes joined with « · », `timeWindowId`), sets `stage = demand`, returns `DemandView[]`; `GET /planning-runs/:id/demand` returns them.

```ts
export interface DemandView { id: string; cohort: { id; label }; module: { id; code; name; semester; durationDays }; location: { id; code; name }; language: Language; blockedWeekdays: number[]; window: { startsOn; endsOn; fromTimeWindow: boolean }; participantCount: number; memberCount: number; existingFreeSeats: number; coursesNeeded: number; note: string | null }
```

- [ ] **Step 1: Unit tests** (fixture, period FS 2027): `generateDemand` yields for `UK-1` three groups at RUP (K1 blocked [1] with 19 members since `a01` is covered, K2 [2,4] with 10, no-class [] with 2) and one at MAR; the RUP `UK-1` groups have `existingFreeSeats` 12 (course `X1`) applied to the first group by sort order; `mergeGroups` merges K2 and the no-class group (1-day course fits) but keeps K1 and K2 apart when `durationDays` is 4 (union [1,2,4] leaves no 4-day block); `UK-V` is in `skippedVariantModules`; `sizeCourses(25, 12, null)` → `[9, 8, 8]`, `sizeCourses(3, 12, 6)` → `[3]`, `sizeCourses(0, 12, null)` → `[]`; `catchUps` is 0 on the plain fixture; an override that adds module `UK-0` (semester 1, covered by nobody) makes `catchUps` equal the number of active cohort members.
- [ ] **Step 2: e2e**: seed cohort/module/school/class/apprentices (prefix `E2EP-`), create run, `POST …/demand` → rows with members, `GET` returns the same, a second `POST` replaces the ids, review-focus 4: after Task 14 extend this test so the draft courses vanish on a demand re-run.
- [ ] **Step 3:** FAIL → implement → PASS → lint.
- [ ] **Step 4: Commit** `Generate the demand of a planning run`.

### Task 13: Feasible slots

**Files:**
- Create: `backend/src/planning/engine/slots.ts`
- Test: `backend/src/planning/engine/slots.spec.ts`

**Interfaces:**
- Produces:

```ts
export interface SlotRequest { courseId: string; courseTypeId: string; locationId: string; language: Language; seats: number; blockedWeekdays: ReadonlySet<number>; window: { startsOn: IsoDate; endsOn: IsoDate }; notBefore: IsoDate; groupKey: string; cohortId: string | null }
export interface Slot { dates: IsoDate[]; roomId: string | null; score: number; reasons: string[] }
export interface SlotSearch { slots: Slot[]; rejected: { weekMonday: IsoDate; reason: string }[] }
export function feasibleSlots(req: SlotRequest, ctx: EngineContext, opts?: { ignoreDevices?: boolean; weeks?: IsoDate[]; groupWeeks?: ReadonlySet<IsoDate> }): SlotSearch // all slots in the window (or `weeks`), best first
export function scoreSlot(slot: Pick<Slot, 'dates' | 'roomId'>, req: SlotRequest, ctx: EngineContext): { score: number; reasons: string[] }
```
Hard per candidate pattern and room: location load on every date `< parallelCourseCapacity`; room active, of the needed kind (practice hall when the type needs devices, theory otherwise), capacity null or ≥ seats, free on every date; device stock per required type on every date (`deviceCheck`) unless `ignoreDevices`; dates ≥ `notBefore` and inside the window. Score (start 100): −10 per course already at the location in that week (spread), −30 when `rankCandidates` finds no feasible instructor for the dates (reason «kein freier Ausbilder in dieser Woche»), −20 when the week's Monday is in `opts.groupWeeks` (the Mondays already used by the same demand group, passed by the caller), +5 for the first-fitting room with the smallest sufficient capacity. Rejected weeks carry «Standortkapazität erreicht», «kein freier <Raumart>», «Geräte fehlen: n × <Typ>», «Schultag <Mo> lässt keinen Block von n Tagen zu».

- [ ] **Step 1: Unit tests**: `UK-1` for the K1 group (blocked Monday) in window Feb–Apr 2027: `X1` already occupies `T1` on `2027-02-02`, the location load is 1 < 2 and `T2` is free, so `2027-02-02` is feasible but carries the spread penalty; assert the best slot is `['2027-02-03']` in `T1` and that `rejected` is empty. `UK-2` (4 days, devices): week of `2027-03-01` rejected with «Geräte fehlen» (one forklift in maintenance), week of `2027-03-08` feasible in `H1`. A K2 group (blocked [2, 4]) and `UK-2` → `slots: []`, every week rejected with the Schultag reason. `ignoreDevices` makes `2027-03-01` feasible.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3: Commit** `Search feasible course slots`.

### Task 14: Course proposal and apprentice packing

**Files:**
- Create: `backend/src/planning/engine/propose.ts`
- Test: `backend/src/planning/engine/propose.spec.ts`, extend `backend/test/planning-runs.e2e-spec.ts`
- Modify: `planning-runs.service.ts`, `planning-runs.controller.ts`, `dto/planning-run.dto.ts`

**Interfaces:**
- Produces (engine):

```ts
export interface ProposedCourse { key: string; demandKey: string; courseTypeId: string; locationId: string; language: Language; cohortId: string; timeWindowId: string | null; seats: number; dates: IsoDate[]; roomId: string | null; memberIds: string[]; issue: string | null; reasons: string[] }
export interface ProposalResult { courses: ProposedCourse[]; unassigned: { apprenticeId: string; demandKey: string; reason: string }[] }
export function proposeCourses(groups: DemandGroup[], ctx: EngineContext, opts: { notBefore: IsoDate }): ProposalResult
export function packApprentices(group: DemandGroup, courses: ProposedCourse[], existing: SnapshotCourse[], ctx: EngineContext): { placements: { courseKey: string | null; existingCourseId: string | null; apprenticeId: string }[]; unassigned: { apprenticeId: string; reason: string }[] }
```
`proposeCourses`: difficulty order (types with devices first, longer duration, narrower window, fewer blocked-free patterns, prerequisites first) then group key; per group `sizes.length` courses, each via `feasibleSlots` (ledger clone booked as it goes, `groupWeeks` of the group's placed courses, `notBefore`); no slot → `issue` = the most frequent rejection reason, `dates = []`; one repair pass: for each unplannable course try to move one placed course of the same location with lower difficulty to its next-best slot and retry. Then `packApprentices` per group: first the free seats of existing courses in the window (earliest first) get whole classes that fit, then the proposed courses by first-fit decreasing class size; members without class and split remainders go to the course with free seats and the lowest cost (`0` same class already there, `+1` class split, `+weeks since window start / 10` lateness); an apprentice busy on any date (`ledger.apprenticeBusyOn`) tries the next course, else `unassigned` with «an diesen Tagen bereits in <Code>»; overflow → «kein Platz mehr in den Kursen der Gruppe». Placements book the apprentice-days in the ledger.
- Produces (persistence): `POST /planning-runs/:id/courses` (planner; 409 without demand or when committed) deletes the run's draft courses, loads the snapshot for the period, rebuilds `DemandGroup`s from the demand rows and members, runs `proposeCourses`, writes `course` (`status demand`, `planningRunId`, `demandId`, `capacity = seats`, `planningIssue = issue`), `course_day` rows (`08:15`–`16:45`, sequence 1…, `roomId`), draft `enrollment` rows (`registered`, `planner`, `planningRunId`) for placements on proposed courses and on existing courses alike, sets `stage = courses`; `GET /planning-runs/:id/courses` returns `RunCourseView[]`.

```ts
export interface RunCourseView { id: string; demandId: string; courseType: { id; code; name; durationDays }; cohort: { id; label }; location: { id; code; name }; language: Language; isoWeek: number | null; dates: IsoDate[]; room: { id; name } | null; seats: number; booked: number; blockedWeekdays: number[]; planningIssue: string | null; reasons: string[]; proposedInstructor: { assignmentId; id; firstName; lastName; score; why: string; candidateCount: number } | null; staffingIssue: string | null }
```
`proposedInstructor` and `staffingIssue` are filled by Task 15. `reasons` (the slot's reason list) is stored in `course.notes` as one line joined with « · », so the view can show it after a reload.

- [ ] **Step 1: Unit tests**: groups from `generateDemand` + `mergeGroups` on the fixture (FS 2027). The K1 `UK-1` group has 19 members and 12 free seats on `X1`: a whole class of 19 does not fit into 12 seats, so `X1` stays empty and the 19 go to the proposed courses with sizes `[10, 9]`; the merged K2 + no-class group (12 members) fits `X1` whole, so it gets no proposed course. Review focus 3: add an override where one apprentice belongs to two groups whose only feasible slots collide and assert one `unassigned` entry with the «bereits in» reason. `UK-2` for K2 → `issue` set with the Schultag reason and `dates: []`. Determinism: two runs → deep-equal.
- [ ] **Step 2: e2e**: after demand, `POST …/courses` → draft courses with days and rooms, enrollments carry `planningRunId`, `GET` returns them with `isoWeek`; a demand re-run deletes them (review focus 4).
- [ ] **Step 3:** FAIL → implement → PASS → lint.
- [ ] **Step 4: Commit** `Propose courses and pack the apprentices`.

### Task 15: Staffing stage

**Files:**
- Modify: `planning-runs.service.ts`, `planning-runs.controller.ts`
- Test: extend `backend/test/planning-runs.e2e-spec.ts`

**Interfaces:**
- Consumes: `staffCourses` (Task 7).
- Produces: `POST /planning-runs/:id/staffing` (planner; 409 without courses or when committed) deletes proposed assignments of the run's draft courses, builds `CourseToStaff[]` from the draft courses with dates, runs `staffCourses` on a ledger that contains the existing courses and the drafts, inserts `assignment` rows (`proposed`, `lead`, `checkResult`, `score`), sets `stage = staffing`, returns `RunCourseView[]` with `proposedInstructor` («why» = the first two positive soft texts without the «(+n)» suffix joined with « · », `candidateCount`) and `staffingIssue` for the rest.

- [ ] **Step 1: e2e**: with one feasible instructor seeded, `POST …/staffing` sets `proposedInstructor` on the feasible course and `staffingIssue` «kein Ausbilder erfüllt die harten Regeln …» on a course in a language nobody speaks; a second call replaces the assignment ids.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3: Commit** `Staff the courses of a planning run`.

### Task 16: Issues and fix options

**Files:**
- Create: `backend/src/planning/engine/fixes.ts`
- Test: `backend/src/planning/engine/fixes.spec.ts`, extend `backend/test/planning-runs.e2e-spec.ts`
- Modify: `planning-runs.service.ts`, `planning-runs.controller.ts`, `dto/planning-run.dto.ts`

**Interfaces:**
- Produces (engine):

```ts
export type IssueKind = 'unplannable' | 'unstaffed' | 'below_minimum' | 'unassigned_apprentice'
export interface RunIssue { id: string; kind: IssueKind; courseKey: string | null; subject: string; problem: string } // subject «üK 2.0 EFZ · Rupperswil · KW 10 · 2025 EFZ»
export type FixPatch = { kind: 'move'; locationId: string; dates: IsoDate[]; roomId: string | null; language?: Language; instructorId?: string } | { kind: 'split'; parts: { dates: IsoDate[]; roomId: string | null }[] } | { kind: 'assign'; instructorId: string } // a language switch is a `move` with `language` and the instructor the check found
export interface FixOption { index: number; title: string; why: string; effects: string[]; patch: FixPatch | null } // patch null = hint only
export interface RunDrafts { courses: ProposedCourse[]; groups: DemandGroup[]; staffing: Map<string, Candidate | null> }
export function validateRun(drafts: RunDrafts, ctx: EngineContext): RunIssue[]
export function fixOptions(issue: RunIssue, drafts: RunDrafts, ctx: EngineContext, period: { startsOn; endsOn }): FixOption[] // max 6, in the handoff order
```
Options for `unplannable`: «Standort wechseln: <Name>» for every other ÜK location with a feasible slot in the window; «Zeitfenster um n Wochen überschreiten» (slots in the 8 weeks after the window); «Kurs teilen: a + b Tage über zwei Wochen» when `durationDays > 2` and both parts find slots; «Mietgerät für <Standort> beschaffen» when `ignoreDevices` finds a slot and the type needs devices (hint only, patch null, until devices exist). For `unstaffed`: «Kurssprache auf <Sprache> wechseln» when `rankCandidates` in another language of the course type finds someone; «Standort wechseln: <Name>» with a slot and a feasible candidate there; «Woche verschieben: KW n» for the first other week with a slot and a candidate; «Zertifikat auffrischen: <Name>» (hint) for instructors failing only on an expired certificate. For `below_minimum` and `unassigned_apprentice`: hints («Mit Gruppe in <Standort> zusammenlegen», «Zusätzliche Durchführung anlegen»). Always a last option «Kein automatischer Ausweg» with the three hints of the prototype when nothing applies. Texts are those of the prototype's `fixOptions`.
- Produces (persistence): `GET /planning-runs/:id/issues` → `RunIssue[]` (courseKey = course id), `GET /planning-runs/:id/courses/:courseId/fix-options` → `FixOption[]`, `POST /planning-runs/:id/courses/:courseId/fix` body `{ option: number }` applies the patch inside a transaction: `move` rewrites the course's location/days/rooms (and language) and re-packs nothing (members stay), then re-staffs that course; `split` keeps one course and gives it the days of both parts (course days may be non-consecutive; the room is per day), then re-staffs it; `language`/`assign` write the proposed assignment; every applied fix re-validates the course and returns the updated `RunCourseView`. Audit «hat im Planungslauf <Label> Vorschlag «<title>» übernommen».

- [ ] **Step 1: Unit tests**: the K2 `UK-2` course (unplannable by Schultag) → options contain «Kurs teilen: 2 + 2 Tage …» with two `parts`; a course at MAR in `it` with nobody speaking Italian → «Kurssprache auf Deutsch wechseln» with `I2`; a course whose only statically eligible instructor is `I3` with an expired certificate → «Zertifikat auffrischen: … I3»; `validateRun` reports `below_minimum` for a 3-member group when `minParticipants = 6`.
- [ ] **Step 2: e2e**: issues list the unplannable and unstaffed courses, fix-options of the unplannable one offers a location change, applying it writes new days at the other location and the course disappears from the issues.
- [ ] **Step 3:** FAIL → implement → PASS → lint.
- [ ] **Step 4: Commit** `Validate a planning run and apply fix options`.

### Task 17: Commit and discard

**Files:**
- Modify: `planning-runs.service.ts`, `planning-runs.controller.ts`
- Test: extend `backend/test/planning-runs.e2e-spec.ts`

**Interfaces:**
- Produces: `GET /planning-runs/:id/summary` → `{ toCreate: number; withInstructor: number; withoutInstructor: number; unplannable: number; apprenticesPlaced: number; unassigned: number }`; `POST /planning-runs/:id/commit` (planner) in one transaction: plannable draft courses (`dates.length > 0`) → `status planned`; unplannable ones are deleted together with their enrollments (they appear in the response as `dropped`); demand rows → `planned`; `planning_run.status = committed`, `stage = committed`, `committedAt = now()`; one audit entry per course «hat Kurs <Code> <Standort> KW n aus Planungslauf «<Label>» angelegt» and one for the run; returns `{ created: number; withInstructor: number; dropped: number }`; 409 when already committed or when no courses exist. `DELETE` of a committed run → 409 (Task 11 already).

- [ ] **Step 1: e2e** (review focus 5): commit → courses `planned` with assignments `proposed`, enrollments without change, run `committed`; second commit → 409; discard of a fresh run with draft courses → 204 and no course/enrollment/demand left.
- [ ] **Step 2:** FAIL → implement → PASS → lint. Update `backend/README.md` route table with all planning routes.
- [ ] **Step 3: Commit** `Commit and discard planning runs`.

### Task 18: Web — overview page and new-run dialog

**Files:**
- Create: `web/src/lib/api/planning-runs.ts`, `web/src/components/planung/labels.ts`, `overview-kpis.tsx`, `runs-table.tsx`, `new-run-dialog.tsx`
- Modify: `web/src/app/(app)/planung/page.tsx`, `web/src/lib/api/index.ts`

**Interfaces:**
- Produces: client functions `getPlanningOverview`, `listPlanningRuns`, `createPlanningRun`, `getPlanningRun`, `discardPlanningRun`, `generateDemand`, `listDemand`, `proposeCourses`, `listRunCourses`, `staffRun`, `listIssues`, `listFixOptions`, `applyFix`, `getSummary`, `commitRun` with the view types of Tasks 11–17. `labels.ts`: `STAGE_LABELS` (`demand` «Bedarf», `courses` «Kurse & Termine», `staffing` «Ausbilder», `committed` «Übernahme»), `RUN_STATUS_LABELS` («neu» for draft without demand, «in Arbeit», «übernommen», «verworfen»), `WEEKDAY_SHORT` (Mo…So), `READINESS_LABELS` per rule.
- Page `/planung` (design §3 «Übersicht»): three KPI cards from the overview («Lernende ohne eingeteiltes ÜK» with «von n im System», «Kurse ohne Ausbilder» with «nächste 8 Wochen» and link «Zu den Kursen» → `/kurse?besetzung=offen`, «Module ohne Zeitfenster» with link → `/kurse/bildungsplan`); intro sentence of the prototype and the button «Neuen Planungslauf starten»; table Periode (label + «Aug 2026 – Jan 2027 · erstellt d.M.yyyy») · Schuljahr · Fortschritt (four dots, `StatusTone` accent for reached stages, ok when committed) · Status · actions «Fortsetzen»/«Ansehen» (link to `/planung/[id]`) and «×» (discard with `ConfirmDialog` «… verwerfen? Bereits übernommene Kurse bleiben im Zeitplan.»; disabled when committed). Empty state «Noch kein Planungslauf angelegt.»
- `NewRunDialog` (`FormDialog`): select Schuljahr (current and next two), select Periode (Herbstsemester = 1.8.–31.1., Frühlingssemester = 1.2.–31.7.), hint box «Der Bedarf wird im ersten Schritt aus den Jahrgängen und dem Bildungsplan erzeugt. Zeitfenster: …» in warn tone when a run for that period exists (409 → field error). On success navigate to the new run.

- [ ] **Step 1:** Implement; `tsc` and lint clean.
- [ ] **Step 2:** Verify in the browser: create «Frühlingssemester 2027», see it in the table, discard it.
- [ ] **Step 3: Commit** `Add the Planungslauf overview`.

### Task 19: Web — run page with stage bar and Bedarf

**Files:**
- Create: `web/src/app/(app)/planung/[id]/page.tsx`, `web/src/components/planung/stage-bar.tsx`, `readiness-list.tsx`, `demand-stage.tsx`
- Modify: `web/src/components/planung/labels.ts` as needed

**Interfaces:**
- Page: server component loading the run, demand, courses (when stage ≥ courses), issues and summary in parallel; `?stufe=1..4` picks the panel (default = run stage, 4 when committed). Header row: link «← Alle Planungsläufe», label, «Feb 2027 – Jul 2027 · erstellt d.M.yyyy». `StageBar`: four buttons (number circle, title, meta «57 Kurse nötig» / «noch nicht erzeugt» / «n vorgeschlagen» / «n zugeteilt» / «übernommen»), active one in accent-soft, done ones with ok dot; a stage without data is disabled. `ReadinessList`: collapsible card «Bereitschaft» with one row per item (dot ok/warn/muted, message, «Details» popover listing `details`).
- `DemandStage`: intro sentence, button «Bedarf für <Label> erzeugen» (confirm when courses exist: «Bestehende Vorschläge dieses Laufs werden verworfen.»), KPIs Lernende · Module · Kurse nötig · Kurstage · Nachholer (nicht eingeplant), table Jahrgang · Modul (code mono) · Inhalt (name + «4. Semester · Feb–Apr · 1 Tag» + «Periode» badge when no window) · Standort · Schultag (pill «Schule Di+Do» or «kein Schultag bekannt», sub «ÜK an anderen Tagen») · Lernende («19», sub «12 Plätze angerechnet» when `existingFreeSeats`) · Kurse. Footer button «Weiter: Kurse und Termine vorschlagen» → `proposeCourses` then `?stufe=2`.

- [ ] **Step 1:** Implement; `tsc` and lint clean.
- [ ] **Step 2:** Verify in the browser with the FS 2027 run on `neondb`: demand appears with real numbers, readiness lists the missing windows.
- [ ] **Step 3: Commit** `Add the run page with the Bedarf stage`.

### Task 20: Web — Kurse & Termine stage and Lösungsdialog

**Files:**
- Create: `web/src/components/planung/courses-stage.tsx`, `fix-dialog.tsx`

**Interfaces:**
- `CoursesStage`: intro sentence; table Modul · Inhalt (+ cohort) · Standort · KW · Tage («Mi–Do 3.3.–4.3.») · Raum · Plätze («12/12») · Hinweis (reasons or the issue in bad tone; rows with an issue get `bg-bad-soft` and the button «Lösung finden»). Summary line «n von m Kursen planbar · k brauchen eine Entscheidung», buttons «Zurück», «Neu vorschlagen» (confirm), «Weiter: Ausbilder zuteilen» → `staffRun` then `?stufe=3`.
- `FixDialog` (design: 520px): header «KONFLIKT» + subject + problem; card «VORSCHLAG n VON m» with title, «Warum», three effects as bullets; footer «Anderer Vorschlag» (cycles), «Abbrechen», «Vorschlag übernehmen» (disabled with the note «Braucht eine Entscheidung ausserhalb des Tools» when `patch` is null). Loads options with `listFixOptions`, applies with `applyFix`, toasts «Vorschlag übernommen: <title>», refreshes.

- [ ] **Step 1:** Implement; `tsc` and lint clean.
- [ ] **Step 2:** Verify: an unplannable course offers a location change and applying it moves the row out of the red.
- [ ] **Step 3: Commit** `Add the Kurse & Termine stage with the Lösungsdialog`.

### Task 21: Web — Ausbilder and Übernahme stages

**Files:**
- Create: `web/src/components/planung/staffing-stage.tsx`, `commit-stage.tsx`

**Interfaces:**
- `StaffingStage`: intro sentence («Die Engine prüft Skills, Zertifikate an jedem Kurstag, …»); table Modul · Inhalt · Standort · KW · Vorschlag (name + «n machbare Kandidaten», or «kein machbarer Ausbilder» in bad tone + «harte Regeln verletzt») · Score (mono) · Begründung (why, or the staffing issue + «Lösung finden» → `FixDialog`). Row click opens the Kurs-Drawer of Task 9 (`?kurs=`) so the planner can pick another candidate by hand. Summary «n von m Kursen haben einen machbaren Ausbilder», buttons «Zurück», «Neu zuteilen» (confirm), «Weiter: Übernahme prüfen» → `?stufe=4`.
- `CommitStage`: card «Übernahme in den Zeitplan» with the summary rows (dot accent/ok/warn/bad): Kurse anlegen · davon mit Ausbilder · ohne Ausbilder · nicht planbar (werden verworfen) · Lernende eingeteilt · ohne Platz; note «Kurse werden als «geplant» angelegt, Ausbilder als Vorschlag zugewiesen. Kurse ohne machbaren Ausbilder bleiben offen.»; buttons «Zurück» and «Übernehmen: n Kurse» (`ConfirmDialog`), after commit disabled «Bereits übernommen» and a success box «Planungslauf übernommen — n Kurse für <Label> angelegt, k mit zugewiesenem Ausbilder.» with the link «Zu den Kursen» (`/kurse?von=<periodStart>&bis=<periodEnd>`).

- [ ] **Step 1:** Implement; `tsc` and lint clean.
- [ ] **Step 2:** Verify the whole flow on a test period (create run → Bedarf → Kurse → Ausbilder → Übernehmen) and that the new courses show up in `/kurse` with status «geplant»; discard a second run.
- [ ] **Step 3: Commit** `Add the Ausbilder and Übernahme stages`, update the README's module list, then `git push deploy main`.

---

## Implementation notes (2026-11-13)

Written while executing; they refine the tasks above.

- `course.notes` of a draft holds the slot reasons joined with « · » and, after staffing, one entry `Besetzung: <reason>` for courses nobody can teach; `assignment.note` of a run proposal reads «n machbare Kandidaten» (the view parses the number) or the title of the fix option that placed it.
- `planning_run.demand_summary` (jsonb) keeps catch-ups, skipped variant modules and apprentices without class of the last demand step; `demand.language` was added so a group's courses carry the apprentices' language.
- Continuity and maintenance lookups are indexed once per snapshot (`WeakMap` caches in `check.ts` and `maintenance.ts`); the slot search checks instructor supply only for its eight best slots.
- Each stage first deletes the drafts it replaces and loads the snapshot afterwards, so the engine never sees its own previous drafts.
- Partial per-day staffing, device reservations and a true min-cost flow for leftovers remain deferred (decision 12 and 11).

## Out of scope (next plans)

- **Zeitplan**: week grid Standorte × KW with drag-and-drop and the month view (handoff §4), reusing `GET /courses` and the check endpoint.
- **Incremental replanning** (spec step 7): absence approved → re-check affected assignments and queue replacements; no-show → `followUp`; dashboard «Protokoll» and «Braucht eine Entscheidung».
- **Data readiness UI**: bulk entry of time windows per cohort, prerequisites editor, school → variant mapping once SVBL delivers it, device inventory import.
- **Deferred engine parts** (decision 12): partial staffing per day, `reserveDevices`, travel time, weekly-hours balance.
