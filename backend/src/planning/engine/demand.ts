import { ApprenticeStatus, CourseStatus } from '../../database/enums.js';
import { dayPatterns } from './calendar.js';
import { isVariantModule, periodScope, type Period } from './readiness.js';
import type {
  IsoDate,
  PlanningSnapshot,
  SnapshotApprentice,
  SnapshotModule,
} from './types.js';

/** Step 1 of a run: the apprentices needing one module at one location, grouped by their school days. */
export interface DemandGroup {
  key: string;
  cohortId: string;
  moduleId: string;
  courseTypeId: string;
  /** The time window of (module, cohort); null when the run period stands in (readiness warns). */
  timeWindowId: string | null;
  window: { startsOn: IsoDate; endsOn: IsoDate };
  locationId: string;
  language: SnapshotApprentice['language'];
  /** ISO weekdays no course day may fall on. */
  blockedWeekdays: number[];
  memberIds: string[];
  classIds: string[];
  /** Free seats of existing courses counted against the members (decision 1). */
  existingFreeSeats: number;
  /** Members that still need a seat in a new course. */
  participantCount: number;
  coursesNeeded: number;
  /** Balanced sizes of the courses to create, e.g. [9, 8, 8]. */
  sizes: number[];
  notes: string[];
}

export interface DemandResult {
  groups: DemandGroup[];
  /** Apprentices with an uncovered module of an earlier semester (counted, not planned). */
  catchUps: number;
  skippedVariantModules: string[];
  apprenticesWithoutClass: number;
}

function codeOf(snapshot: PlanningSnapshot, module: SnapshotModule): string {
  return (
    snapshot.courseTypes.get(module.courseTypeId)?.code ?? module.courseTypeId
  );
}

/** Modules of the apprentice's track still to attend: those of the semester, and the catch-ups of earlier semesters. */
export function openModules(
  apprentice: SnapshotApprentice,
  semester: number,
  snapshot: PlanningSnapshot,
): { current: SnapshotModule[]; catchUp: SnapshotModule[] } {
  const covered = new Set(apprentice.coveredCourseTypeIds);
  const modules = [...snapshot.modules.values()]
    .filter(
      (m) =>
        m.active &&
        m.track === apprentice.track &&
        !isVariantModule(codeOf(snapshot, m)),
    )
    .filter((m) => !covered.has(m.courseTypeId))
    .sort((a, b) => a.semester - b.semester || a.sequence - b.sequence);
  return {
    current: modules.filter((m) => m.semester === semester),
    catchUp: modules.filter((m) => m.semester < semester),
  };
}

/** Balanced course sizes: `ceil(n / max)` courses whose sizes differ by at most one; a group below `min` still gets one course. */
export function sizeCourses(
  participants: number,
  max: number,
  min: number | null,
): number[] {
  void min;
  if (participants <= 0) return [];
  const k = Math.max(1, Math.ceil(participants / Math.max(1, max)));
  const base = Math.floor(participants / k);
  const rest = participants % k;
  return Array.from({ length: k }, (_, i) => base + (i < rest ? 1 : 0));
}

export function compareGroups(
  snapshot: PlanningSnapshot,
  a: DemandGroup,
  b: DemandGroup,
): number {
  const cohort = (g: DemandGroup) =>
    snapshot.cohorts.get(g.cohortId)?.label ?? g.cohortId;
  const sequence = (g: DemandGroup) =>
    snapshot.modules.get(g.moduleId)?.sequence ?? 0;
  const location = (g: DemandGroup) =>
    snapshot.locations.get(g.locationId)?.code ?? g.locationId;
  return (
    cohort(a).localeCompare(cohort(b)) ||
    sequence(a) - sequence(b) ||
    location(a).localeCompare(location(b)) ||
    a.language.localeCompare(b.language) ||
    a.blockedWeekdays.join('+').localeCompare(b.blockedWeekdays.join('+'))
  );
}

/**
 * Groups the apprentices of the period's cohorts by (module, cohort,
 * location of the school, language, school days), attaches the time window
 * (or the period) and nets the free seats of existing courses; then sizes
 * the courses. Groups come back sorted by cohort, module, location.
 */
