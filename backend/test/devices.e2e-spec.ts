import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { DeviceType } from '../src/devices/device-type.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2ED.
describe('Devices (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let typeId: string;
  let locA: string;
  let locB: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    typeId = (
      await ds
        .getRepository(DeviceType)
        .save({ code: 'E2ED-DT', name: 'E2ED Typ', category: 'forklift' })
    ).id;
    const locations = ds.getRepository(Location);
    locA = (
      await locations.save({
        code: 'E2ED-A',
        name: 'E2ED Alpha',
        kind: 'training_centre',
        languageRegion: 'de',
      })
    ).id;
    locB = (
      await locations.save({
        code: 'E2ED-B',
        name: 'E2ED Beta',
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
    await ds.query(`DELETE FROM "device" WHERE inventory_number LIKE 'E2ED-%'`);
    await ds.query(`DELETE FROM "device_type" WHERE code = 'E2ED-DT'`);
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2ED-%'`);
  }

  it('creates, filters, moves and deletes a device', async () => {
    await api()
      .post('/devices')
      .set(asInstructor)
      .send({
        deviceTypeId: typeId,
        inventoryNumber: 'E2ED-1',
        homeLocationId: locA,
      })
      .expect(403);

    const created = await api()
      .post('/devices')
      .set(asPlanner)
      .send({
        deviceTypeId: typeId,
        inventoryNumber: 'E2ED-1',
        homeLocationId: locA,
        mobility: 'mobile',
      })
      .expect(201);
    const id: string = created.body.id;
    expect(created.body).toMatchObject({
      inventoryNumber: 'E2ED-1',
      mobility: 'mobile',
      status: 'available',
      deviceType: { code: 'E2ED-DT' },
      homeLocation: { code: 'E2ED-A' },
      currentLocation: { code: 'E2ED-A' },
      lastMove: null,
      moves: [],
      maintenanceWindows: [],
    });

    const moved = await api()
      .post(`/devices/${id}/moves`)
      .set(asPlanner)
      .send({ toLocationId: locB, effectiveOn: '2020-01-01' })
      .expect(201);
    expect(moved.body.currentLocation.code).toBe('E2ED-B');
    expect(moved.body.lastMove).toMatchObject({
      toLocation: { code: 'E2ED-B' },
      effectiveOn: '2020-01-01',
    });
    expect(moved.body.moves[0]).toMatchObject({
      fromLocationId: locA,
      toLocationId: locB,
    });

    const sameLocation = await api()
      .post(`/devices/${id}/moves`)
      .set(asPlanner)
      .send({ toLocationId: locB, effectiveOn: '2020-06-01' })
      .expect(400);
    expect(sameLocation.body.message).toBe(
      'Das Gerät steht an diesem Datum bereits an diesem Standort.',
    );

    const future = await api()
      .post(`/devices/${id}/moves`)
      .set(asPlanner)
      .send({ toLocationId: locA, effectiveOn: '2999-01-01' })
      .expect(201);
    expect(future.body.currentLocation.code).toBe('E2ED-B');
    expect(future.body.lastMove.toLocation.code).toBe('E2ED-A');

    const atA = await api()
      .get(`/devices?locationId=${locA}`)
      .set(asInstructor)
      .expect(200);
    expect(atA.body.map((d: { id: string }) => d.id)).toEqual([id]);
    const mobile = await api()
      .get(`/devices?mobility=fixed&deviceTypeId=${typeId}`)
      .set(asInstructor)
      .expect(200);
    expect(mobile.body).toEqual([]);

    await api()
      .delete(`/device-moves/${future.body.moves[0].id}`)
      .set(asPlanner)
      .expect(204);
    await api().delete(`/devices/${id}`).set(asPlanner).expect(204);
  });

  it('refuses to move a fixed device and validates rentals', async () => {
    const fixed = await api()
      .post('/devices')
      .set(asPlanner)
      .send({
        deviceTypeId: typeId,
        inventoryNumber: 'E2ED-2',
        homeLocationId: locA,
      })
      .expect(201);
    const res = await api()
      .post(`/devices/${fixed.body.id}/moves`)
      .set(asPlanner)
      .send({ toLocationId: locB, effectiveOn: '2026-10-05' })
      .expect(409);
    expect(res.body.message).toBe(
      'Das Gerät ist fest installiert und kann nicht verschoben werden.',
    );

    const badRental = await api()
      .post('/devices')
      .set(asPlanner)
      .send({
        deviceTypeId: typeId,
        inventoryNumber: 'E2ED-3',
        homeLocationId: locA,
        mobility: 'rental',
        rentalFrom: '2026-11-10',
        rentalUntil: '2026-11-01',
      })
      .expect(400);
    expect(badRental.body.message).toBe(
      'Das Mietende liegt vor dem Mietbeginn.',
    );

    const unknownType = await api()
      .post('/devices')
      .set(asPlanner)
      .send({
        deviceTypeId: '00000000-0000-0000-0000-000000000000',
        inventoryNumber: 'E2ED-4',
        homeLocationId: locA,
      })
      .expect(400);
    expect(unknownType.body.message).toBe('Unbekannter Gerätetyp.');

    await api().delete(`/devices/${fixed.body.id}`).set(asPlanner).expect(204);
  });

  it('manages maintenance windows', async () => {
    const device = await api()
      .post('/devices')
      .set(asPlanner)
      .send({
        deviceTypeId: typeId,
        inventoryNumber: 'E2ED-5',
        homeLocationId: locA,
      })
      .expect(201);
    const id: string = device.body.id;

    const window = await api()
      .post(`/devices/${id}/maintenance-windows`)
      .set(asPlanner)
      .send({ startsOn: '2026-10-12', endsOn: '2026-10-14', note: 'Service' })
      .expect(201);
    expect(window.body).toMatchObject({
      deviceId: id,
      startsOn: '2026-10-12',
      endsOn: '2026-10-14',
      note: 'Service',
    });

    const backwards = await api()
      .post(`/devices/${id}/maintenance-windows`)
      .set(asPlanner)
      .send({ startsOn: '2026-10-14', endsOn: '2026-10-12' })
      .expect(400);
    expect(backwards.body.message).toBe(
      'Das Enddatum liegt vor dem Startdatum.',
    );

    const updated = await api()
      .patch(`/maintenance-windows/${window.body.id}`)
      .set(asPlanner)
      .send({ endsOn: '2026-10-16' })
      .expect(200);
    expect(updated.body.endsOn).toBe('2026-10-16');

    const detail = await api()
      .get(`/devices/${id}`)
      .set(asInstructor)
      .expect(200);
    expect(detail.body.maintenanceWindows).toHaveLength(1);

    await api()
      .delete(`/maintenance-windows/${window.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api().delete(`/devices/${id}`).set(asPlanner).expect(204);
  });
});
