import {
  AssignmentRole,
  AssignmentStatus,
  CourseStatus,
} from '../../database/enums.js';
import type { EngineContext } from './check.js';
import type { SnapshotInstructor } from './types.js';

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
  const prefix = `${year}-`;
  const items: MaintenanceItem[] = [];
  for (const type of ctx.snapshot.certificateTypes.values()) {
    if (type.maintenanceMinPerYear === null || !held.has(type.id)) continue;
    const qualifying = new Set(type.maintenanceCourseTypeIds);
    let taught = 0;
    for (const course of ctx.snapshot.courses.values()) {
      if (
        !qualifying.has(course.courseTypeId) ||
        course.status === CourseStatus.Cancelled
      ) {
        continue;
      }
      const first = course.days.map((d) => d.heldOn).sort()[0];
      if (!first?.startsWith(prefix)) continue;
      const leads = course.assignments.some(
        (a) =>
          a.instructorId === instructor.id &&
          a.role === AssignmentRole.Lead &&
          (a.status === AssignmentStatus.Confirmed ||
            a.status === AssignmentStatus.Proposed),
      );
      if (leads) taught++;
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
