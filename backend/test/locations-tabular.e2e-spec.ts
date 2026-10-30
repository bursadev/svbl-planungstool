import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { DeviceType } from '../src/devices/device-type.entity.js';
import { Device } from '../src/devices/device.entity.js';
import { DeviceCategory } from '../src/database/enums.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

/** CSV template, export, import, bulk actions, archive filter, search and paging of /locations. */
describe('Locations CSV and bulk (e2e)', () => {
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
      `DELETE FROM "device" WHERE inventory_number = 'E2E-TAB-DEV'`,
    );
    await ds.query(`DELETE FROM "device_type" WHERE code = 'E2E-TAB-DT'`);
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2E-TAB-%'`);
  }

  const api = () => request(app.getHttpServer());
  const header =
    'Code;Name;Art;Adresse;PLZ;Ort;Kanton;Sprachregion;ÜK-Standort;Parallele Kurse;Aktiv';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/locations/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/locations/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(
      'standorte-vorlage.csv',
    );
    const rows = parseCsv(res.text);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('Code');
    expect(rows[0]).not.toContain('Räume');
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-TAB-A;Alpha;Ausbildungszentrum;;;Zürich;ZH;Deutsch;ja;2;ja',
        'E2E-TAB-B;;Mond;;;;;Klingonisch;vielleicht;zwei;ja',
        'E2E-TAB-A;Doppelt;Ausbildungszentrum;;;;;Deutsch;;;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        {
          line: 3,
          column: 'Art',
          message: expect.stringContaining('Unbekannter Wert «Mond»'),
        },
        {
          line: 3,
          column: 'ÜK-Standort',
          message: '«ja» oder «nein» erwartet.',
        },
        { line: 3, column: 'Parallele Kurse', message: 'Ganze Zahl erwartet.' },
        { line: 4, column: 'Code', message: 'Doppelt in der Datei (Zeile 2).' },
      ]),
    );
    const count = await ds.query(
      `SELECT count(*)::int AS n FROM location WHERE code LIKE 'E2E-TAB-%'`,
    );
    expect(count[0].n).toBe(0);
  });

  it('needs the key column, and required fields only for new rows', async () => {
    const noKey = await importCsv('Name\r\nX', true).expect(200);
    expect(noKey.body.errors).toEqual([
      { line: 1, column: 'Code', message: 'Spalte fehlt.' },
    ]);
    const res = await importCsv('Code;Name\r\nE2E-TAB-X;X', true).expect(200);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { line: 2, column: 'Art', message: 'Pflichtfeld (Spalte fehlt).' },
      ]),
    );
  });

  it('dry-runs, imports, re-imports its export unchanged and updates by code', async () => {
    const body = csv(
      'E2E-TAB-A;Älpli;Ausbildungszentrum;Bahnhofstrasse 1;8000;Zürich;ZH;Deutsch;ja;2;ja',
      'E2E-TAB-B;Beta;Kundenstandort;;;Genève;GE;Französisch;nein;;ja',
    );
    const dry = await importCsv(body, true).expect(200);
    expect(dry.body).toMatchObject({
      dryRun: true,
      written: false,
      created: 2,
      errors: [],
    });

    const real = await importCsv(body, false).expect(200);
    expect(real.body).toMatchObject({ written: true, created: 2, updated: 0 });

    const exported = await api()
      .get('/locations/export.csv?q=E2E-TAB')
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /standorte-\d{4}-\d{2}-\d{2}\.csv/,
    );
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 2,
      errors: [],
    });

    const update = await importCsv(
      'Code;Name;Kanton\r\nE2E-TAB-B;Beta Neu;',
      false,
    ).expect(200);
    expect(update.body.errors).toEqual([]);
    expect(update.body).toMatchObject({ updated: 1, written: true });
    const [row] = await ds.query(
      `SELECT name, canton, city FROM location WHERE code = 'E2E-TAB-B'`,
    );
    // Columns that are not in the file stay; an empty nullable cell clears.
    expect(row).toEqual({ name: 'Beta Neu', canton: null, city: 'Genève' });
  });

  it('searches word by word ignoring accents and pages with X-Total-Count', async () => {
    const res = await api()
      .get('/locations?q=alpli%20zurich')
      .set(asPlanner)
      .expect(200);
    expect(res.body.map((l: { code: string }) => l.code)).toEqual([
      'E2E-TAB-A',
    ]);

    // Umlauts sort like the alphabet, not after «Z» (the database collation is byte order).
    const byName = await api()
      .get('/locations?q=E2E-TAB&sort=name')
      .set(asPlanner)
      .expect(200);
    expect(byName.body.map((l: { name: string }) => l.name)).toEqual([
      'Älpli',
      'Beta Neu',
    ]);

    const paged = await api()
      .get('/locations?q=E2E-TAB&page=1&pageSize=1&sort=code&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(paged.headers['x-total-count']).toBe('2');
    expect(paged.body.map((l: { code: string }) => l.code)).toEqual([
      'E2E-TAB-B',
    ]);
  });

  it('archives and restores in bulk and filters by archive scope', async () => {
    const rows: { id: string; code: string }[] = await ds.query(
      `SELECT id, code FROM location WHERE code LIKE 'E2E-TAB-%' ORDER BY code`,
    );
    const ids = rows.map((r) => r.id);

    await api()
      .post('/locations/bulk')
      .set(asInstructor)
      .send({ action: 'archive', ids })
      .expect(403);
    const archived = await api()
      .post('/locations/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids })
      .expect(200);
    expect(archived.body).toEqual({ succeeded: ids, failed: [] });

    const active = await api()
      .get('/locations?q=E2E-TAB&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(active.body).toHaveLength(0);
    const onlyArchived = await api()
      .get('/locations?q=E2E-TAB&archive=archived')
      .set(asPlanner)
      .expect(200);
    expect(onlyArchived.body).toHaveLength(2);

    await api()
      .post('/locations/bulk')
      .set(asPlanner)
      .send({ action: 'restore', ids: [ids[0]] })
      .expect(200);
    const after = await api()
      .get('/locations?q=E2E-TAB&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(after.body.map((l: { code: string }) => l.code)).toEqual([
      'E2E-TAB-A',
    ]);

    const audit = await ds.query(
      `SELECT count(*)::int AS n FROM audit_entry WHERE entity_id = $1 AND action IN ('archive','restore')`,
      [ids[0]],
    );
    expect(audit[0].n).toBe(2);
  });

  it('deletes in bulk and reports referenced rows as failed', async () => {
    const rows: { id: string; code: string }[] = await ds.query(
      `SELECT id, code FROM location WHERE code LIKE 'E2E-TAB-%' ORDER BY code`,
    );
    const [a, b] = rows;
    const type = await ds
      .getRepository(DeviceType)
      .save({
        code: 'E2E-TAB-DT',
        name: 'Test',
        category: DeviceCategory.Other,
      });
    await ds.getRepository(Device).save({
      deviceTypeId: type.id,
      inventoryNumber: 'E2E-TAB-DEV',
      homeLocationId: a.id,
    });

    const res = await api()
      .post('/locations/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids: [a.id, b.id] })
      .expect(200);
    expect(res.body).toEqual({
      succeeded: [b.id],
      failed: [
        {
          id: a.id,
          label: 'Älpli',
          message: 'Wird noch von Geräten verwendet.',
        },
      ],
    });
    const left = await ds.query(
      `SELECT code FROM location WHERE code LIKE 'E2E-TAB-%'`,
    );
    expect(left).toEqual([{ code: 'E2E-TAB-A' }]);
  });
});
