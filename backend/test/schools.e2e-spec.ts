import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { Apprentice } from '../src/apprentices/apprentice.entity.js';
import { Cohort } from '../src/curriculum/cohort.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2ES.
describe('Schools and apprentices (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let locationId: string;
  let cohortId: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    locationId = (
      await ds
        .getRepository(Location)
        .save({
          code: 'E2ES-LOC',
          name: 'E2ES Ort',
          kind: 'training_centre',
          languageRegion: 'de',
        })
    ).id;
    cohortId = (
      await ds
        .getRepository(Cohort)
        .save({ track: 'efz', startYear: 2080, label: 'E2ES 2080 EFZ' })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(`DELETE FROM "apprentice" WHERE last_name LIKE 'E2ES%'`);
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name LIKE 'E2ES%'`,
    );
    await ds.query(`DELETE FROM "cohort" WHERE label LIKE 'E2ES%'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2ES-LOC'`);
  }

  it('manages a school with classes and school days, and lists its apprentices', async () => {
    const schoolBody = {
      name: 'E2ES Berufsschule',
      shortName: 'E2ES BS',
      language: 'de',
      nearestLocationId: locationId,
      canton: 'AG',
    };
    await api()
      .post('/vocational-schools')
      .set(asInstructor)
      .send(schoolBody)
      .expect(403);

    const school = await api()
      .post('/vocational-schools')
      .set(asPlanner)
      .send(schoolBody)
      .expect(201);
    const schoolId: string = school.body.id;
    expect(school.body).toMatchObject({
      shortName: 'E2ES BS',
      nearestLocation: { code: 'E2ES-LOC' },
      classes: [],
      apprenticeCount: 0,
      active: true,
    });

    const cls = await api()
      .post(`/vocational-schools/${schoolId}/classes`)
      .set(asPlanner)
      .send({ code: 'LOG80a', track: 'efz', startYear: 2080 })
      .expect(201);
    expect(cls.body).toMatchObject({
      code: 'LOG80a',
      track: 'efz',
      startYear: 2080,
      days: [],
      apprenticeCount: 0,
    });
    await api()
      .post(`/vocational-schools/${schoolId}/classes`)
      .set(asPlanner)
      .send({ code: 'LOG80a', track: 'efz', startYear: 2080 })
      .expect(409);

    const withDays = await api()
      .put(`/school-classes/${cls.body.id}/days`)
      .set(asPlanner)
      .send({
        schoolYearStart: 2080,
        days: [{ weekday: 2 }, { weekday: 4, evening: true }],
      })
      .expect(200);
    expect(withDays.body.days).toEqual([
      expect.objectContaining({
        schoolYearStart: 2080,
        weekday: 2,
        evening: false,
      }),
      expect.objectContaining({
        schoolYearStart: 2080,
        weekday: 4,
        evening: true,
      }),
    ]);

    const nextYear = await api()
      .put(`/school-classes/${cls.body.id}/days`)
      .set(asPlanner)
      .send({ schoolYearStart: 2081, days: [{ weekday: 1 }] })
      .expect(200);
    expect(nextYear.body.days).toHaveLength(3);

    const badWeekday = await api()
      .put(`/school-classes/${cls.body.id}/days`)
      .set(asPlanner)
      .send({ schoolYearStart: 2080, days: [{ weekday: 8 }] })
      .expect(400);
    expect(badWeekday.body.errors).toEqual([
      { field: 'days.0.weekday', message: 'Wert ausserhalb des Bereichs.' },
    ]);

    const apprentice = await ds.getRepository(Apprentice).save({
      firstName: 'Lea',
      lastName: 'E2ES Lernende',
      birthDate: '2064-05-01',
      language: 'de',
      track: 'efz',
      cohortId,
      vocationalSchoolId: schoolId,
      schoolClassId: cls.body.id,
      ahvNumber: '756.0000.0000.01',
    });

    const detail = await api()
      .get(`/vocational-schools/${schoolId}`)
      .set(asInstructor)
      .expect(200);
    expect(detail.body.apprenticeCount).toBe(1);
    expect(detail.body.classes[0].apprenticeCount).toBe(1);

    const list = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}&track=efz&q=lea`)
      .set(asInstructor)
      .expect(200);
    expect(list.body).toEqual([
      expect.objectContaining({
        id: apprentice.id,
        lastName: 'E2ES Lernende',
        cohort: { id: cohortId, label: 'E2ES 2080 EFZ' },
        schoolClass: { id: cls.body.id, code: 'LOG80a' },
        trainingCompany: null,
      }),
    ]);
    await api().post('/apprentices').set(asPlanner).send({}).expect(404);

    const asPlannerDetail = await api()
      .get(`/apprentices/${apprentice.id}`)
      .set(asPlanner)
      .expect(200);
    expect(asPlannerDetail.body.ahvNumber).toBe('756.0000.0000.01');
    const asInstructorDetail = await api()
      .get(`/apprentices/${apprentice.id}`)
      .set(asInstructor)
      .expect(200);
    expect(asInstructorDetail.body.ahvNumber).toBeNull();

    const referenced = await api()
      .delete(`/school-classes/${cls.body.id}`)
      .set(asPlanner)
      .expect(409);
    expect(referenced.body.message).toBe(
      'Der Eintrag wird noch verwendet und kann nicht gelöscht werden.',
    );

    await ds.getRepository(Apprentice).delete(apprentice.id);
    await api()
      .delete(`/school-classes/${cls.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .patch(`/vocational-schools/${schoolId}`)
      .set(asPlanner)
      .send({ active: false })
      .expect(200);
    await api()
      .delete(`/vocational-schools/${schoolId}`)
      .set(asPlanner)
      .expect(204);
  });
});
