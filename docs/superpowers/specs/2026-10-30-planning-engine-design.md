# Planning engine design

Date: 2026-10-30. Status: draft for discussion.

How the tool turns apprentices, curriculum, locations and instructors into a semester plan: **how many courses**, **which apprentice sits in which course**, and **which instructor teaches which course**. It defines the planning steps, the algorithm of each step, the engine functions, the data gaps that block them, and the build order.

Sources: `docs/design-handoff/README.md` (engine spec, binding), `web/src/proto/svbl-planung.logic.ts` (reference implementation), `domain/Requirements.md` §9–11, `domain/Interview Protocol.md`, the data model spec of 2026-10-01, and the OdAOrg import in `neondb` as of 2026-10-30.

## 1. The problem in one paragraph

Every semester each apprentice has to attend the ÜK modules of their track and semester. Apprentices are grouped into courses (max 6–24 participants by course type) at the ÜK location nearest their vocational school, on days when they are not at school, inside the module's time window, in their language, after the prerequisite modules. Each course needs a room of the right kind, devices, and one instructor who holds the skills, certificates valid on every course day, device qualification and language, and who is free on all course days. The interview fixes the order: **Demand → Courses → Time windows → Availability**.

## 2. What the current data says

Counts from the OdAOrg import (neondb, 2026-10-30):

| Table | Rows | Consequence for planning |
|---|---|---|
| apprentice | 5,435 (cohorts 2024–2026 EFZ, 2025–2026 EBA) | Real volume: about 1,000–2,000 course proposals per semester run |
| curriculum_module | 47 (31 EFZ, 16 EBA) | Contains **specialisation variants** (`.D` Distribution, `.L` Lager) and **electives** (`5.HAB`/`5.Kran`, `6.R3`/`6.R4`) that the model cannot express yet |
| curriculum_module_prerequisite | 0 | Prerequisite rule is vacuous |
| time_window | 0 | Hard rule "course inside its window" cannot run |
| device / availability | 0 / 0 | Device check and availability check pass everything |
| school_class / school_class_day | 1,442 / 1,462 | Good; 32 classes have two school days; 127 apprentices have no class (no known school day) |
| course | 4,927 (2,037 planned, none with enrollments; dates up to 2028-09) | OdAOrg already holds a forward plan; the run must decide whether to build on it or replace it |
| assignment | 5,406; 2,365 planned/confirmed courses without one | Large staffing backlog that the engine can work on first |
| location with `hosts_uk` | 24 incl. Post company sites | Nearest-location mapping per school is decisive |

Data anomalies to check with SVBL: `Start-up EBA/EFZ` are in semester 6 (look like semester 1); EBA (2-year) has a semester-6 module; EFZ sums to 41 ÜK days, the interview said about 25 (variants double-count).

## 3. Planning steps

One **planning run** (`planning_run`) per period (normally a semester). Each step writes draft rows tagged with the run; nothing is visible as real plan until commit. Every step can be re-run; later steps keep what the planner pinned.

```mermaid
flowchart LR
  S0[0 Readiness] --> S1[1 Demand] --> S2[2 Courses & dates] --> S3[3 Apprentices → courses] --> S4[4 Instructors & devices] --> S5[5 Validate & fix] --> S6[6 Commit]
  S6 -. absence / no-show / re-import / cancellation .-> S7[7 Incremental replanning]
```

### Step 0 — Readiness check

Before a run starts, `checkReadiness(period)` reports what is missing per rule, so a planner sees that a rule is skipped rather than silently passed: time windows per (module, cohort), prerequisites, school days per class, devices per location for device-needing types, instructor availability, public holidays, nearest location per school. The run can start with warnings; skipped rules are recorded on the run.

### Step 1 — Demand (how many courses)

