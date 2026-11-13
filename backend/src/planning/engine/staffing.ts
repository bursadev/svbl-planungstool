import type { AssignmentCheckResult } from '../../courses/assignment.entity.js';
import {
  checkInstructor,
  staticallyEligible,
  type Candidate,
  type CourseToStaff,
  type EngineContext,
} from './check.js';
import type { SnapshotInstructor } from './types.js';

export interface StaffingResult {
  staffed: {
    courseId: string;
    instructorId: string;
    result: AssignmentCheckResult;
    /** Feasible instructors at the moment the course was staffed. */
    candidateCount: number;
  }[];
  unstaffed: { courseId: string; reason: string; candidateCount: number }[];
}

function byScoreThenName(a: Candidate, b: Candidate): number {
  return (
    b.result.score - a.result.score ||
    a.instructor.lastName.localeCompare(b.instructor.lastName, 'de-CH') ||
    a.instructor.firstName.localeCompare(b.instructor.firstName, 'de-CH') ||
    a.instructor.id.localeCompare(b.instructor.id)
  );
}

/**
 * Staffs courses most-constrained-first: the static pool per (course type,
 * language) is checked against the ledger, the course with the fewest
 * feasible instructors is staffed first with its best candidate, and the
 * ledger books the days as it goes. The improvement pass then tries, for
 * every unstaffed course, to take over an instructor from another course of
 * this result when that course has another feasible candidate (2-swap).
 * The ledger in `ctx` is mutated; pass a clone when it must stay intact.
 */
export function staffCourses(
  courses: CourseToStaff[],
  ctx: EngineContext,
  opts: { improve?: boolean } = {},
): StaffingResult {
  const { snapshot, ledger } = ctx;
  const pools = new Map<string, SnapshotInstructor[]>();
  const poolFor = (course: CourseToStaff): SnapshotInstructor[] => {
    const key = `${course.courseTypeId}|${course.language}`;
    let pool = pools.get(key);
    if (!pool) {
      const type = snapshot.courseTypes.get(course.courseTypeId);
      pool = type
        ? [...snapshot.instructors.values()]
            .filter((i) =>
              staticallyEligible(type, course.language, i, snapshot),
            )
            .sort((a, b) => a.id.localeCompare(b.id))
        : [];
      pools.set(key, pool);
    }
    return pool;
  };
  const feasibleFor = (course: CourseToStaff): Candidate[] =>
    poolFor(course)
      .map((instructor) => ({
        instructor,
        result: checkInstructor(course, instructor, ctx),
      }))
      .filter((c) => c.result.ok)
      .sort(byScoreThenName);

  const order = courses
    .map((course) => ({ course, count: feasibleFor(course).length }))
    .sort(
      (a, b) =>
        a.count - b.count ||
        (a.course.dates[0] ?? '').localeCompare(b.course.dates[0] ?? '') ||
        a.course.id.localeCompare(b.course.id),
    )
    .map((x) => x.course);
  const byId = new Map(courses.map((c) => [c.id, c]));
  const staffed = new Map<string, StaffingResult['staffed'][number]>();
  const unstaffed = new Map<string, StaffingResult['unstaffed'][number]>();

  for (const course of order) {
    const feasible = feasibleFor(course);
    const best = feasible[0];
    if (best) {
      ledger.bookInstructor(best.instructor.id, course.dates, course.id);
      staffed.set(course.id, {
        courseId: course.id,
        instructorId: best.instructor.id,
        result: best.result,
        candidateCount: feasible.length,
      });
    } else {
      unstaffed.set(course.id, {
        courseId: course.id,
        reason: reasonFor(course, poolFor(course).length, ctx),
        candidateCount: 0,
      });
    }
  }

  if (opts.improve !== false) {
    // Deleting the current key while iterating a Map is safe; later keys are still visited.
    for (const courseId of unstaffed.keys()) {
      const course = byId.get(courseId)!;
      for (const taker of poolFor(course)) {
        const otherId = course.dates
          .map((d) => ledger.instructorBusyOn(taker.id, d))
          .find((id): id is string => id !== null && staffed.has(id));
        if (!otherId) continue;
        const other = byId.get(otherId)!;
        ledger.releaseInstructor(taker.id, otherId);
        const takerResult = checkInstructor(course, taker, ctx);
        if (!takerResult.ok) {
          ledger.bookInstructor(taker.id, other.dates, otherId);
          continue;
        }
        ledger.bookInstructor(taker.id, course.dates, course.id);
        const replacement = feasibleFor(other).find(
          (c) => c.instructor.id !== taker.id,
        );
        if (!replacement) {
          ledger.releaseInstructor(taker.id, course.id);
          ledger.bookInstructor(taker.id, other.dates, otherId);
          continue;
        }
        ledger.bookInstructor(replacement.instructor.id, other.dates, otherId);
        const previous = staffed.get(otherId)!;
        staffed.set(otherId, {
          ...previous,
          instructorId: replacement.instructor.id,
          result: replacement.result,
        });
        staffed.set(course.id, {
          courseId: course.id,
          instructorId: taker.id,
          result: takerResult,
          candidateCount: 1,
        });
        unstaffed.delete(course.id);
        break;
      }
    }
  }

  return {
    staffed: courses
      .filter((c) => staffed.has(c.id))
      .map((c) => staffed.get(c.id)!),
    unstaffed: courses
      .filter((c) => unstaffed.has(c.id))
      .map((c) => unstaffed.get(c.id)!),
  };
}

function reasonFor(
  course: CourseToStaff,
  poolSize: number,
  ctx: EngineContext,
): string {
  const code =
    ctx.snapshot.courseTypes.get(course.courseTypeId)?.code ??
    course.courseTypeId;
  if (poolSize === 0) {
    return `kein Ausbilder mit Skills, Sprache und Zertifikaten für ${code}`;
  }
  return `kein Ausbilder erfüllt die harten Regeln (${poolSize} statisch geeignet, alle an den Kurstagen belegt oder ohne gültiges Zertifikat)`;
}
