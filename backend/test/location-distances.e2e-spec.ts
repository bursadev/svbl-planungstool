import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

describe('Location distances (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let aId: string;
  let bId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();

    const make = (code: string, name: string) =>
      api()
        .post('/locations')
        .set(asPlanner)
        .send({ code, name, kind: 'training_centre', languageRegion: 'de' })
        .expect(201);
    aId = (await make('E2E-DIST-A', 'E2E Distanz A')).body.id;
    bId = (await make('E2E-DIST-B', 'E2E Distanz B')).body.id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    // Distance rows cascade with their locations.
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2E-DIST-%'`);
  }

  const api = () => request(app.getHttpServer());

  it('rejects writes from an instructor', async () => {
    await api()
      .put('/location-distances')
      .set(asInstructor)
      .send({ fromLocationId: aId, toLocationId: bId, travelMinutes: 45 })
      .expect(403);
  });

  it('refuses minutes beyond a day with a field error', async () => {
    const res = await api()
      .put('/location-distances')
      .set(asPlanner)
      .send({ fromLocationId: aId, toLocationId: bId, travelMinutes: 40000 })
      .expect(400);
    expect(res.body.errors).toEqual([
      { field: 'travelMinutes', message: 'Wert ausserhalb des Bereichs.' },
    ]);
  });

  it('refuses a pair with the same start and destination', async () => {
    const res = await api()
      .put('/location-distances')
      .set(asPlanner)
      .send({ fromLocationId: aId, toLocationId: aId, travelMinutes: 5 })
      .expect(400);
    expect(res.body.message).toBe('Start und Ziel müssen verschieden sein.');
  });

  it('stores a pair symmetrically, updates and deletes it', async () => {
    const created = await api()
      .put('/location-distances')
      .set(asPlanner)
      .send({ fromLocationId: aId, toLocationId: bId, travelMinutes: 45 })
      .expect(200);
    expect(created.body).toMatchObject({
      fromLocation: { id: aId },
      toLocation: { id: bId },
      travelMinutes: 45,
    });

    const list = await api()
      .get('/location-distances')
      .set(asInstructor)
      .expect(200);
    const pairs = list.body.filter(
      (d: { fromLocation: { id: string }; toLocation: { id: string } }) =>
        [d.fromLocation.id, d.toLocation.id].every((id) =>
          [aId, bId].includes(id),
        ),
    );
    expect(pairs).toHaveLength(2);
    expect(new Set(pairs.map((d: { travelMinutes: number }) => d.travelMinutes)))
      .toEqual(new Set([45]));

    // Upserting the reverse direction overwrites both rows.
    await api()
      .put('/location-distances')
      .set(asPlanner)
      .send({ fromLocationId: bId, toLocationId: aId, travelMinutes: 50 })
      .expect(200);
    const updated = await api()
      .get('/location-distances')
      .set(asPlanner)
      .expect(200);
    const minutes = updated.body
      .filter((d: { fromLocation: { id: string } }) =>
        [aId, bId].includes(d.fromLocation.id),
      )
      .map((d: { travelMinutes: number }) => d.travelMinutes);
    expect(new Set(minutes)).toEqual(new Set([50]));

    await api()
      .delete(`/location-distances/${aId}/${bId}`)
      .set(asPlanner)
      .expect(204);
    const empty = await api()
      .get('/location-distances')
      .set(asPlanner)
      .expect(200);
    expect(
      empty.body.filter((d: { fromLocation: { id: string } }) =>
        [aId, bId].includes(d.fromLocation.id),
      ),
    ).toHaveLength(0);
  });
});
