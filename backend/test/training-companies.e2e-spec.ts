import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const base = {
  name: 'E2E Lehrbetrieb AG',
  city: 'Testhausen',
  email: 'info@e2e-lehrbetrieb.ch',
};

describe('Training companies (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "trainer" WHERE training_company_id IN
         (SELECT id FROM "training_company" WHERE name LIKE 'E2E %')`,
    );
    await ds.query(`DELETE FROM "training_company" WHERE name LIKE 'E2E %'`);
  }

  const api = () => request(app.getHttpServer());

  it('rejects writes from an instructor', async () => {
    await api()
      .post('/training-companies')
      .set(asInstructor)
      .send(base)
      .expect(403);
  });

  it('validates the body with German field errors', async () => {
    const res = await api()
      .post('/training-companies')
      .set(asPlanner)
      .send({ name: '', email: 'nope' })
      .expect(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'name', message: 'Pflichtfeld.' },
        { field: 'email', message: 'Ungültige E-Mail-Adresse.' },
      ]),
    );
  });

  it('manages a company with its trainers', async () => {
    const created = await api()
      .post('/training-companies')
      .set(asPlanner)
      .send(base)
      .expect(201);
    const id: string = created.body.id;
    expect(created.body).toMatchObject({
      ...base,
      trainerCount: 0,
      apprenticeCount: 0,
      trainers: [],
    });

    const list = await api()
      .get('/training-companies?q=e2e lehr')
      .set(asInstructor)
      .expect(200);
    expect(list.body.map((c: { id: string }) => c.id)).toContain(id);

    const trainer = await api()
      .post(`/training-companies/${id}/trainers`)
      .set(asPlanner)
      .send({ firstName: 'Tina', lastName: 'Test', email: 'tina@test.ch' })
      .expect(201);
    expect(trainer.body).toMatchObject({
      firstName: 'Tina',
      lastName: 'Test',
      trainingCompanyId: id,
      apprenticeCount: 0,
    });

    const detail = await api()
      .get(`/training-companies/${id}`)
      .set(asInstructor)
      .expect(200);
    expect(detail.body.trainers).toHaveLength(1);
    expect(detail.body.trainerCount).toBe(1);

    await api()
      .patch(`/trainers/${trainer.body.id}`)
      .set(asPlanner)
      .send({ phone: '079 000 00 00' })
      .expect(200);

    // The trainer still references the company; deleting it must fail.
    await api().delete(`/training-companies/${id}`).set(asPlanner).expect(409);

    await api().delete(`/trainers/${trainer.body.id}`).set(asPlanner).expect(204);
    await api().delete(`/training-companies/${id}`).set(asPlanner).expect(204);
    await api().get(`/training-companies/${id}`).set(asPlanner).expect(404);
  });
});