export function generateDemand(
  snapshot: PlanningSnapshot,
  period: Period,
): DemandResult {
  const { cohorts } = periodScope(snapshot, period);
  const semesterOf = new Map(cohorts.map((c) => [c.cohort.id, c.semester]));
  const groups = new Map<string, DemandGroup>();
  const skipped = new Set<string>();
  let catchUps = 0;
  let withoutClass = 0;

  const apprentices = [...snapshot.apprentices.values()]
    .filter(
      (a) => a.status === ApprenticeStatus.Active && semesterOf.has(a.cohortId),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const apprentice of apprentices) {
    const semester = semesterOf.get(apprentice.cohortId)!;
    const { current, catchUp } = openModules(apprentice, semester, snapshot);
    if (catchUp.length) catchUps++;
    for (const m of snapshot.modules.values()) {
      if (
        m.active &&
        m.track === apprentice.track &&
        m.semester === semester &&
        isVariantModule(codeOf(snapshot, m))
      ) {
        skipped.add(codeOf(snapshot, m));
      }
    }
    const school = snapshot.schools.get(apprentice.schoolId);
    if (!school) continue;
    const cls = apprentice.schoolClassId
      ? snapshot.classes.get(apprentice.schoolClassId)
      : undefined;
    if (!cls) withoutClass++;
    const blocked = [...(cls?.blockedWeekdays ?? [])].sort((a, b) => a - b);
    for (const module of current) {
      const key = [
        module.id,
        apprentice.cohortId,
        school.nearestLocationId,
        apprentice.language,
        blocked.join('+'),
      ].join('|');
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          cohortId: apprentice.cohortId,
          moduleId: module.id,
          courseTypeId: module.courseTypeId,
          timeWindowId: null,
          window: { startsOn: period.startsOn, endsOn: period.endsOn },
          locationId: school.nearestLocationId,
          language: apprentice.language,
          blockedWeekdays: blocked,
          memberIds: [],
          classIds: [],
          existingFreeSeats: 0,
          participantCount: 0,
          coursesNeeded: 0,
          sizes: [],
          notes: [],
        };
        groups.set(key, group);
      }
      group.memberIds.push(apprentice.id);
      if (cls && !group.classIds.includes(cls.id)) group.classIds.push(cls.id);
    }
  }

  const sorted = [...groups.values()].sort((a, b) =>
    compareGroups(snapshot, a, b),
  );
  for (const group of sorted) attachWindow(group, snapshot, period);
  netExistingSeats(sorted, snapshot);
  for (const group of sorted) sizeGroup(group, snapshot);
  return {
    groups: sorted,
    catchUps,
    skippedVariantModules: [...skipped].sort(),
    apprenticesWithoutClass: withoutClass,
  };
}

function attachWindow(
  group: DemandGroup,
  snapshot: PlanningSnapshot,
  period: Period,
): void {
  const windows = snapshot.timeWindows
    .filter(
      (w) =>
        w.curriculumModuleId === group.moduleId &&
        w.cohortId === group.cohortId &&
        (w.locationId === null || w.locationId === group.locationId),
    )
    // A location-specific window beats the general one.
    .sort(
      (a, b) => Number(b.locationId !== null) - Number(a.locationId !== null),
    );
  const window = windows[0];
  if (window) {
    group.timeWindowId = window.id;
    group.window = { startsOn: window.startsOn, endsOn: window.endsOn };
  } else {
    group.timeWindowId = null;
    group.window = { startsOn: period.startsOn, endsOn: period.endsOn };
    group.notes.push('Zeitfenster: Periode (kein Fenster erfasst)');
  }
}

