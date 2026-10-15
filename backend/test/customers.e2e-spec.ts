import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const base = {
  name: 'E2E Kunde AG',
  city: 'Testhausen',
  contactEmail: 'kontakt@e2e-kunde.ch',
};

describe('Customers (e2e)', () => {
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
      `DELETE FROM "participant" WHERE customer_id IN
         (SELECT id FROM "customer" WHERE name LIKE 'E2E %')
       OR last_name = 'E2E-Teilnehmerin'`,
    );
    await ds.query(`DELETE FROM "customer" WHERE name LIKE 'E2E %'`);
  }

  const api = () => request(app.getHttpServer());

  it('rejects writes from an instructor', async () => {
    await api().post('/customers').set(asInstructor).send(base).expect(403);
  });

  it('validates customer and participant bodies', async () => {
    const res = await api()
      .post('/customers')
      .set(asPlanner)
      .send({ name: '', contactEmail: 'nope' })
      .expect(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'name', message: 'Pflichtfeld.' },
        { field: 'contactEmail', message: 'Ungültige E-Mail-Adresse.' },
      ]),
    );

    await api()
      .post('/participants')
      .set(asPlanner)
      .send({ firstName: 'X', lastName: 'Y', language: 'xx' })
      .expect(400);
  });

  it('manages a customer with its participants', async () => {
    const created = await api()
      .post('/customers')
      .set(asPlanner)
      .send(base)
      .expect(201);
    const id: string = created.body.id;
    expect(created.body).toMatchObject({
      ...base,
      active: true,
      participantCount: 0,
      siteCount: 0,
      participants: [],
      sites: [],
    });

    const participant = await api()
      .post('/participants')
      .set(asPlanner)
      .send({
        firstName: 'Petra',
        lastName: 'E2E-Teilnehmerin',
        language: 'de',
        customerId: id,
      })
      .expect(201);
    expect(participant.body.customer).toMatchObject({ id, name: base.name });

    const filtered = await api()
      .get(`/participants?customerId=${id}`)
      .set(asInstructor)
      .expect(200);
    expect(filtered.body).toHaveLength(1);

    const detail = await api()
      .get(`/customers/${id}`)
      .set(asInstructor)
      .expect(200);
    expect(detail.body.participants).toHaveLength(1);
    expect(detail.body.participantCount).toBe(1);

    // An unknown customer on a participant is a 400, not a 404.
    await api()
      .post('/participants')
      .set(asPlanner)
      .send({
        firstName: 'X',
        lastName: 'E2E-Teilnehmerin',
        language: 'de',
        customerId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(400);

    // The participant still references the customer; deleting it must fail.
    await api().delete(`/customers/${id}`).set(asPlanner).expect(409);

    await api()
      .patch(`/participants/${participant.body.id}`)
      .set(asPlanner)
      .send({ customerId: null })
      .expect(200);
    await api().delete(`/customers/${id}`).set(asPlanner).expect(204);
    await api()
      .delete(`/participants/${participant.body.id}`)
      .set(asPlanner)
      .expect(204);
  });
});
