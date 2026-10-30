import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import {
  DeviceCategory,
  Language,
  LocationKind,
} from '../src/database/enums.js';
import { DeviceType } from '../src/devices/device-type.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

/** CSV template, export, import, bulk actions, archive filter, search and paging of /devices. */
describe('Devices CSV and bulk (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    await ds.getRepository(DeviceType).save({
      code: 'E2E-GER-DT',
      name: 'E2E-GER Stapler',
      category: DeviceCategory.Forklift,
    });
    await ds.getRepository(Location).save([
      {
        code: 'E2E-GER-A',
        name: 'E2E-GER Zürich',
        kind: LocationKind.TrainingCentre,
        languageRegion: Language.De,
      },
      {
        code: 'E2E-GER-B',
        name: 'E2E-GER Genève',
        kind: LocationKind.TrainingCentre,
        languageRegion: Language.Fr,
      },
    ]);
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "device" WHERE inventory_number LIKE 'E2E-GER-%'`,
    );
    await ds.query(`DELETE FROM "device_type" WHERE code = 'E2E-GER-DT'`);
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2E-GER-%'`);
  }

  const api = () => request(app.getHttpServer());
  const header =
    'Inventarnummer;Gerätetyp;Heimstandort;Mobilität;Status;Mietbeginn;Mietende;Anbieter;Notizen';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/devices/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });
  const count = async () =>
    (
      await ds.query(
        `SELECT count(*)::int AS n FROM device WHERE inventory_number LIKE 'E2E-GER-%'`,
      )
    )[0].n as number;

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/devices/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('geraete-vorlage.csv');
    const rows = parseCsv(res.text);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(header.split(';'));
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-GER-1;e2e-ger-dt;E2E-GER-A;fest;verfügbar;;;;',
        'E2E-GER-2;NOPE;E2E-GER-A;fliegend;kaputt;31.02.2027;;;',
        'E2E-GER-3;;;;;;;;',
        'e2e-ger-1;E2E-GER-DT;E2E-GER-B;;;;;;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { line: 3, column: 'Gerätetyp', message: '«NOPE» nicht gefunden.' },
        {
          line: 3,
          column: 'Mobilität',
          message: expect.stringContaining('Unbekannter Wert «fliegend»'),
        },
        {
          line: 3,
          column: 'Status',
          message: expect.stringContaining('Unbekannter Wert «kaputt»'),
        },
        { line: 3, column: 'Mietbeginn', message: 'Ungültiges Datum.' },
        { line: 4, column: 'Gerätetyp', message: 'Pflichtfeld.' },
        { line: 4, column: 'Heimstandort', message: 'Pflichtfeld.' },
        {
          line: 5,
          column: 'Inventarnummer',
          message: 'Doppelt in der Datei (Zeile 2).',
        },
      ]),
    );
    expect(await count()).toBe(0);
  });

  it('needs the key column', async () => {
    const res = await importCsv('Gerätetyp\r\nE2E-GER-DT', true).expect(200);
    expect(res.body.errors).toEqual([
      { line: 1, column: 'Inventarnummer', message: 'Spalte fehlt.' },
    ]);
  });

  it('reports a rental that ends before it starts on its line', async () => {
    const res = await importCsv(
      csv('E2E-GER-9;E2E-GER-DT;E2E-GER-A;Miete;;10.03.2027;01.03.2027;;'),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual([
      {
        line: 2,
        column: 'Mietende',
        message: 'Das Mietende liegt vor dem Mietbeginn.',
      },
    ]);
    expect(await count()).toBe(0);
  });

  it('dry-runs, imports, re-imports its export unchanged and updates by inventory number', async () => {
    const body = csv(
      'E2E-GER-1;E2E-GER-DT;E2E-GER-A;fest;verfügbar;;;;Halle Süd',
      'E2E-GER-2;e2e-ger-dt;e2e-ger-b;Miete;in Wartung;01.03.2027;2027-06-30;Hebetec AG;',
      'E2E-GER-3;E2E-GER-DT;E2E-GER-B;mobil;;;;;',
    );
    const dry = await importCsv(body, true).expect(200);
    expect(dry.body).toMatchObject({
      dryRun: true,
      written: false,
      created: 3,
      errors: [],
    });
    expect(await count()).toBe(0);

    const real = await importCsv(body, false).expect(200);
    expect(real.body).toMatchObject({ written: true, created: 3, updated: 0 });
    const [rental] = await ds.query(
      `SELECT mobility, status, rental_from::text AS "from", rental_until::text AS "until", rental_vendor AS vendor
         FROM device WHERE inventory_number = 'E2E-GER-2'`,
    );
    expect(rental).toEqual({
      mobility: 'rental',
      status: 'maintenance',
      from: '2027-03-01',
      until: '2027-06-30',
      vendor: 'Hebetec AG',
    });

    const exported = await api()
      .get('/devices/export.csv?q=E2E-GER')
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /geraete-\d{4}-\d{2}-\d{2}\.csv/,
    );
    const lines = parseCsv(exported.text);
    expect(lines[0]).toEqual(header.split(';'));
    expect(lines[2]).toEqual([
      'E2E-GER-2',
      'E2E-GER-DT',
      'E2E-GER-B',
      'Miete',
      'in Wartung',
      '01.03.2027',
      '30.06.2027',
      'Hebetec AG',
      '',
    ]);
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 3,
      errors: [],
    });

    const update = await importCsv(
      'Inventarnummer;Heimstandort;Notizen\r\nE2E-GER-1;E2E-GER-B;',
      false,
    ).expect(200);
    expect(update.body.errors).toEqual([]);
    expect(update.body).toMatchObject({ updated: 1, written: true });
    const [row] = await ds.query(
      `SELECT l.code, d.notes, d.mobility FROM device d JOIN location l ON l.id = d.home_location_id
        WHERE d.inventory_number = 'E2E-GER-1'`,
    );
    // Columns that are not in the file stay; an empty nullable cell clears.
    expect(row).toEqual({ code: 'E2E-GER-B', notes: null, mobility: 'fixed' });
  });

  it('searches type, location and vendor ignoring accents, sorts and pages', async () => {
    const byLocation = await api()
      .get('/devices?q=e2e-ger%20geneve%20hebetec')
      .set(asPlanner)
      .expect(200);
    expect(
      byLocation.body.map(
        (d: { inventoryNumber: string }) => d.inventoryNumber,
      ),
    ).toEqual(['E2E-GER-2']);

    const paged = await api()
      .get('/devices?q=E2E-GER&page=1&pageSize=2&sort=inventoryNumber&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(paged.headers['x-total-count']).toBe('3');
    expect(
      paged.body.map((d: { inventoryNumber: string }) => d.inventoryNumber),
    ).toEqual(['E2E-GER-3', 'E2E-GER-2']);

    const byType = await api()
      .get('/devices?q=E2E-GER&sort=type&page=2&pageSize=2')
      .set(asPlanner)
      .expect(200);
    expect(byType.headers['x-total-count']).toBe('3');
    expect(byType.body).toHaveLength(1);
  });

  it('archives (retires) and restores in bulk and combines archive and status filters', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM device WHERE inventory_number LIKE 'E2E-GER-%' ORDER BY inventory_number`,
    );
    const ids = rows.map((r) => r.id);

    await api()
      .post('/devices/bulk')
      .set(asInstructor)
      .send({ action: 'archive', ids })
      .expect(403);
    const archived = await api()
      .post('/devices/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids: [ids[0], ids[1]] })
      .expect(200);
    expect(archived.body.failed).toEqual([]);
    const byId = (a: string, b: string) => a.localeCompare(b);
    expect([...archived.body.succeeded].sort(byId)).toEqual(
      [ids[0], ids[1]].sort(byId),
    );
    const statuses = await ds.query(
      `SELECT status FROM device WHERE id = ANY($1) ORDER BY inventory_number`,
      [[ids[0], ids[1]]],
    );
    expect(statuses).toEqual([{ status: 'retired' }, { status: 'retired' }]);

    const active = await api()
      .get('/devices?q=E2E-GER&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(
      active.body.map((d: { inventoryNumber: string }) => d.inventoryNumber),
    ).toEqual(['E2E-GER-3']);
    const onlyArchived = await api()
      .get('/devices?q=E2E-GER&archive=archived')
      .set(asPlanner)
      .expect(200);
    expect(onlyArchived.body).toHaveLength(2);
    const activeAvailable = await api()
      .get('/devices?q=E2E-GER&archive=active&status=available')
      .set(asPlanner)
      .expect(200);
    expect(activeAvailable.body).toHaveLength(1);
    // Without `archive` the list still returns every device (pickers elsewhere).
    const all = await api()
      .get('/devices?q=E2E-GER')
      .set(asPlanner)
      .expect(200);
    expect(all.body).toHaveLength(3);

    const restored = await api()
      .post('/devices/bulk')
      .set(asPlanner)
      .send({ action: 'restore', ids: [ids[1]] })
      .expect(200);
    expect(restored.body.failed).toEqual([]);
    const [row] = await ds.query(`SELECT status FROM device WHERE id = $1`, [
      ids[1],
    ]);
    expect(row.status).toBe('available');

    const audit = await ds.query(
      `SELECT count(*)::int AS n FROM audit_entry WHERE entity_id = $1 AND action IN ('archive','restore')`,
      [ids[1]],
    );
    expect(audit[0].n).toBe(2);
  });

  it('deletes in bulk', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM device WHERE inventory_number LIKE 'E2E-GER-%' ORDER BY inventory_number`,
    );
    const res = await api()
      .post('/devices/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids: rows.map((r) => r.id) })
      .expect(200);
    expect(res.body.failed).toEqual([]);
    expect(res.body.succeeded).toHaveLength(3);
    expect(await count()).toBe(0);
  });
});