1. **Semester per cohort.** School year starts in August. `semester = 2 × (schoolYearStart − cohort.startYear) + (spring ? 2 : 1)`. Example: cohort 2024 in autumn 2026 → semester 5.
2. **Open modules per apprentice** (`openModules`): active modules of the apprentice's track (and specialisation, once modelled) with `semester ≤ current`, minus modules already attended, minus modules with a live enrollment in a future course. This catches catch-up cases (missed earlier semester) the prototype's school counts miss.
3. **Group** the apprentices needing a module by **(ÜK location = school's nearest location, language, blocked weekdays)**. Blocked weekdays come from `school_class_day` of the apprentice's class.
4. **Merge compatible groups** at the same location and language when a contiguous block of the course's duration still fits outside the union of their school days (`dayPatterns(type, blocked)` non-empty). Merge small groups first; this cuts the number of under-filled courses.
5. **Net out existing courses**: free seats in already planned/confirmed OdAOrg courses of the module at that location reduce the group (decided, see §6).
6. **Size**: `k = ceil(n / maxParticipants)`, then balanced sizes `ceil(n/k)` / `floor(n/k)` instead of "fill to max, remainder in the last course". If a group is below `minParticipants`, merge with the nearest compatible location or flag it.

Output: `demand` rows (`participant_count`, `courses_needed`, `school_weekday`) plus the member list of each group (kept in memory for step 3 or stored, see §6).

### Step 2 — Courses and dates

For each needed course create a `course` (status `demand` → `planned`, `planning_run_id` set) and place it.

**Hard constraints**: inside the time window of (module, cohort); course days avoid the group's school weekdays, public holidays and the weekday rule of the type (Saturday courses for adults); location parallel-course capacity per day; a free room of the right kind (practice hall if the type needs devices, else theory room) with capacity ≥ participants; device stock at the location on every day (`deviceAt`, minus maintenance, minus reservations); prerequisite courses of the same group end before this one starts.

**Soft criteria (slot score)**: spread courses evenly across the window (avoid all courses in the first weeks), keep a cohort group's modules in sequence and spaced, leave room for at least one qualified instructor (`instructorSupply` ≥ 1 after the ledger), prefer weeks without school holidays if SVBL wants that.

**Algorithm: greedy with most-constrained-first ordering, then local repair.**
1. Sort courses by difficulty: device-needing, longest duration, narrowest window, fewest feasible day patterns, prerequisites first.
2. For each course enumerate feasible slots (`feasibleSlots` = the generalisation of the prototype's `freeSlot`, which returns all slots, not the first), score them, take the best, book it in the **ledger** (location-day count, room-day, device-type-day, provisional instructor-days).
3. Courses with no slot are marked unplannable with the reason (no silent fallback, as the handoff requires) and go to step 5.
4. Repair pass: for each unplannable course try to move one already placed course of lower difficulty (one-level swap) to free a slot.

Why greedy and not an ILP/CP solver for the PoC: deterministic and explainable per decision (every placement carries its reasons), fast enough for ~2,000 courses × ~20 weeks × 24 locations in TypeScript, no extra runtime in the stack. If plan quality turns out insufficient, the same model can be handed to OR-Tools CP-SAT in a Python sidecar later; the function boundaries below stay the same.

### Step 3 — Apprentices into courses (enrollment)

**Hard**: same module and language; course days are not the apprentice's school days; capacity; prerequisite modules attended or in a course that ends earlier; no two courses on the same day for one apprentice; module not attended yet.
**Soft**: nearest location to the school; **keep a school class together**; keep apprentices of one training company together; balanced course sizes; earlier course for apprentices who are behind.

**Algorithm**:
1. **Class bin-packing**: for each demand group, pack whole school classes into the group's courses (first-fit decreasing by class size). This matches how planners think ("the Aarau class goes to ÜK 2.0 in week 41") and keeps cost low.
2. **Leftovers** (classes larger than a course, apprentices without a class, catch-ups) go through a **min-cost flow**: apprentice → eligible course edges, cost = distance penalty + class-split penalty + lateness, capacity = free seats. Optimal for this structure and small enough (thousands of nodes) to solve in-process.
3. Anyone still unassigned becomes an issue for step 5 (needs an extra course).

Since apprentices have no choice and schools map to fixed locations (§6), step 1 is the normal path and step 2 only handles the rest. Moving a single apprentice later (sickness, no-show) is the `followUp` quick action, not a re-run.

`followUp(apprentice, module)` (prototype) is the one-apprentice version of the same rule, used for no-shows and late imports.

### Step 4 — Instructors and devices (staffing)

**Instructor `check(course, instructor, ledger)`** — as in the handoff spec. Hard: all skills; every required certificate valid **on every course day**; device qualification; language; free on all days (no other assignment incl. the run's ledger, no approved absence). Soft (start 50, clamp 0–100): home location +30, same language region +12, other region −10, preferred location +8, cohort continuity +10, employee +5, open vacation request −15, qualification maintenance open +10. Add from the model: travel time vs. `maxTravelMinutes`, weekly hours / overtime cap, `avoidInstructorIds` for co-teaching.

**Algorithm: most-constrained-first greedy with a ledger, then improvement.**
1. Pre-filter once per (course type, language) the instructors that pass the static rules (skills, language, certificate types held). With ~600 instructors this cuts each check to a short list.
2. Order courses by number of feasible candidates (fewest first), then by date.
3. Assign the best-scoring feasible candidate, book the instructor-days in the ledger.
4. Improvement: for each unstaffed course look for a swap — instructor A moves from course X to Y if X can be staffed by someone else (augmenting path of length 2). Then a balance pass: move courses from instructors above their weekly hours to under-loaded ones when the score loss is small.
5. Fallback: partial staffing per day (`assignment.course_day_id`) when nobody covers all days.
6. **Devices**: `reserveDevices(course)` books concrete devices per course day (first fit at the location, `device_reservation`); the type-level stock was already checked in step 2.

Staffing runs on the 2,365 existing unstaffed courses too, independent of a planning run. That gives value before steps 1–3 exist.

### Step 5 — Validate and fix

`validateRun(run)` lists every issue with its rule and reason: unplannable demand, course without instructor or device, below-minimum course, apprentice without course, prerequisite order broken, conflicts created by manual edits. `fixOptions(issue)` returns the ranked options of the handoff spec (add course type · change location · exceed window · split course · rent device · change language · move week · refresh certificate, plus "add a course" for unassigned apprentices). Every patch is applied through `feasibleSlots`/`check`, never written directly.

### Step 6 — Commit or discard

`commitRun` in one transaction: demand → `planned`, courses → `open`, enrollments → `registered`, assignments stay `proposed` until a planner confirms, audit entries for all changes, alerts recomputed. `discardRun` deletes the run's draft rows.

### Step 7 — Incremental replanning (after commit)

Same functions with everything committed pinned:
- **Absence approved** → `check` all affected assignments → re-staff with `candidates` (prototype `autoResolve`), queue the rest for the planner.
- **No-show** → `followUp`, else issue "extra course needed".
- **School re-import** → new apprentices get `openModules` → seats in existing courses via step 3, remaining demand flagged.
- **Course cancelled or moved** → release resources, re-enroll its apprentices, re-check its instructor.

## 4. Engine functions

All pure functions over an in-memory `PlanningSnapshot` (loaded once per run: ~5k apprentices, ~600 instructors, a semester of courses fits easily in memory) plus a `Ledger`. Persistence lives in a thin service around them. Location: `backend/src/planning/engine/`, one file per area, unit tests per rule.

| Area | Function | Returns |
|---|---|---|
| Data | `loadSnapshot(period)` | all rows a run needs, indexed by id |
| | `Ledger` | bookings per (instructor, date), (location, date), (room, date), (device type, location, date), (apprentice, date); `book`, `release`, `isFree` |
| | `checkReadiness(period)` | missing inputs per rule |
| Calendar | `cohortSemester(cohort, period)` | semester 1–6 or null |
| | `blockedWeekdays(apprentice \| class, schoolYear)` | ISO weekdays |
| | `workingDays(location, from, to)` | dates minus public holidays |
| | `dayPatterns(courseType, blocked, week)` | possible day sets in a week (contiguous, weekday rule, may span weeks) |
| Demand | `openModules(apprentice)` | modules still to attend |
| | `genDemand(run)` | demand groups with members |
| | `sizeCourses(group, courseType)` | number and sizes of courses |
| Courses | `feasibleSlots(course, location, window, ledger)` | all slots `{dates, room}` with reasons for rejected weeks |
| | `scoreSlot(slot, context)` | score + reasons |
| | `deviceAt(device, date)`, `deviceCheck(course, ledger)` | location; per device type free vs. needed |
| | `instructorSupply(courseType, language, dates, ledger)` | number of feasible instructors |
| | `proposeCourses(run)` | placed courses + unplannable list |
| Enrollment | `eligibleCourses(apprentice, module, ledger)` | courses with reasons |
| | `assignApprentices(run)` | enrollments + unassigned |
| | `followUp(apprentice, module)` | best course or null |
| Staffing | `check(course, instructor, ledger)` | `{ok, hard[], soft[], score}` (= `AssignmentCheckResult`) |
| | `candidates(course, ledger)` | ranked instructors with results |
| | `maintenance(instructor, year)` | per certificate type open/fulfilled |
| | `staffRun(run \| courses)` | assignments + unstaffed |
| | `reserveDevices(course)` | device reservations |
| Fixes | `validateRun(run)` | issues |
| | `fixOptions(issue)` | options with patch |
| | `applyPatch(patch)` | re-validated change |
| Lifecycle | `commitRun`, `discardRun` | |
| | `onAbsence`, `onNoShow`, `onImport`, `onCourseChanged` | replanning results |

REST surface (planner role): `POST /planning-runs`, `POST /planning-runs/:id/{demand,courses,enrollments,staffing}` (each runs one step and moves `stage`), `GET /planning-runs/:id/issues`, `GET /issues/:id/fix-options`, `POST /planning-runs/:id/{commit,discard}`, `GET /courses/:id/candidates`, `GET /courses/:id/check/:instructorId`. These are also the tools the AI assistant calls later.

Engineering rules: dates as ISO dates (no internal week counter, see handoff); deterministic tie-breaks (sort by id) so a re-run gives the same plan; every decision carries a human-readable reason; weights and thresholds come from `setting`.

## 5. Build order

Each milestone is usable on its own.

1. **Data readiness** — time-window editor for planning admins, prerequisites, variant modules mapped to schools/classes, public holidays, fix the semester anomalies, `enrollment.planning_run_id`; `checkReadiness` endpoint.
2. **Engine core** — snapshot, calendar helpers, ledger, `check`, `candidates`, `deviceAt`, `deviceCheck`, `maintenance`; unit test per rule of the constraint table.
3. **Manual staffing with engine support** — candidates endpoint and UI on the course drawer; immediately useful for the 2,365 unstaffed courses.
4. **Automatic staffing** — `staffRun` + improvement pass + `reserveDevices`, run on existing courses.
5. **Demand** — `cohortSemester`, `openModules`, `genDemand`, `sizeCourses`; demand screen of the planning run.
6. **Course proposal** — `dayPatterns`, `feasibleSlots`, `scoreSlot`, `proposeCourses`.
7. **Enrollment** — `assignApprentices` (bin-packing + min-cost flow), `followUp`.
8. **Validate, fix, commit** — `validateRun`, `fixOptions`, `applyPatch`, `commitRun`, `discardRun`.
9. **Incremental replanning** — absence, no-show, re-import, cancellation handlers.
10. **Assistant tools** over the endpoints above.

Staffing (3–4) comes before demand (5–7) on purpose: it works on the courses OdAOrg already has, so the planning team sees value while the inputs for steps 1–3 are still being collected.

## 6. Decisions

Taken on 2026-10-30:

1. **Build on the existing OdAOrg plan.** A run treats OdAOrg's planned and confirmed courses as fixed input: their free seats count against demand (step 1.5) and their days are booked in the ledger. OdAOrg is replaced by this tool in the end, so the import is a transition path, not a permanent sync.
2. **No apprentice choice.** Apprentices come from specific schools, and each school is assigned to a ÜK location. Variant and elective modules follow from the school or class (profession code), not from the apprentice. Enrollment follows school → location; moving an apprentice to another course is an exception handled by a quick action (`followUp`, e.g. after sickness), not by the optimiser.
3. **Time windows are created by planning admins** in the tool. Milestone 1 therefore needs a time-window editor (CRUD per module and cohort); `checkReadiness` blocks a run for modules without a window.
4. **Draft enrollments get `planning_run_id`** (nullable, like `course`); `discardRun` deletes them with the run.

Still open:

5. **Keep classes together**: hard rule or strong preference? (Decision 2 makes it the normal case.)
6. **Course sizing**: balanced sizes or fill to max?
7. **Public holidays and school holidays**: which calendar source, and are school holidays good or bad weeks for ÜK?
8. **Apprentices without a class** (127): use a school-level default school day, or require the class?
9. **Solver**: greedy + repair in TypeScript for the PoC (proposed) vs. a CP-SAT sidecar from the start.
