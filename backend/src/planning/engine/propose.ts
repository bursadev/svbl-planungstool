import { CourseStatus, Language } from '../../database/enums.js';
import { dayPatterns, mondayOf } from './calendar.js';
import type { EngineContext } from './check.js';
import type { DemandGroup } from './demand.js';
import { feasibleSlots, type SlotRequest } from './slots.js';
import type { IsoDate, PlanningSnapshot, SnapshotCourse } from './types.js';

/** Step 2 of a run: one course of a demand group, placed or unplannable, with its members. */
export interface ProposedCourse {
  /** `<group key>#<n>`; the ledger books the course under it. */
  key: string;
  demandKey: string;
  courseTypeId: string;
  locationId: string;
  language: Language;
  cohortId: string;
  timeWindowId: string | null;
  seats: number;
  dates: IsoDate[];
  roomId: string | null;
  memberIds: string[];
  /** Why no slot was found; null for placed courses. */
  issue: string | null;
  reasons: string[];
}

export interface Placement {
  apprenticeId: string;
  /** The proposed course, or null when the apprentice goes into an existing course. */
  courseKey: string | null;
  existingCourseId: string | null;
}

export interface Unassigned {
  apprenticeId: string;
  demandKey: string;
  reason: string;
}

export interface ProposalResult {
  courses: ProposedCourse[];
  placements: (Placement & { demandKey: string })[];
  unassigned: Unassigned[];
}

function blockedOf(
  apprenticeId: string,
  snapshot: PlanningSnapshot,
): ReadonlySet<number> {
  const apprentice = snapshot.apprentices.get(apprenticeId);
  const cls = apprentice?.schoolClassId
    ? snapshot.classes.get(apprentice.schoolClassId)
    : undefined;
  return new Set(cls?.blockedWeekdays ?? []);
}

function weekdayOf(date: IsoDate): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Most constrained first: devices, duration, narrow window, few free patterns, prerequisites; ties by key. */
function difficulty(group: DemandGroup, snapshot: PlanningSnapshot): number[] {
  const type = snapshot.courseTypes.get(group.courseTypeId);
  const module = snapshot.modules.get(group.moduleId);
  const windowDays =
    (Date.parse(group.window.endsOn) - Date.parse(group.window.startsOn)) /
    864e5;
  const patterns = type
    ? dayPatterns({
        weekMonday: '2027-03-01',
        durationDays: type.durationDays,
        weekdayRule: type.weekdayRule,
        maySpanWeeks: type.maySpanWeeks,
        blockedWeekdays: new Set(group.blockedWeekdays),
        holidays: new Set(),
      }).length
    : 0;
  return [
    type && type.requiredDevices.length ? 0 : 1,
    -(type?.durationDays ?? 0),
    windowDays,
    patterns,
    -(module?.prerequisiteModuleIds.length ?? 0),
  ];
}

