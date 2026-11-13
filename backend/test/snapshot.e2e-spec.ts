import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { Apprentice } from '../src/apprentices/apprentice.entity.js';
import { Enrollment } from '../src/apprentices/enrollment.entity.js';
import { SchoolClassDay } from '../src/apprentices/school-class-day.entity.js';
import { SchoolClass } from '../src/apprentices/school-class.entity.js';
import { VocationalSchool } from '../src/apprentices/vocational-school.entity.js';
import { Assignment } from '../src/courses/assignment.entity.js';
import { CourseDay } from '../src/courses/course-day.entity.js';
import { CourseTypeCertificate } from '../src/courses/course-type-certificate.entity.js';
import { CourseTypeSkill } from '../src/courses/course-type-skill.entity.js';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Course } from '../src/courses/course.entity.js';
import { Cohort } from '../src/curriculum/cohort.entity.js';
import { CurriculumModule } from '../src/curriculum/curriculum-module.entity.js';
import { CertificateTypeMaintenanceCourseType } from '../src/instructors/certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from '../src/instructors/certificate-type.entity.js';
import { InstructorCertificate } from '../src/instructors/instructor-certificate.entity.js';
import { InstructorSkill } from '../src/instructors/instructor-skill.entity.js';
import { Instructor } from '../src/instructors/instructor.entity.js';
import { Skill } from '../src/instructors/skill.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { Room } from '../src/locations/room.entity.js';
import {
  SnapshotService,
  WEIGHTS_SETTING,
} from '../src/planning/snapshot.service.js';
import { Setting } from '../src/system/setting.entity.js';
import { createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2EP.
describe('Planning snapshot (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let snapshots: SnapshotService;
  const ids: Record<string, string> = {};
  let previousWeights: unknown = undefined;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    snapshots = app.get(SnapshotService);
    await cleanup();

    const location = await ds.getRepository(Location).save({
      code: 'E2EP-LOC',
      name: 'E2EP Ort',
      kind: 'training_centre',
      languageRegion: 'de',
      hostsUk: true,
      parallelCourseCapacity: 3,
    });
    ids.location = location.id;
    ids.room = (
      await ds
        .getRepository(Room)
        .save({
          locationId: location.id,
          name: 'E2EP Raum',
          kind: 'theory',
          capacity: 12,
        })
    ).id;
    ids.skill = (await ds.getRepository(Skill).save({ name: 'E2EP Skill' })).id;
    ids.certificateType = (
      await ds
        .getRepository(CertificateType)
        .save({
          code: 'E2EP-CT',
          name: 'E2EP Zertifikat',
          validityYears: 5,
          maintenanceMinPerYear: 2,
        })
    ).id;
    ids.courseType = (
      await ds.getRepository(CourseType).save({
        code: 'E2EP-UK',
        name: 'E2EP Kurs',
        kind: 'uk',
        track: 'efz',
        durationDays: 2,
        languages: ['de'],
        maxParticipants: 12,
      })
    ).id;
    await ds
      .getRepository(CourseTypeSkill)
      .insert({ courseTypeId: ids.courseType, skillId: ids.skill });
    await ds
      .getRepository(CourseTypeCertificate)
      .insert({
        courseTypeId: ids.courseType,
        certificateTypeId: ids.certificateType,
      });
    await ds
      .getRepository(CertificateTypeMaintenanceCourseType)
      .insert({
        certificateTypeId: ids.certificateType,
        courseTypeId: ids.courseType,
      });
    ids.cohort = (
      await ds
        .getRepository(Cohort)
        .save({ track: 'efz', startYear: 2088, label: 'E2EP 2088 EFZ' })
    ).id;
    ids.module = (
      await ds
        .getRepository(CurriculumModule)
        .save({
          track: 'efz',
          courseTypeId: ids.courseType,
          semester: 4,
          sequence: 9901,
        })
    ).id;
    ids.school = (
      await ds.getRepository(VocationalSchool).save({
        name: 'E2EP Berufsschule',
        shortName: 'E2EP-BS',
        language: 'de',
        nearestLocationId: location.id,
      })
    ).id;
    ids.class = (
      await ds
        .getRepository(SchoolClass)
        .save({
          vocationalSchoolId: ids.school,
          code: 'E2EP-K1',
          track: 'efz',
          startYear: 2088,
        })
    ).id;
    await ds
      .getRepository(SchoolClassDay)
      .insert({ schoolClassId: ids.class, schoolYearStart: 2026, weekday: 2 });
    await ds
      .getRepository(SchoolClassDay)
      .insert({ schoolClassId: ids.class, schoolYearStart: 2025, weekday: 4 });
    const apprentice = (first: string, schoolClassId: string | null) =>
      ds.getRepository(Apprentice).save({
        firstName: first,
        lastName: 'E2EP Lernende',
        birthDate: '2009-05-05',
        language: 'de',
        track: 'efz',
        cohortId: ids.cohort,
        vocationalSchoolId: ids.school,
        schoolClassId,
      });
    ids.apprenticeA = (await apprentice('Anna', ids.class)).id;
    ids.apprenticeB = (await apprentice('Ben', null)).id;
    ids.instructor = (
      await ds.getRepository(Instructor).save({
        firstName: 'Ida',
        lastName: 'E2EP Lehrer',
        employmentType: 'employee',
        homeLocationId: location.id,
        languages: ['de'],
        preferences: { preferredLocationIds: [location.id] },
      })
    ).id;
    await ds
      .getRepository(InstructorSkill)
      .insert({ instructorId: ids.instructor, skillId: ids.skill });
    await ds.getRepository(InstructorCertificate).insert({
      instructorId: ids.instructor,
      certificateTypeId: ids.certificateType,
      issuedOn: '2024-01-15',
      validUntil: '2029-01-15',
    });
    ids.course = (
      await ds.getRepository(Course).save({
        courseTypeId: ids.courseType,
        locationId: location.id,
        language: 'de',
        cohortId: ids.cohort,
        capacity: 12,
      })
    ).id;
    await ds.getRepository(CourseDay).insert([
      {
        courseId: ids.course,
        heldOn: '2027-03-03',
        startsAt: '08:15',
        endsAt: '16:45',
        sequence: 2,
        roomId: ids.room,
      },
      {
        courseId: ids.course,
        heldOn: '2027-03-02',
        startsAt: '08:15',
        endsAt: '16:45',
        sequence: 1,
        roomId: ids.room,
      },
    ]);
    await ds
      .getRepository(Assignment)
      .insert({
        courseId: ids.course,
        instructorId: ids.instructor,
        status: 'confirmed',
      });
    await ds
      .getRepository(Enrollment)
      .insert({ courseId: ids.course, apprenticeId: ids.apprenticeA });

    const settings = ds.getRepository(Setting);
    previousWeights = (await settings.findOneBy({ key: WEIGHTS_SETTING }))
      ?.value;
    await settings.upsert(
      { key: WEIGHTS_SETTING, value: { homeLocation: 40, nonsense: 'x' } },
      ['key'],
    );
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    const settings = ds.getRepository(Setting);
    if (previousWeights === undefined)
      await settings.delete({ key: WEIGHTS_SETTING });
    else
      await settings.upsert(
        { key: WEIGHTS_SETTING, value: previousWeights as object },
        ['key'],
      );
    await ds.query(
      `DELETE FROM "course" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code = 'E2EP-UK')`,
    );
    await ds.query(
      `DELETE FROM "apprentice" WHERE last_name = 'E2EP Lernende'`,
    );
    await ds.query(`DELETE FROM "school_class" WHERE code = 'E2EP-K1'`);
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name = 'E2EP-BS'`,
    );
    await ds.query(`DELETE FROM "curriculum_module" WHERE sequence = 9901`);
    await ds.query(`DELETE FROM "cohort" WHERE label = 'E2EP 2088 EFZ'`);
    await ds.query(`DELETE FROM "instructor" WHERE last_name = 'E2EP Lehrer'`);
    await ds.query(`DELETE FROM "course_type" WHERE code = 'E2EP-UK'`);
    await ds.query(`DELETE FROM "certificate_type" WHERE code = 'E2EP-CT'`);
    await ds.query(`DELETE FROM "skill" WHERE name = 'E2EP Skill'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2EP-LOC'`);
  }

  it('loads the world of a period with the derived fields', async () => {
    const s = await snapshots.load(
      { from: '2027-02-01', to: '2027-07-31' },
      { today: '2026-11-13' },
    );

    expect(s.asOf).toBe('2026-11-13');
    expect(s.schoolYearStart).toBe(2026);
    expect(s.locations.get(ids.location)).toMatchObject({
      code: 'E2EP-LOC',
      hostsUk: true,
      parallelCourseCapacity: 3,
    });
    expect(s.rooms.get(ids.room)).toMatchObject({
      locationId: ids.location,
      kind: 'theory',
      capacity: 12,
    });
    expect(s.courseTypes.get(ids.courseType)).toMatchObject({
      code: 'E2EP-UK',
      durationDays: 2,
      requiredSkillIds: [ids.skill],
      requiredCertificateTypeIds: [ids.certificateType],
      requiredDevices: [],
    });
    expect(s.modules.get(ids.module)).toMatchObject({
      courseTypeId: ids.courseType,
      semester: 4,
      prerequisiteModuleIds: [],
    });
    expect(s.cohorts.get(ids.cohort)).toMatchObject({
      startYear: 2088,
      label: 'E2EP 2088 EFZ',
    });
    expect(s.certificateTypes.get(ids.certificateType)).toMatchObject({
      maintenanceMinPerYear: 2,
      maintenanceCourseTypeIds: [ids.courseType],
    });
    expect(s.schools.get(ids.school)).toMatchObject({
      name: 'E2EP-BS',
      nearestLocationId: ids.location,
    });
    expect(s.classes.get(ids.class)).toMatchObject({
      schoolId: ids.school,
      blockedWeekdays: [2],
    });

    expect(s.apprentices.get(ids.apprenticeA)).toMatchObject({
      schoolClassId: ids.class,
      coveredCourseTypeIds: [ids.courseType],
    });
    expect(s.apprentices.get(ids.apprenticeB)).toMatchObject({
      schoolClassId: null,
      coveredCourseTypeIds: [],
    });

    expect(s.instructors.get(ids.instructor)).toMatchObject({
      lastName: 'E2EP Lehrer',
      preferredLocationIds: [ids.location],
      skillIds: [ids.skill],
      certificates: [
        { certificateTypeId: ids.certificateType, validUntil: '2029-01-15' },
      ],
    });

    const course = s.courses.get(ids.course);
    expect(course).toMatchObject({
      booked: 1,
      enrolledApprenticeIds: [ids.apprenticeA],
      cohortId: ids.cohort,
    });
    expect(course?.days.map((d) => d.heldOn)).toEqual([
      '2027-03-02',
      '2027-03-03',
    ]);
    expect(course?.assignments).toEqual([
      expect.objectContaining({
        instructorId: ids.instructor,
        status: 'confirmed',
        role: 'lead',
      }),
    ]);

    expect(s.weights).toMatchObject({
      homeLocation: 40,
      sameRegion: 12,
      base: 50,
    });
    expect(s.holidays.has('2027-08-01')).toBe(true);
    expect(s.holidays.has('2027-03-29')).toBe(true);
  });

  it('falls back to the latest earlier school year for the school days', async () => {
    const s = await snapshots.load(
      { from: '2024-08-01', to: '2025-01-31' },
      { today: '2026-11-13' },
    );
    // School year 2024 has no days for the class; nothing earlier exists either.
    expect(s.classes.get(ids.class)?.blockedWeekdays).toEqual([]);
    const later = await snapshots.load(
      { from: '2027-08-01', to: '2028-01-31' },
      { today: '2026-11-13' },
    );
    expect(later.classes.get(ids.class)?.blockedWeekdays).toEqual([2]);
  });
});
