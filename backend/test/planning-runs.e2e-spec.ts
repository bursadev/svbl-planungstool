import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { Apprentice } from '../src/apprentices/apprentice.entity.js';
import { SchoolClassDay } from '../src/apprentices/school-class-day.entity.js';
import { SchoolClass } from '../src/apprentices/school-class.entity.js';
import { VocationalSchool } from '../src/apprentices/vocational-school.entity.js';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Cohort } from '../src/curriculum/cohort.entity.js';
import { CurriculumModule } from '../src/curriculum/curriculum-module.entity.js';
import { Instructor } from '../src/instructors/instructor.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { Room } from '../src/locations/room.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2ER and plans the
// school year 2087/88, where no real cohort is in training.
const PERIOD = { periodStartsOn: '2087-08-01', periodEndsOn: '2088-01-31' };

describe('Planning runs (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  const ids: Record<string, string> = {};
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    ids.location = (
      await ds.getRepository(Location).save({
        code: 'E2ER-LOC',
        name: 'E2ER Ort',
        kind: 'training_centre',
        languageRegion: 'de',
        hostsUk: true,
        parallelCourseCapacity: 2,
      })
    ).id;
    ids.room = (
      await ds.getRepository(Room).save({
        locationId: ids.location,
        name: 'E2ER Raum',
        kind: 'theory',
        capacity: 12,
      })
    ).id;
    ids.courseType = (
      await ds.getRepository(CourseType).save({
        code: 'E2ER-UK',
        name: 'E2ER Kurs',
        kind: 'uk',
        track: 'efz',
        durationDays: 1,
        languages: ['de'],
        maxParticipants: 2,
      })
    ).id;
    ids.cohort = (
      await ds
        .getRepository(Cohort)
        .save({ track: 'efz', startYear: 2087, label: 'E2ER 2087 EFZ' })
    ).id;
    ids.module = (
      await ds.getRepository(CurriculumModule).save({
        track: 'efz',
        courseTypeId: ids.courseType,
        semester: 1,
        sequence: 9902,
      })
    ).id;
    ids.school = (
      await ds.getRepository(VocationalSchool).save({
        name: 'E2ER Berufsschule',
        shortName: 'E2ER-BS',
        language: 'de',
        nearestLocationId: ids.location,
      })
    ).id;
    ids.class = (
      await ds.getRepository(SchoolClass).save({
        vocationalSchoolId: ids.school,
        code: 'E2ER-K1',
        track: 'efz',
        startYear: 2087,
      })
    ).id;
    await ds
      .getRepository(SchoolClassDay)
      .insert({ schoolClassId: ids.class, schoolYearStart: 2087, weekday: 2 });
    const apprentices = ds.getRepository(Apprentice);
    const apprentice = (firstName: string, schoolClassId: string | null) =>
      apprentices.save({
        firstName,
        lastName: 'E2ER Lernende',
        birthDate: '2070-01-01',
        language: 'de',
        track: 'efz',
        cohortId: ids.cohort,
        vocationalSchoolId: ids.school,
        schoolClassId,
      });
    ids.a1 = (await apprentice('Anna', ids.class)).id;
    ids.a2 = (await apprentice('Beat', ids.class)).id;
    ids.a3 = (await apprentice('Cem', null)).id;
    ids.instructor = (
      await ds.getRepository(Instructor).save({
        firstName: 'Ida',
        lastName: 'E2ER Lehrer',
        employmentType: 'employee',
        homeLocationId: ids.location,
        languages: ['de'],
      })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "course" WHERE planning_run_id IN (SELECT id FROM "planning_run" WHERE label LIKE 'E2ER%' OR label = 'Herbstsemester 2087')`,
    );
    await ds.query(
      `DELETE FROM "planning_run" WHERE label LIKE 'E2ER%' OR label = 'Herbstsemester 2087'`,
    );
    await ds.query(
      `DELETE FROM "audit_entry" WHERE entity_type = 'planning_run' AND summary LIKE '%2087%'`,
    );
    await ds.query(
      `DELETE FROM "course" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code = 'E2ER-UK')`,
    );
    await ds.query(
      `DELETE FROM "apprentice" WHERE last_name = 'E2ER Lernende'`,
    );
    await ds.query(`DELETE FROM "school_class" WHERE code = 'E2ER-K1'`);
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name = 'E2ER-BS'`,
    );
    await ds.query(`DELETE FROM "curriculum_module" WHERE sequence = 9902`);
    await ds.query(`DELETE FROM "cohort" WHERE label = 'E2ER 2087 EFZ'`);
    await ds.query(`DELETE FROM "instructor" WHERE last_name = 'E2ER Lehrer'`);
    await ds.query(`DELETE FROM "course_type" WHERE code = 'E2ER-UK'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2ER-LOC'`);
  }

  it('creates a run with its readiness, lists it and discards it', async () => {
    await api()
      .post('/planning-runs')
      .set(asInstructor)
      .send(PERIOD)
      .expect(403);
    await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send({ periodStartsOn: '2088-01-31', periodEndsOn: '2087-08-01' })
      .expect(400);
    await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send({ periodStartsOn: '2087-08-01', periodEndsOn: '2089-01-31' })
      .expect(400);

    const created = await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send(PERIOD)
      .expect(201);
    expect(created.body).toMatchObject({
      label: 'Herbstsemester 2087',
      periodStartsOn: '2087-08-01',
      periodEndsOn: '2088-01-31',
      stage: 'demand',
      status: 'draft',
      committedAt: null,
      demandSummary: null,
      counts: {
        demandGroups: 0,
        apprentices: 0,
        coursesNeeded: 0,
        coursesProposed: 0,
        coursesStaffed: 0,
      },
    });
    expect(created.body.readiness.items).toHaveLength(10);
    const rule = (name: string) =>
      created.body.readiness.items.find(
        (i: { rule: string }) => i.rule === name,
      );
    // The real curriculum has more semester-1 modules; ours is among the ones without a window.
    expect(rule('time_windows').status).toBe('warning');
    expect(rule('time_windows').details).toContain('E2ER-UK · E2ER 2087 EFZ');
    expect(rule('school_days')).toMatchObject({ status: 'warning', count: 1 });
    expect(rule('uk_locations')).toMatchObject({ status: 'ok' });
    ids.run = created.body.id;

    const duplicate = await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send(PERIOD)
      .expect(409);
    expect(duplicate.body.message).toContain('Herbstsemester 2087');

    const list = await api()
      .get('/planning-runs')
      .set(asInstructor)
      .expect(200);
    expect(list.body.map((r: { id: string }) => r.id)).toContain(ids.run);
    const one = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(one.body.createdBy).toBe('Test planner');

    const overview = await api()
      .get('/planning/overview')
      .set(asPlanner)
      .expect(200);
    expect(overview.body).toEqual({
      activeApprentices: expect.any(Number),
      apprenticesWithoutFutureUk: expect.any(Number),
      unstaffedCourses: expect.any(Number),
      modulesWithoutTimeWindow: expect.any(Number),
    });
    expect(overview.body.apprenticesWithoutFutureUk).toBeGreaterThanOrEqual(3);
    // Stage 1: demand. The E2ER cohort is in semester 1, so the real semester-1 modules appear too.
    await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asInstructor)
      .expect(403);
    const demand = await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asPlanner)
      .expect(200);
    const ours = demand.body.filter(
      (d: { module: { code: string } }) => d.module.code === 'E2ER-UK',
    );
    expect(ours).toHaveLength(1);
    expect(ours[0]).toMatchObject({
      cohort: { label: 'E2ER 2087 EFZ' },
      module: { code: 'E2ER-UK', semester: 1, durationDays: 1 },
      location: { code: 'E2ER-LOC' },
      language: 'de',
      schoolWeekday: 2,
      blockedWeekdays: [2],
      window: {
        startsOn: '2087-08-01',
        endsOn: '2088-01-31',
        fromTimeWindow: false,
      },
      participantCount: 3,
      memberCount: 3,
      existingFreeSeats: 0,
      coursesNeeded: 2,
    });
    expect(ours[0].note).toContain('Schultag-Gruppen zusammengelegt');
    const afterDemand = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(afterDemand.body.stage).toBe('demand');
    expect(afterDemand.body.demandSummary).toMatchObject({
      catchUps: 0,
      apprenticesWithoutClass: 1,
    });
    expect(afterDemand.body.counts.apprentices).toBe(3);
    expect(afterDemand.body.counts.demandGroups).toBeGreaterThanOrEqual(1);
    const listed = await api()
      .get(`/planning-runs/${ids.run}/demand`)
      .set(asInstructor)
      .expect(200);
    expect(listed.body.map((d: { id: string }) => d.id)).toContain(ours[0].id);
    const again = await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asPlanner)
      .expect(200);
    expect(again.body.map((d: { id: string }) => d.id)).not.toContain(
      ours[0].id,
    );

    await api()
      .delete(`/planning-runs/${ids.run}`)
      .set(asInstructor)
      .expect(403);
    await api().delete(`/planning-runs/${ids.run}`).set(asPlanner).expect(204);
    await api().get(`/planning-runs/${ids.run}`).set(asPlanner).expect(404);
    await api().delete(`/planning-runs/${ids.run}`).set(asPlanner).expect(404);
  });
});