function compareDifficulty(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function mostFrequent(reasons: string[]): string {
  const counts = new Map<string, number>();
  for (const r of reasons) counts.set(r, (counts.get(r) ?? 0) + 1);
  return (
    [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? 'kein Termin im Zeitfenster'
  );
}

/** Existing courses of the group's type, location and language with a first day inside the window and free seats. */
export function existingCoursesFor(
  group: DemandGroup,
  snapshot: PlanningSnapshot,
): SnapshotCourse[] {
  return [...snapshot.courses.values()]
    .filter(
      (c) =>
        c.courseTypeId === group.courseTypeId &&
        c.locationId === group.locationId &&
        c.language === group.language &&
        c.status !== CourseStatus.Cancelled &&
        c.status !== CourseStatus.Done &&
        c.status !== CourseStatus.Demand &&
        c.days.length > 0 &&
        c.days[0].heldOn >= group.window.startsOn &&
        c.days[0].heldOn <= group.window.endsOn &&
        c.capacity > c.booked,
    )
    .sort(
      (a, b) =>
        a.days[0].heldOn.localeCompare(b.days[0].heldOn) ||
        a.id.localeCompare(b.id),
    );
}

/**
 * Places the courses of every group most-constrained-first with
 * `feasibleSlots`, booking each placement in the ledger, repairs
 * unplannable courses by moving one easier course of the same location,
 * then packs the apprentices (whole classes first). The ledger in `ctx` is
 * mutated; pass a clone when it must stay intact.
 */
export function proposeCourses(
  groups: DemandGroup[],
  ctx: EngineContext,
  opts: { notBefore: IsoDate },
): ProposalResult {
  const { snapshot, ledger } = ctx;
  const order = [...groups]
    .map((group) => ({ group, difficulty: difficulty(group, snapshot) }))
    .sort(
      (a, b) =>
        compareDifficulty(a.difficulty, b.difficulty) ||
        a.group.key.localeCompare(b.group.key),
    )
    .map((x) => x.group);
  const courses: ProposedCourse[] = [];
  const groupWeeks = new Map<string, Set<IsoDate>>();

  const requestFor = (
    group: DemandGroup,
    key: string,
    seats: number,
  ): SlotRequest => ({
    courseId: key,
    courseTypeId: group.courseTypeId,
    locationId: group.locationId,
    language: group.language,
    seats,
    blockedWeekdays: new Set(group.blockedWeekdays),
    window: group.window,
    notBefore: opts.notBefore,
    groupKey: group.key,
    cohortId: group.cohortId,
  });
  const book = (course: ProposedCourse) => {
    ledger.bookCourse({
      id: course.key,
      courseTypeId: course.courseTypeId,
      days: course.dates.map((heldOn) => ({
        heldOn,
        locationId: course.locationId,
        roomId: course.roomId,
      })),
      instructorIds: [],
      apprenticeIds: [],
    });
    const weeks = groupWeeks.get(course.demandKey) ?? new Set<IsoDate>();
    weeks.add(mondayOf(course.dates[0]));
    groupWeeks.set(course.demandKey, weeks);
  };
  const place = (group: DemandGroup, course: ProposedCourse): boolean => {
    const search = feasibleSlots(
      requestFor(group, course.key, course.seats),
      ctx,
      {
        groupWeeks: groupWeeks.get(group.key),
      },
    );
    const best = search.slots[0];
    if (!best) {
      course.dates = [];
      course.roomId = null;
      course.issue = mostFrequent(search.rejected.map((r) => r.reason));
      course.reasons = [];
      return false;
    }
    course.dates = best.dates;
    course.roomId = best.roomId;
    course.issue = null;
    course.reasons = best.reasons;
    book(course);
    return true;
  };

  const groupOf = new Map(groups.map((g) => [g.key, g]));
  for (const group of order) {
    group.sizes.forEach((seats, index) => {
      const course: ProposedCourse = {
        key: `${group.key}#${index + 1}`,
        demandKey: group.key,
        courseTypeId: group.courseTypeId,
        locationId: group.locationId,
        language: group.language,
        cohortId: group.cohortId,
        timeWindowId: group.timeWindowId,
        seats,
        dates: [],
        roomId: null,
        memberIds: [],
        issue: null,
        reasons: [],
      };
      place(group, course);
      courses.push(course);
    });
  }

  // Repair: move one easier (later placed) course of the same location to its next slot and retry.
  for (const stuck of courses.filter((c) => c.issue !== null)) {
    const stuckIndex = courses.indexOf(stuck);
    const candidates = courses.filter(
      (c, i) =>
        i > stuckIndex && c.issue === null && c.locationId === stuck.locationId,
    );
    for (const other of candidates) {
      const previous = {
        dates: other.dates,
        roomId: other.roomId,
        reasons: other.reasons,
      };
      ledger.releaseCourse(other.key);
      groupWeeks.get(other.demandKey)?.delete(mondayOf(previous.dates[0]));
      if (
        place(groupOf.get(stuck.demandKey)!, stuck) &&
        place(groupOf.get(other.demandKey)!, other)
      )
        break;
      // Revert both.
      if (stuck.issue === null) {
        ledger.releaseCourse(stuck.key);
        groupWeeks.get(stuck.demandKey)?.delete(mondayOf(stuck.dates[0]));
        stuck.dates = [];
        stuck.roomId = null;
        stuck.issue =
          'kein Termin im Zeitfenster (auch nach Verschieben anderer Kurse nicht)';
      }
      other.dates = previous.dates;
      other.roomId = previous.roomId;
      other.reasons = previous.reasons;
      other.issue = null;
      book(other);
    }
  }

  const unassigned: Unassigned[] = [];
  const placements: ProposalResult['placements'] = [];
  for (const group of groups) {
    const own = courses.filter((c) => c.demandKey === group.key);
    const result = packApprentices(
      group,
      own,
      existingCoursesFor(group, snapshot),
      ctx,
    );
    for (const placement of result.placements) {
      if (placement.courseKey) {
        own
          .find((c) => c.key === placement.courseKey)!
          .memberIds.push(placement.apprenticeId);
      }
      placements.push({ ...placement, demandKey: group.key });
    }
    unassigned.push(
      ...result.unassigned.map((u) => ({ ...u, demandKey: group.key })),
    );
  }

  const byGroup = new Map(groups.map((g, i) => [g.key, i]));
  courses.sort(
    (a, b) =>
      byGroup.get(a.demandKey)! - byGroup.get(b.demandKey)! ||
      a.key.localeCompare(b.key),
  );
  return { courses, placements, unassigned };
}

interface Target {
  courseKey: string | null;
  existingCourseId: string | null;
  code: string;
  dates: IsoDate[];
  free: number;
  members: Set<string>;
}

/**
 * Whole classes first into the targets (existing courses with free seats,
 * then the group's placed courses), largest class first; what does not fit
 * as a class goes seat by seat to the cheapest target (classmates present,
 * then the earliest course). Every placement books the apprentice's days.
 */
export function packApprentices(
  group: DemandGroup,
  courses: ProposedCourse[],
  existing: SnapshotCourse[],
  ctx: EngineContext,
): {
  placements: Placement[];
  unassigned: { apprenticeId: string; reason: string }[];
} {
  const { snapshot, ledger } = ctx;
  const codeOf = (typeId: string) =>
    snapshot.courseTypes.get(typeId)?.code ?? typeId;
  const targets: Target[] = [
    ...existing.map((c) => ({
      courseKey: null,
      existingCourseId: c.id,
      code: codeOf(c.courseTypeId),
      dates: c.days.map((d) => d.heldOn),
      free: c.capacity - c.booked,
      members: new Set<string>(),
    })),
    ...courses
      .filter((c) => c.dates.length > 0)
      .sort(
        (a, b) =>
          a.dates[0].localeCompare(b.dates[0]) || a.key.localeCompare(b.key),
      )
      .map((c) => ({
        courseKey: c.key,
        existingCourseId: null,
        code: codeOf(c.courseTypeId),
        dates: c.dates,
        free: c.seats,
        members: new Set<string>(),
      })),
  ];
  const placements: Placement[] = [];
  const unassigned: { apprenticeId: string; reason: string }[] = [];
  if (targets.length === 0) {
    const issue = courses.find((c) => c.issue)?.issue ?? 'kein Kurs geplant';
    return {
      placements,
      unassigned: group.memberIds.map((apprenticeId) => ({
        apprenticeId,
        reason: `Kurs nicht planbar: ${issue}`,
      })),
    };
  }
  const canAttend = (apprenticeId: string, target: Target): boolean => {
    const blocked = blockedOf(apprenticeId, snapshot);
    return target.dates.every(
      (d) =>
        !blocked.has(weekdayOf(d)) &&
        ledger.apprenticeBusyOn(apprenticeId, d) === null,
    );
  };
  const put = (apprenticeId: string, target: Target) => {
    target.free--;
    target.members.add(apprenticeId);
    ledger.bookApprentices(
      [apprenticeId],
      target.dates,
      target.courseKey ?? target.existingCourseId!,
    );
    placements.push({
      apprenticeId,
      courseKey: target.courseKey,
      existingCourseId: target.existingCourseId,
    });
  };

  // Whole classes, largest first.
  const byClass = new Map<string, string[]>();
  const singles: string[] = [];
  for (const id of [...group.memberIds].sort()) {
    const cls = snapshot.apprentices.get(id)?.schoolClassId ?? null;
    if (cls) byClass.set(cls, [...(byClass.get(cls) ?? []), id]);
    else singles.push(id);
  }
  const leftovers: string[] = [...singles];
  for (const [, members] of [...byClass.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  )) {
    const target = targets.find(
      (t) =>
        t.free >= members.length && members.every((id) => canAttend(id, t)),
    );
    if (target) members.forEach((id) => put(id, target));
    else leftovers.push(...members);
  }

  // Seat by seat: classmates present beats an earlier course.
  const windowStart = Date.parse(group.window.startsOn);
  for (const id of leftovers.sort()) {
    const cls = snapshot.apprentices.get(id)?.schoolClassId ?? null;
    const options = targets
      .filter((t) => t.free > 0 && canAttend(id, t))
      .map((t) => {
        const classmates = cls
          ? [...t.members].some(
              (m) => snapshot.apprentices.get(m)?.schoolClassId === cls,
            )
          : false;
        const weeks = (Date.parse(t.dates[0]) - windowStart) / (7 * 864e5);
        return { t, cost: (cls && !classmates ? 1 : 0) + weeks / 10 };
      })
      .sort(
        (a, b) =>
          a.cost - b.cost ||
          a.t.dates[0].localeCompare(b.t.dates[0]) ||
          (a.t.courseKey ?? '').localeCompare(b.t.courseKey ?? ''),
      );
    if (options.length) {
      put(id, options[0].t);
      continue;
    }
    const busy = targets
      .map((t) =>
        t.dates.map((d) => ledger.apprenticeBusyOn(id, d)).find((x) => x),
      )
      .find((x) => x);
    const other = busy ? snapshot.courses.get(busy) : undefined;
    unassigned.push({
      apprenticeId: id,
      reason: busy
        ? `an diesen Tagen bereits in ${other ? codeOf(other.courseTypeId) : 'einem anderen Kurs des Laufs'}`
        : 'kein Platz mehr in den Kursen der Gruppe',
    });
  }
  return { placements, unassigned };
}
