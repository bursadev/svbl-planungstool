import { Injectable } from '@nestjs/common';
import { DataSource, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Apprentice } from '../apprentices/apprentice.entity.js';
import { SchoolClassDay } from '../apprentices/school-class-day.entity.js';
import { SchoolClass } from '../apprentices/school-class.entity.js';
import { VocationalSchool } from '../apprentices/vocational-school.entity.js';
import { CourseTypeCertificate } from '../courses/course-type-certificate.entity.js';
import { CourseTypeDevice } from '../courses/course-type-device.entity.js';
import { CourseTypeSkill } from '../courses/course-type-skill.entity.js';
import { CourseType } from '../courses/course-type.entity.js';
import { Course } from '../courses/course.entity.js';
import { Cohort } from '../curriculum/cohort.entity.js';
import { CurriculumModulePrerequisite } from '../curriculum/curriculum-module-prerequisite.entity.js';
import { CurriculumModule } from '../curriculum/curriculum-module.entity.js';
import { TimeWindow } from '../curriculum/time-window.entity.js';
import { ApprenticeStatus } from '../database/enums.js';
import { DeviceMove } from '../devices/device-move.entity.js';
import { DeviceTypeQualification } from '../devices/device-type-qualification.entity.js';
import { DeviceType } from '../devices/device-type.entity.js';
import { Device } from '../devices/device.entity.js';
import { MaintenanceWindow } from '../devices/maintenance-window.entity.js';
import { Availability } from '../instructors/availability.entity.js';
import { CertificateTypeMaintenanceCourseType } from '../instructors/certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { InstructorCertificate } from '../instructors/instructor-certificate.entity.js';
import { InstructorSkill } from '../instructors/instructor-skill.entity.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { Location } from '../locations/location.entity.js';
import { Room } from '../locations/room.entity.js';
import { Setting } from '../system/setting.entity.js';
import { addDays, publicHolidays, schoolYearStart } from './engine/calendar.js';
import {
  DEFAULT_WEIGHTS,
  type EngineWeights,
  type IsoDate,
  type PlanningSnapshot,
  type SnapshotApprentice,
  type SnapshotClass,
  type SnapshotCourse,
  type SnapshotCourseType,
  type SnapshotInstructor,
} from './engine/types.js';

/** Setting key whose object overrides single keys of `DEFAULT_WEIGHTS`. */
export const WEIGHTS_SETTING = 'planning.weights';

function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = out.get(k);
    if (list) list.push(row);
    else out.set(k, [row]);
  }
  return out;
}

/**
 * Loads the `PlanningSnapshot` of a date range from the database in a
 * handful of bulk queries: the catalogue and master data completely, courses
 * of the calendar years the range touches (the maintenance rule counts per
 * year), availabilities around the range, active apprentices with the school
 * days of the range's school year (`includeApprentices: false` skips the
 * apprentice side for staffing checks of single courses).
 */
@Injectable()
export class SnapshotService {
  constructor(private readonly ds: DataSource) {}

