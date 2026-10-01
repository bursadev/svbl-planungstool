import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2EB.
describe('Curriculum (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let efz1: string;
  let efz2: string;
  let eba1: string;
  let locationId: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    const types = ds.getRepository(CourseType);
    const mk = (code: string, track: 'efz' | 'eba') =>
      types.save({
        code,
        name: code,
        kind: 'uk',
        track,
        durationDays: 2,
        languages: ['de'],
        maxParticipants: 12,
      });
    efz1 = (await mk('E2EB-1', 'efz')).id;
    efz2 = (await mk('E2EB-2', 'efz')).id;
    eba1 = (await mk('E2EB-3', 'eba')).id;
    locationId = (
      await ds.getRepository(Location).save({
        code: 'E2EB-LOC',
        name: 'E2EB Ort',
        kind: 'training_centre',
        languageRegion: 'de',
      })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "time_window" WHERE cohort_id IN (SELECT id FROM "cohort" WHERE label LIKE 'E2EB%')`,
    );
    await ds.query(
      `DELETE FROM "curriculum_module" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code LIKE 'E2EB-%')`,
    );
    await ds.query(`DELETE FROM "cohort" WHERE label LIKE 'E2EB%'`);
    await ds.query(`DELETE FROM "course_type" WHERE code LIKE 'E2EB-%'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2EB-LOC'`);
  }

  it('builds a curriculum with prerequisites, cohorts and time windows', async () => {
    await api()
      .post('/curriculum-modules')
      .set(asInstructor)
      .send({ track: 'efz', courseTypeId: efz1, semester: 1, sequence: 101 })
      .expect(403);

    const m1 = await api()
      .post('/curriculum-modules')
      .set(asPlanner)
      .send({ track: 'efz', courseTypeId: efz1, semester: 1, sequence: 101 })
      .expect(201);
    expect(m1.body).toMatchObject({
      track: 'efz',
      semester: 1,
      sequence: 101,
      active: true,
      courseType: { code: 'E2EB-1' },
      prerequisites: [],
    });

    const wrongTrack = await api()
      .post('/curriculum-modules')
      .set(asPlanner)
      .send({ track: 'efz', courseTypeId: eba1, semester: 1, sequence: 102 })
      .expect(400);
    expect(wrongTrack.body.message).toBe(
      'Der Kurstyp gehört nicht zu diesem Lehrgang.',
    );

    const m2 = await api()
      .post('/curriculum-modules')
      .set(asPlanner)
      .send({
        track: 'efz',
        courseTypeId: efz2,
        semester: 2,
        sequence: 102,
        prerequisiteModuleIds: [m1.body.id],
      })
      .expect(201);
    expect(m2.body.prerequisites).toEqual([
      { id: m1.body.id, code: 'E2EB-1', name: 'E2EB-1' },
    ]);

    const selfRef = await api()
      .patch(`/curriculum-modules/${m2.body.id}`)
      .set(asPlanner)
      .send({ prerequisiteModuleIds: [m2.body.id] })
      .expect(400);
    expect(selfRef.body.message).toBe(
      'Ein Modul kann nicht sich selbst voraussetzen.',
    );

    const semester7 = await api()
      .patch(`/curriculum-modules/${m2.body.id}`)
      .set(asPlanner)
      .send({ semester: 7 })
      .expect(400);
    expect(semester7.body.errors).toEqual([
      { field: 'semester', message: 'Wert ausserhalb des Bereichs.' },
    ]);

    const efzModules = await api()
      .get('/curriculum-modules?track=efz')
      .set(asInstructor)
      .expect(200);
    expect(efzModules.body.map((m: { id: string }) => m.id)).toEqual(
      expect.arrayContaining([m1.body.id, m2.body.id]),
    );

    // The course type now reports its curriculum slot.
    const type = await api()
      .get(`/course-types/${efz1}`)
      .set(asInstructor)
      .expect(200);
    expect(type.body.curriculumModule).toMatchObject({
      id: m1.body.id,
      track: 'efz',
      semester: 1,
    });

    const cohortEfz = await api()
      .post('/cohorts')
      .set(asPlanner)
      .send({
        track: 'efz',
        startYear: 2090,
        label: 'E2EB 2090 EFZ',
        expectedEndYear: 2093,
      })
      .expect(201);
    const cohortEba = await api()
      .post('/cohorts')
      .set(asPlanner)
      .send({ track: 'eba', startYear: 2090, label: 'E2EB 2090 EBA' })
      .expect(201);
    await api()
      .post('/cohorts')
      .set(asPlanner)
      .send({ track: 'efz', startYear: 2090, label: 'E2EB dup' })
      .expect(409);

    const window = await api()
      .post('/time-windows')
      .set(asPlanner)
      .send({
        curriculumModuleId: m1.body.id,
        cohortId: cohortEfz.body.id,
        startsOn: '2099-09-01',
        endsOn: '2099-11-30',
      })
      .expect(201);
    expect(window.body).toMatchObject({
      curriculumModule: { id: m1.body.id, courseType: { code: 'E2EB-1' } },
      cohort: { label: 'E2EB 2090 EFZ' },
      startsOn: '2099-09-01',
      endsOn: '2099-11-30',
      location: null,
    });

    const mismatch = await api()
      .post('/time-windows')
      .set(asPlanner)
      .send({
        curriculumModuleId: m1.body.id,
        cohortId: cohortEba.body.id,
        startsOn: '2099-09-01',
        endsOn: '2099-11-30',
      })
      .expect(400);
    expect(mismatch.body.message).toBe(
      'Modul und Jahrgang gehören nicht zum selben Lehrgang.',
    );

    const duplicate = await api()
      .post('/time-windows')
      .set(asPlanner)
      .send({
        curriculumModuleId: m1.body.id,
        cohortId: cohortEfz.body.id,
        startsOn: '2099-10-01',
        endsOn: '2099-12-31',
      })
      .expect(409);
    expect(duplicate.body.statusCode).toBe(409);

    const regional = await api()
      .post('/time-windows')
      .set(asPlanner)
      .send({
        curriculumModuleId: m1.body.id,
        cohortId: cohortEfz.body.id,
        startsOn: '2099-10-01',
        endsOn: '2099-12-31',
        locationId,
      })
      .expect(201);
    expect(regional.body.location).toMatchObject({ code: 'E2EB-LOC' });

    const byCohort = await api()
      .get(`/time-windows?cohortId=${cohortEfz.body.id}`)
      .set(asInstructor)
      .expect(200);
    expect(byCohort.body).toHaveLength(2);

    await api()
      .patch(`/time-windows/${window.body.id}`)
      .set(asPlanner)
      .send({ endsOn: '2099-12-15' })
      .expect(200);
    await api()
      .delete(`/time-windows/${regional.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .delete(`/time-windows/${window.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .delete(`/cohorts/${cohortEba.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .delete(`/cohorts/${cohortEfz.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .delete(`/curriculum-modules/${m2.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .delete(`/curriculum-modules/${m1.body.id}`)
      .set(asPlanner)
      .expect(204);
  });
});
