import {
  AssignmentRole,
  AssignmentStatus,
  CourseStatus,
} from '../../database/enums.js';
import type { EngineContext } from './check.js';
import type { PlanningSnapshot, SnapshotInstructor } from './types.js';

export interface MaintenanceItem {
  certificateTypeId: string;
  name: string;
  min: number;
  /** Lead assignments (proposed or confirmed) on qualifying courses whose first day lies in the year. */
  taught: number;
  open: number;
  ok: boolean;
  courseTypeIds: string[];
}

/** Per snapshot and year: `instructorId|courseTypeId` → lead assignments on courses with a first day in the year. */
const taughtCache = new WeakMap<
  PlanningSnapshot,
  Map<number, Map<string, number>>
>();

function taughtIndex(
  snapshot: PlanningSnapshot,
  year: number,
): Map<string, number> {
  let byYear = taughtCache.get(snapshot);
  if (!byYear) {
    byYear = new Map();
    taughtCache.set(snapshot, byYear);
  }
  let index = byYear.get(year);
  if (!index) {
    index = new Map();
    const prefix = `${year}-`;
    for (const course of snapshot.courses.values()) {
      if (course.status === CourseStatus.Cancelled) continue;
      const first = course.days.map((d) => d.heldOn).sort()[0];
      if (!first?.startsWith(prefix)) continue;
      for (const a of course.assignments) {
        if (a.role !== AssignmentRole.Lead) continue;
        if (
          a.status !== AssignmentStatus.Confirmed &&
          a.status !== AssignmentStatus.Proposed
        )
          continue;
        const key = `${a.instructorId}|${course.courseTypeId}`;
        index.set(key, (index.get(key) ?? 0) + 1);
      }
    }
    byYear.set(year, index);
  }
  return index;
}

/**
 * Qualifikationspflege: for every certificate type the instructor holds that
 * has a maintenance rule (e.g. IPAF: 5 courses a year), how many qualifying
 * courses they lead in the year and how many are still open.
 */
export function maintenanceStatus(
  instructor: SnapshotInstructor,
  year: number,
  ctx: EngineContext,
): MaintenanceItem[] {
  const held = new Set(instructor.certificates.map((c) => c.certificateTypeId));
  const items: MaintenanceItem[] = [];
  for (const type of ctx.snapshot.certificateTypes.values()) {
    if (type.maintenanceMinPerYear === null || !held.has(type.id)) continue;
    const qualifying = new Set(type.maintenanceCourseTypeIds);
    const index = taughtIndex(ctx.snapshot, year);
    let taught = 0;
    for (const courseTypeId of qualifying) {
      taught += index.get(`${instructor.id}|${courseTypeId}`) ?? 0;
    }
    const open = Math.max(0, type.maintenanceMinPerYear - taught);
    items.push({
      certificateTypeId: type.id,
      name: type.name,
      min: type.maintenanceMinPerYear,
      taught,
      open,
      ok: open === 0,
      courseTypeIds: [...qualifying],
    });
  }
  return items.sort((a, b) =>
    a.certificateTypeId.localeCompare(b.certificateTypeId),
  );
}