  async load(
    range: { from: IsoDate; to: IsoDate },
    opts: { today?: IsoDate; includeApprentices?: boolean } = {},
  ): Promise<PlanningSnapshot> {
    const withApprentices = opts.includeApprentices ?? true;
    const today = opts.today ?? new Date().toISOString().slice(0, 10);
    const firstYear = Number(range.from.slice(0, 4));
    const lastYear = Number(range.to.slice(0, 4));
    const coursesFrom = `${firstYear}-01-01`;
    const coursesTo = `${lastYear}-12-31`;
    const schoolYear = schoolYearStart(range.from);
    const r = <T extends object>(entity: new () => T) =>
      this.ds.getRepository(entity);

    const [
      locations,
      rooms,
      courseTypes,
      typeSkills,
      typeCertificates,
      typeDevices,
      modules,
      prerequisites,
      cohorts,
      timeWindows,
      certificateTypes,
      maintenanceLinks,
      instructors,
      instructorSkills,
      instructorCertificates,
      availabilities,
      deviceTypes,
      deviceQualifications,
      devices,
      deviceMoves,
      maintenanceWindows,
      schools,
      classes,
      classDays,
      apprentices,
      weightsSetting,
    ] = await Promise.all([
      r(Location).find(),
      r(Room).find(),
      r(CourseType).find(),
      r(CourseTypeSkill).find(),
      r(CourseTypeCertificate).find(),
      r(CourseTypeDevice).find(),
      r(CurriculumModule).find(),
      r(CurriculumModulePrerequisite).find(),
      r(Cohort).find(),
      r(TimeWindow).find(),
      r(CertificateType).find(),
      r(CertificateTypeMaintenanceCourseType).find(),
      r(Instructor).find(),
      r(InstructorSkill).find(),
      r(InstructorCertificate).find(),
      r(Availability).find({
        where: {
          startsOn: LessThanOrEqual(addDays(range.to, 14)),
          endsOn: MoreThanOrEqual(addDays(range.from, -14)),
        },
      }),
      r(DeviceType).find(),
      r(DeviceTypeQualification).find(),
      r(Device).find(),
      r(DeviceMove).find(),
      r(MaintenanceWindow).find(),
      withApprentices ? r(VocationalSchool).find() : [],
      withApprentices ? r(SchoolClass).find() : [],
      withApprentices
        ? r(SchoolClassDay).find({
            where: { schoolYearStart: LessThanOrEqual(schoolYear) },
          })
        : [],
      withApprentices
        ? r(Apprentice).find({ where: { status: ApprenticeStatus.Active } })
        : [],
      r(Setting).findOneBy({ key: WEIGHTS_SETTING }),
    ]);

    // Courses of the calendar years, with days, assignments and enrollments.
    const courseIdRows: { course_id: string }[] = await this.ds.query(
      `SELECT DISTINCT course_id FROM course_day WHERE held_on BETWEEN $1 AND $2`,
      [coursesFrom, coursesTo],
    );
    const courseIds = courseIdRows.map((row) => row.course_id);
    const [courses, enrollmentRows, coveredRows] = await Promise.all([
      courseIds.length
        ? r(Course).find({
            where: { id: In(courseIds) },
            relations: { days: true, assignments: true },
          })
        : Promise.resolve([] as Course[]),
      courseIds.length
        ? (this.ds.query(
            `SELECT course_id, apprentice_id FROM enrollment
             WHERE status IN ('registered', 'confirmed') AND course_id = ANY($1)`,
            [courseIds],
          ) as Promise<{ course_id: string; apprentice_id: string }[]>)
        : Promise.resolve([]),
      withApprentices
        ? (this.ds.query(
            `SELECT DISTINCT e.apprentice_id, c.course_type_id
             FROM enrollment e JOIN course c ON c.id = e.course_id
             WHERE e.status IN ('registered', 'confirmed', 'attended') AND c.status <> 'cancelled'`,
          ) as Promise<{ apprentice_id: string; course_type_id: string }[]>)
        : Promise.resolve(
            [] as { apprentice_id: string; course_type_id: string }[],
          ),
    ]);

    const skillsOfType = groupBy(typeSkills, (x) => x.courseTypeId);
    const certificatesOfType = groupBy(typeCertificates, (x) => x.courseTypeId);
    const devicesOfType = groupBy(typeDevices, (x) => x.courseTypeId);
    const prerequisitesOf = groupBy(prerequisites, (x) => x.moduleId);
    const maintenanceOf = groupBy(maintenanceLinks, (x) => x.certificateTypeId);
    const skillsOfInstructor = groupBy(instructorSkills, (x) => x.instructorId);
    const certificatesOfInstructor = groupBy(
      instructorCertificates,
      (x) => x.instructorId,
    );
    const movesOf = groupBy(deviceMoves, (x) => x.deviceId);
    const maintenanceWindowsOf = groupBy(maintenanceWindows, (x) => x.deviceId);
    const enrolledOf = groupBy(enrollmentRows, (x) => x.course_id);
    const coveredOf = groupBy(coveredRows, (x) => x.apprentice_id);

    // School days: the requested school year, else the latest earlier year the class has.
    const daysOfClass = groupBy(classDays, (x) => x.schoolClassId);
    const blockedOf = (classId: string): number[] => {
      const days = daysOfClass.get(classId) ?? [];
      const years = days.map((d) => d.schoolYearStart);
      const year = years.includes(schoolYear)
        ? schoolYear
        : Math.max(...years, -1);
      return [
        ...new Set(
          days.filter((d) => d.schoolYearStart === year).map((d) => d.weekday),
        ),
      ].sort((a, b) => a - b);
    };

    const snapshotCourseTypes: SnapshotCourseType[] = courseTypes.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      kind: t.kind,
      track: t.track,
      durationDays: t.durationDays,
      maySpanWeeks: t.maySpanWeeks,
      weekdayRule: t.weekdayRule,
      languages: t.languages,
      minParticipants: t.minParticipants,
      maxParticipants: t.maxParticipants,
      requiredSkillIds: (skillsOfType.get(t.id) ?? []).map((x) => x.skillId),
      requiredCertificateTypeIds: (certificatesOfType.get(t.id) ?? []).map(
        (x) => x.certificateTypeId,
      ),
      requiredDevices: (devicesOfType.get(t.id) ?? []).map((x) => ({
        deviceTypeId: x.deviceTypeId,
        quantity: x.quantity,
      })),
    }));

    const snapshotInstructors: SnapshotInstructor[] = instructors.map((i) => ({
      id: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
      employmentType: i.employmentType,
      homeLocationId: i.homeLocationId,
      languages: i.languages,
      status: i.status,
      preferredLocationIds: i.preferences?.preferredLocationIds ?? [],
      avoidInstructorIds: i.preferences?.avoidInstructorIds ?? [],
      skillIds: (skillsOfInstructor.get(i.id) ?? []).map((x) => x.skillId),
      certificates: (certificatesOfInstructor.get(i.id) ?? []).map((c) => ({
        certificateTypeId: c.certificateTypeId,
        validUntil: c.validUntil,
      })),
    }));

    const snapshotCourses: SnapshotCourse[] = courses.map((c) => {
      const enrolled = enrolledOf.get(c.id) ?? [];
      return {
        id: c.id,
        courseTypeId: c.courseTypeId,
        locationId: c.locationId,
        language: c.language,
        cohortId: c.cohortId,
        status: c.status,
        capacity: c.capacity,
        booked: enrolled.length,
        planningRunId: c.planningRunId,
        days: [...c.days]
          .sort((a, b) => a.heldOn.localeCompare(b.heldOn))
          .map((d) => ({
            id: d.id,
            heldOn: d.heldOn,
            roomId: d.roomId,
            locationId: d.locationId,
          })),
        assignments: c.assignments.map((a) => ({
          id: a.id,
          instructorId: a.instructorId,
          role: a.role,
          status: a.status,
        })),
        enrolledApprenticeIds: enrolled.map((e) => e.apprentice_id),
      };
    });

    const snapshotClasses: SnapshotClass[] = classes.map((k) => ({
      id: k.id,
      schoolId: k.vocationalSchoolId,
      code: k.code,
      blockedWeekdays: blockedOf(k.id),
    }));

    const snapshotApprentices: SnapshotApprentice[] = apprentices.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      cohortId: a.cohortId,
      track: a.track,
      language: a.language,
      schoolId: a.vocationalSchoolId,
      schoolClassId: a.schoolClassId,
      trainingCompanyId: a.trainingCompanyId,
      status: a.status,
      coveredCourseTypeIds: (coveredOf.get(a.id) ?? []).map(
        (x) => x.course_type_id,
      ),
    }));

    const holidays = new Set<IsoDate>();
    for (let year = firstYear; year <= lastYear; year++) {
      for (const day of publicHolidays(year)) holidays.add(day);
    }

    return {
      asOf: today,
      schoolYearStart: schoolYear,
      locations: byId(
        locations.map((l) => ({
          id: l.id,
          code: l.code,
          name: l.name,
          languageRegion: l.languageRegion,
          hostsUk: l.hostsUk,
          parallelCourseCapacity: l.parallelCourseCapacity,
          active: l.active,
        })),
      ),
      rooms: byId(
        rooms.map((room) => ({
          id: room.id,
          locationId: room.locationId,
          name: room.name,
          kind: room.kind,
          capacity: room.capacity,
          active: room.active,
        })),
      ),
      courseTypes: byId(snapshotCourseTypes),
      modules: byId(
        modules.map((m) => ({
          id: m.id,
          track: m.track,
          courseTypeId: m.courseTypeId,
          semester: m.semester,
          sequence: m.sequence,
          active: m.active,
          prerequisiteModuleIds: (prerequisitesOf.get(m.id) ?? []).map(
            (p) => p.prerequisiteModuleId,
          ),
        })),
      ),
      cohorts: byId(
        cohorts.map((c) => ({
          id: c.id,
          track: c.track,
          startYear: c.startYear,
          label: c.label,
        })),
      ),
      timeWindows: timeWindows.map((w) => ({
        id: w.id,
        curriculumModuleId: w.curriculumModuleId,
        cohortId: w.cohortId,
        locationId: w.locationId,
        startsOn: w.startsOn,
        endsOn: w.endsOn,
      })),
      certificateTypes: byId(
        certificateTypes.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          maintenanceMinPerYear: t.maintenanceMinPerYear,
          maintenanceCourseTypeIds: (maintenanceOf.get(t.id) ?? []).map(
            (x) => x.courseTypeId,
          ),
        })),
      ),
      instructors: byId(snapshotInstructors),
      availabilities: availabilities.map((a) => ({
        instructorId: a.instructorId,
        startsOn: a.startsOn,
        endsOn: a.endsOn,
        kind: a.kind,
        status: a.status,
      })),
      deviceTypes: byId(
        deviceTypes.map((t) => ({ id: t.id, code: t.code, name: t.name })),
      ),
      deviceQualifications: deviceQualifications.map((q) => ({
        deviceTypeId: q.deviceTypeId,
        certificateTypeId: q.certificateTypeId,
        skillId: q.skillId,
      })),
      devices: byId(
        devices.map((d) => ({
          id: d.id,
          deviceTypeId: d.deviceTypeId,
          homeLocationId: d.homeLocationId,
          mobility: d.mobility,
          status: d.status,
          rentalFrom: d.rentalFrom,
          rentalUntil: d.rentalUntil,
          moves: (movesOf.get(d.id) ?? []).map((m) => ({
            effectiveOn: m.effectiveOn,
            toLocationId: m.toLocationId,
          })),
          maintenance: (maintenanceWindowsOf.get(d.id) ?? []).map((m) => ({
            startsOn: m.startsOn,
            endsOn: m.endsOn,
          })),
        })),
      ),
      courses: byId(snapshotCourses),
      schools: byId(
        schools.map((s) => ({
          id: s.id,
          name: s.shortName,
          nearestLocationId: s.nearestLocationId,
          language: s.language,
        })),
      ),
      classes: byId(snapshotClasses),
      apprentices: byId(snapshotApprentices),
      weights: mergeWeights(weightsSetting?.value),
      holidays,
    };
  }
}

/** `DEFAULT_WEIGHTS` with the numeric keys of the setting's object on top. */
export function mergeWeights(value: unknown): EngineWeights {
  const weights: EngineWeights = { ...DEFAULT_WEIGHTS };
  if (value && typeof value === 'object') {
    for (const key of Object.keys(DEFAULT_WEIGHTS) as (keyof EngineWeights)[]) {
      const v = (value as Record<string, unknown>)[key];
      if (typeof v === 'number' && Number.isFinite(v)) weights[key] = v;
    }
  }
  return weights;
}
