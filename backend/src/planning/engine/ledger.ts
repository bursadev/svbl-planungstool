import { AssignmentStatus, CourseStatus } from '../../database/enums.js';
import type { IsoDate, PlanningSnapshot, SnapshotCourseType } from './types.js';

export interface LedgerDay {
  heldOn: IsoDate;
  locationId: string;
  roomId: string | null;
}

/** What a course occupies: its days (with location and room), its instructors and its apprentices. */
export interface LedgerCourse {
  id: string;
  courseTypeId: string;
  days: LedgerDay[];
  instructorIds: string[];
  apprenticeIds: string[];
}

type DayMap<V> = Map<string, Map<IsoDate, V>>;

function cell<V>(map: DayMap<V>, key: string): Map<IsoDate, V> {
  let inner = map.get(key);
  if (!inner) {
    inner = new Map();
    map.set(key, inner);
  }
  return inner;
}

function copyDayMap<V>(map: DayMap<V>, copyValue: (v: V) => V): DayMap<V> {
  const out: DayMap<V> = new Map();
  for (const [key, inner] of map) {
    out.set(key, new Map([...inner].map(([d, v]) => [d, copyValue(v)])));
  }
  return out;
}

const ACTIVE_ASSIGNMENT = new Set<AssignmentStatus>([
  AssignmentStatus.Proposed,
  AssignmentStatus.Confirmed,
]);

/**
 * Bookings per (instructor, date), (location, date), (room, date),
 * (location, device type, date) and (apprentice, date). The engine checks
 * against it and books its own proposals into it, so courses of one run
 * never collide with each other or with the existing plan.
 */
export class Ledger {
  private instructorDays: DayMap<string> = new Map();
  private roomDays: DayMap<string> = new Map();
  private apprenticeDays: DayMap<string> = new Map();
  private locationDays: DayMap<Set<string>> = new Map();
  private deviceDays: DayMap<number> = new Map();
  private courses = new Map<string, LedgerCourse>();

  constructor(
    private readonly courseTypes: ReadonlyMap<string, SnapshotCourseType>,
  ) {}

  /** Books every course that is not cancelled or done; `exclude` leaves out ids (the course being re-planned). */
  static fromSnapshot(
    snapshot: PlanningSnapshot,
    opts: { exclude?: ReadonlySet<string> } = {},
  ): Ledger {
    const ledger = new Ledger(snapshot.courseTypes);
    for (const course of snapshot.courses.values()) {
      if (opts.exclude?.has(course.id)) continue;
      if (
        course.status === CourseStatus.Cancelled ||
        course.status === CourseStatus.Done
      ) {
        continue;
      }
      ledger.bookCourse({
        id: course.id,
        courseTypeId: course.courseTypeId,
        days: course.days.map((day) => ({
          heldOn: day.heldOn,
          locationId: day.locationId ?? course.locationId,
          roomId: day.roomId,
        })),
        instructorIds: course.assignments
          .filter((a) => ACTIVE_ASSIGNMENT.has(a.status))
          .map((a) => a.instructorId),
        apprenticeIds: course.enrolledApprenticeIds,
      });
    }
    return ledger;
  }

  clone(): Ledger {
    const copy = new Ledger(this.courseTypes);
    copy.instructorDays = copyDayMap(this.instructorDays, (v) => v);
    copy.roomDays = copyDayMap(this.roomDays, (v) => v);
    copy.apprenticeDays = copyDayMap(this.apprenticeDays, (v) => v);
    copy.locationDays = copyDayMap(this.locationDays, (v) => new Set(v));
    copy.deviceDays = copyDayMap(this.deviceDays, (v) => v);
    copy.courses = new Map(this.courses);
    return copy;
  }