/** Free seats of existing courses (same type, location, language, first day inside the window) are handed to the groups in order, each seat once. */
function netExistingSeats(
  groups: DemandGroup[],
  snapshot: PlanningSnapshot,
): void {
  const pool = new Map<string, number>();
  const poolKey = (g: DemandGroup) =>
    `${g.courseTypeId}|${g.locationId}|${g.language}|${g.window.startsOn}|${g.window.endsOn}`;
  for (const group of groups) {
    const key = poolKey(group);
    if (!pool.has(key)) {
      let free = 0;
      for (const course of snapshot.courses.values()) {
        if (
          course.courseTypeId !== group.courseTypeId ||
          course.locationId !== group.locationId ||
          course.language !== group.language ||
          course.status === CourseStatus.Cancelled ||
          course.status === CourseStatus.Done ||
          course.status === CourseStatus.Demand ||
          course.days.length === 0
        ) {
          continue;
        }
        const first = course.days[0].heldOn;
        if (first < group.window.startsOn || first > group.window.endsOn)
          continue;
        free += Math.max(0, course.capacity - course.booked);
      }
      pool.set(key, free);
    }
    const remaining = pool.get(key) ?? 0;
    const take = Math.min(remaining, group.memberIds.length);
    group.existingFreeSeats = take;
    pool.set(key, remaining - take);
    if (take > 0)
      group.notes.push(
        `${take} freie Plätze in bestehenden Kursen angerechnet`,
      );
  }
}

function sizeGroup(group: DemandGroup, snapshot: PlanningSnapshot): void {
  const type = snapshot.courseTypes.get(group.courseTypeId);
  group.participantCount = Math.max(
    0,
    group.memberIds.length - group.existingFreeSeats,
  );
  group.sizes = sizeCourses(
    group.participantCount,
    type?.maxParticipants ?? 12,
    type?.minParticipants ?? null,
  );
  group.coursesNeeded = group.sizes.length;
  const min = type?.minParticipants ?? null;
  if (
    min !== null &&
    group.participantCount > 0 &&
    group.participantCount < min
  ) {
    group.notes.push(`unter Minimum (${min})`);
  }
}

/** Whether a course of the type still finds a contiguous block in a plain week when these weekdays are blocked. */
export function fitsBlockedWeekdays(
  courseTypeId: string,
  blocked: ReadonlySet<number>,
  snapshot: PlanningSnapshot,
): boolean {
  const type = snapshot.courseTypes.get(courseTypeId);
  if (!type) return false;
  return (
    dayPatterns({
      weekMonday: '2027-03-01',
      durationDays: type.durationDays,
      weekdayRule: type.weekdayRule,
      maySpanWeeks: type.maySpanWeeks,
      blockedWeekdays: blocked,
      holidays: new Set(),
    }).length > 0
  );
}

/**
 * Merges groups of the same (module, cohort, location, language), smallest
 * first, as long as a course still fits outside the union of their school
 * days. Fewer, fuller courses; the packing keeps classes together later.
 */
export function mergeGroups(
  groups: DemandGroup[],
  snapshot: PlanningSnapshot,
): DemandGroup[] {
  const families = new Map<string, DemandGroup[]>();
  for (const group of groups) {
    const key = [
      group.moduleId,
      group.cohortId,
      group.locationId,
      group.language,
    ].join('|');
    const list = families.get(key) ?? [];
    list.push(group);
    families.set(key, list);
  }
  const merged: DemandGroup[] = [];
  for (const family of families.values()) {
    const result: DemandGroup[] = [];
    for (const group of [...family].sort(
      (a, b) =>
        a.memberIds.length - b.memberIds.length || a.key.localeCompare(b.key),
    )) {
      const target = result.find((r) =>
        fitsBlockedWeekdays(
          group.courseTypeId,
          new Set([...r.blockedWeekdays, ...group.blockedWeekdays]),
          snapshot,
        ),
      );
      if (target) {
        target.memberIds = [...target.memberIds, ...group.memberIds];
        target.classIds = [...new Set([...target.classIds, ...group.classIds])];
        target.blockedWeekdays = [
          ...new Set([...target.blockedWeekdays, ...group.blockedWeekdays]),
        ].sort((a, b) => a - b);
        target.existingFreeSeats += group.existingFreeSeats;
        target.key = [
          target.moduleId,
          target.cohortId,
          target.locationId,
          target.language,
          target.blockedWeekdays.join('+'),
        ].join('|');
        target.notes = [
          ...new Set([
            ...target.notes,
            ...group.notes,
            'Schultag-Gruppen zusammengelegt',
          ]),
        ];
      } else {
        result.push({
          ...group,
          memberIds: [...group.memberIds],
          classIds: [...group.classIds],
          notes: [...group.notes],
        });
      }
    }
    merged.push(...result);
  }
  for (const group of merged) sizeGroup(group, snapshot);
  return merged.sort((a, b) => compareGroups(snapshot, a, b));
}
