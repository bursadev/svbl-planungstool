import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

describe('School holidays (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let schoolId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();

    const location = await api()
      .post('/locations')
      .set(asPlanner)
      .send({
        code: 'E2E-HOL',
        name: 'E2E Ferienort',
        kind: 'training_centre',
        languageRegion: 'de',
      })
      .expect(201);
    const school = await api()
      .post('/vocational-schools')
      .set(asPlanner)
      .send({
        name: 'E2E Ferienschule',
        shortName: 'E2E-FS',
        language: 'de',
        nearestLocationId: location.body.id,
      })
      .expect(201);
    schoolId = school.body.id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "school_holiday" WHERE vocational_school_id IN
         (SELECT id FROM "vocational_school" WHERE short_name = 'E2E-FS')`,
    );
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name = 'E2E-FS'`,
    );
    await ds.query(`DELETE FROM "location" WHERE code = 'E2E-HOL'`);
  }

  const api = () => request(app.getHttpServer());

  it('rejects writes from an instructor', async () => {
    await api()
      .post(`/vocational-schools/${schoolId}/holidays`)
      .set(asInstructor)
      .send({ startsOn: '2026-07-06', endsOn: '2026-08-07' })
      .expect(403);
  });

  it('refuses a range whose start lies after the end', async () => {
    const res = await api()
      .post(`/vocational-schools/${schoolId}/holidays`)
      .set(asPlanner)
      .send({ startsOn: '2026-08-07', endsOn: '2026-07-06' })
      .expect(400);
    expect(res.body.message).toBe('Das Startdatum liegt nach dem Enddatum.');
  });

  it('creates, lists, updates and deletes a holiday', async () => {
    const created = await api()
      .post(`/vocational-schools/${schoolId}/holidays`)
      .set(asPlanner)
      .send({
        startsOn: '2026-07-06',
        endsOn: '2026-08-07',
        name: 'Sommerferien',
      })
      .expect(201);
    expect(created.body).toMatchObject({
      vocationalSchoolId: schoolId,
      startsOn: '2026-07-06',
      endsOn: '2026-08-07',
      name: 'Sommerferien',
    });

    const list = await api()
      .get(`/vocational-schools/${schoolId}/holidays`)
      .set(asInstructor)
      .expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await api()
      .patch(`/school-holidays/${created.body.id}`)
      .set(asPlanner)
      .send({ endsOn: '2026-08-09' })
      .expect(200);
    expect(updated.body.endsOn).toBe('2026-08-09');

    await api()
      .delete(`/school-holidays/${created.body.id}`)
      .set(asPlanner)
      .expect(204);
    const empty = await api()
      .get(`/vocational-schools/${schoolId}/holidays`)
      .set(asPlanner)
      .expect(200);
    expect(empty.body).toHaveLength(0);
  });
});