  bookCourse(course: LedgerCourse): void {
    this.courses.set(course.id, course);
    const devices =
      this.courseTypes.get(course.courseTypeId)?.requiredDevices ?? [];
    for (const day of course.days) {
      cell(this.locationDays, day.locationId).get(day.heldOn)?.add(course.id) ??
        cell(this.locationDays, day.locationId).set(
          day.heldOn,
          new Set([course.id]),
        );
      if (day.roomId)
        cell(this.roomDays, day.roomId).set(day.heldOn, course.id);
      for (const { deviceTypeId, quantity } of devices) {
        const key = `${day.locationId}|${deviceTypeId}`;
        const used = cell(this.deviceDays, key);
        used.set(day.heldOn, (used.get(day.heldOn) ?? 0) + quantity);
      }
    }
    const dates = course.days.map((day) => day.heldOn);
    for (const instructorId of course.instructorIds) {
      this.bookInstructor(instructorId, dates, course.id);
    }
    this.bookApprentices(course.apprenticeIds, dates, course.id);
  }

  releaseCourse(courseId: string): void {
    const course = this.courses.get(courseId);
    if (!course) return;
    const devices =
      this.courseTypes.get(course.courseTypeId)?.requiredDevices ?? [];
    for (const day of course.days) {
      this.locationDays.get(day.locationId)?.get(day.heldOn)?.delete(courseId);
      if (
        day.roomId &&
        this.roomDays.get(day.roomId)?.get(day.heldOn) === courseId
      ) {
        this.roomDays.get(day.roomId)?.delete(day.heldOn);
      }
      for (const { deviceTypeId, quantity } of devices) {
        const used = this.deviceDays.get(`${day.locationId}|${deviceTypeId}`);
        if (used)
          used.set(
            day.heldOn,
            Math.max(0, (used.get(day.heldOn) ?? 0) - quantity),
          );
      }
    }
    for (const instructorId of course.instructorIds) {
      this.releaseInstructor(instructorId, courseId);
    }
    for (const apprenticeId of course.apprenticeIds) {
      this.releaseApprentice(apprenticeId, courseId);
    }
    this.courses.delete(courseId);
  }

  bookInstructor(
    instructorId: string,
    dates: IsoDate[],
    courseId: string,
  ): void {
    const days = cell(this.instructorDays, instructorId);
    for (const date of dates) days.set(date, courseId);
  }

  releaseInstructor(instructorId: string, courseId: string): void {
    const days = this.instructorDays.get(instructorId);
    if (!days) return;
    for (const [date, id] of days) if (id === courseId) days.delete(date);
  }

  /** The course that occupies the instructor on that date, or null. */
  instructorBusyOn(instructorId: string, date: IsoDate): string | null {
    return this.instructorDays.get(instructorId)?.get(date) ?? null;
  }

  /** Number of courses with a day at the location on that date. */
  locationLoad(locationId: string, date: IsoDate): number {
    return this.locationDays.get(locationId)?.get(date)?.size ?? 0;
  }

  roomBusyOn(roomId: string, date: IsoDate): string | null {
    return this.roomDays.get(roomId)?.get(date) ?? null;
  }

  /** Devices of a type booked at the location on that date (sum of the course types' quantities). */
  deviceUse(locationId: string, deviceTypeId: string, date: IsoDate): number {
    return this.deviceDays.get(`${locationId}|${deviceTypeId}`)?.get(date) ?? 0;
  }

  bookApprentices(
    apprenticeIds: string[],
    dates: IsoDate[],
    courseId: string,
  ): void {
    for (const apprenticeId of apprenticeIds) {
      const days = cell(this.apprenticeDays, apprenticeId);
      for (const date of dates) days.set(date, courseId);
    }
  }

  releaseApprentice(apprenticeId: string, courseId: string): void {
    const days = this.apprenticeDays.get(apprenticeId);
    if (!days) return;
    for (const [date, id] of days) if (id === courseId) days.delete(date);
  }

  apprenticeBusyOn(apprenticeId: string, date: IsoDate): string | null {
    return this.apprenticeDays.get(apprenticeId)?.get(date) ?? null;
  }
}
