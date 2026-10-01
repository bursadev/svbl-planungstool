import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { DeviceType } from '../src/devices/device-type.entity.js';
import { Device } from '../src/devices/device.entity.js';
import { AuditEntry } from '../src/system/audit-entry.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const CODE = 'E2E-LOC';
const base = {
  code: CODE,
  name: 'Testort',
  kind: 'training_centre',
  languageRegion: 'de',
  city: 'Testhausen',
};

describe('Locations (e2e)', () => {
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
    await ds.query(`DELETE FROM "device" WHERE inventory_number = 'E2E-DEV'`);
    await ds.query(`DELETE FROM "device_type" WHERE code = 'E2E-DT'`);
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2E-%'`);
  }

  const api = () => request(app.getHttpServer());

  it('rejects writes from an instructor', async () => {
    const res = await api()
      .post('/locations')
      .set(asInstructor)
      .send(base)
      .expect(403);
    expect(res.body.message).toBe('Keine Berechtigung.');
  });

  it('validates the body with German field errors', async () => {
    const res = await api()
      .post('/locations')
      .set(asPlanner)
      .send({ ...base, name: '', contactEmail: 'nope', surprise: 1 })
      .expect(400);
    expect(res.body.message).toBe('Eingabe ungültig.');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'name', message: 'Pflichtfeld.' },
        { field: 'contactEmail', message: 'Ungültige E-Mail-Adresse.' },
        { field: 'surprise', message: 'Unbekanntes Feld.' },
      ]),
    );
  });

  it('creates, lists, reads, updates and deletes a location with rooms', async () => {
    const created = await api()
      .post('/locations')
      .set(asPlanner)
      .send(base)
      .expect(201);
    const id: string = created.body.id;
    expect(created.body).toMatchObject({
      ...base,
      hostsUk: false,
      parallelCourseCapacity: 1,
      rooms: [],
    });

    const audit = await ds
      .getRepository(AuditEntry)
      .findBy({ entityType: 'location', entityId: id });
    expect(audit.map((a) => a.action)).toEqual(['create']);
    expect(audit[0].summary).toBe('hat Standort «Testort» angelegt');

    const list = await api()
      .get('/locations?q=testhaus')
      .set(asInstructor)
      .expect(200);
    expect(list.body.map((l: { id: string }) => l.id)).toContain(id);

    const room = await api()
      .post(`/locations/${id}/rooms`)
      .set(asPlanner)
      .send({ name: 'Halle A', kind: 'practice_hall', capacity: 8 })
      .expect(201);
    expect(room.body).toMatchObject({
      name: 'Halle A',
      kind: 'practice_hall',
      capacity: 8,
      locationId: id,
    });

    const duplicate = await api()
      .post(`/locations/${id}/rooms`)
      .set(asPlanner)
      .send({ name: 'Halle A', kind: 'theory' })
      .expect(409);
    expect(duplicate.body.message).toBe('Name ist bereits vergeben.');

    const detail = await api()
      .get(`/locations/${id}`)
      .set(asInstructor)
      .expect(200);
    expect(detail.body.rooms).toHaveLength(1);

    const updated = await api()
      .patch(`/locations/${id}`)
      .set(asPlanner)
      .send({ name: 'Testort Nord', hostsUk: true })
      .expect(200);
    expect(updated.body).toMatchObject({ name: 'Testort Nord', hostsUk: true });

    await api()
      .patch(`/rooms/${room.body.id}`)
      .set(asPlanner)
      .send({ capacity: 10 })
      .expect(200);
    await api().delete(`/rooms/${room.body.id}`).set(asPlanner).expect(204);
    await api().delete(`/locations/${id}`).set(asPlanner).expect(204);
    await api().get(`/locations/${id}`).set(asPlanner).expect(404);
  });

  it('refuses a duplicate code with 409', async () => {
    await api().post('/locations').set(asPlanner).send(base).expect(201);
    const res = await api()
      .post('/locations')
      .set(asPlanner)
      .send(base)
      .expect(409);
    expect(res.body.message).toBe('Code ist bereits vergeben.');
  });

  it('refuses to delete a location that is still referenced', async () => {
    const loc = await api()
      .post('/locations')
      .set(asPlanner)
      .send({ ...base, code: 'E2E-REF' })
      .expect(201);
    const type = await ds
      .getRepository(DeviceType)
      .save({ code: 'E2E-DT', name: 'Test', category: 'other' });
    await ds
      .getRepository(Device)
      .save({
        deviceTypeId: type.id,
        inventoryNumber: 'E2E-DEV',
        homeLocationId: loc.body.id,
      });

    const res = await api()
      .delete(`/locations/${loc.body.id}`)
      .set(asPlanner)
      .expect(409);
    expect(res.body.message).toBe(
      'Der Eintrag wird noch verwendet und kann nicht gelöscht werden.',
    );
  });

  it('answers 404 for unknown and malformed ids', async () => {
    await api()
      .get('/locations/00000000-0000-0000-0000-000000000000')
      .set(asPlanner)
      .expect(404);
    const res = await api()
      .get('/locations/not-a-uuid')
      .set(asPlanner)
      .expect(404);
    expect(res.body.message).toBe('Nicht gefunden.');
  });
});
