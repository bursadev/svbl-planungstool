import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { SchoolClass } from '../src/apprentices/school-class.entity.js';
import { parseCsv } from '../src/common/csv.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

/**
 * CSV template, export, import, bulk actions, archive filter, search and
 * filters of /vocational-schools. Rows are prefixed E2E-BS-S.
 */
describe('Vocational schools CSV and bulk (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let locationId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    locationId = (
      await ds.getRepository(Location).save({
        code: 'E2E-BS-SLOC',
        name: 'E2E-BS-S Zentrum',
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
      `DELETE FROM "school_class" WHERE vocational_school_id IN
         (SELECT id FROM "vocational_school" WHERE short_name LIKE 'E2E-BS-S%')`,
    );
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name LIKE 'E2E-BS-S%'`,
    );
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2E-BS-S%'`);
  }

  const api = () => request(app.getHttpServer());
  const header =
    'Name;Kurzname;Ort;Kanton;Sprache;ÜK-Standort;Kontakt E-Mail;Aktiv';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/vocational-schools/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/vocational-schools/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(
      'berufsschulen-vorlage.csv',
    );
    const rows = parseCsv(res.text);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(
      expect.arrayContaining(['Name', 'Kurzname', 'ÜK-Standort']),
    );
    expect(rows[0]).not.toContain('Klassen');
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-BS-S Alpha;E2E-BS-SA;Baden;AG;Deutsch;E2E-BS-SLOC;;ja',
        'E2E-BS-S Beta;E2E-BS-SB;;;Klingonisch;NIRGENDS;keine-mail;ja',
        'Doppelt;E2E-BS-SA;;;Deutsch;E2E-BS-SLOC;;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        {
          line: 3,
          column: 'Sprache',
          message: expect.stringContaining('Unbekannter Wert'),
        },
        {
          line: 3,
          column: 'ÜK-Standort',
          message: '«NIRGENDS» nicht gefunden.',
        },
        {
          line: 4,
          column: 'Kurzname',
          message: 'Doppelt in der Datei (Zeile 2).',
        },
      ]),
    );
    const count = await ds.query(
      `SELECT count(*)::int AS n FROM vocational_school WHERE short_name LIKE 'E2E-BS-S%'`,
    );
    expect(count[0].n).toBe(0);
  });

  it('needs the key column, and required fields only for new rows', async () => {
    const noKey = await importCsv('Name\r\nX', true).expect(200);
    expect(noKey.body.errors).toEqual([
      { line: 1, column: 'Kurzname', message: 'Spalte fehlt.' },
    ]);
    const res = await importCsv('Kurzname;Name\r\nE2E-BS-SX;X', true).expect(
      200,
    );
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { line: 2, column: 'Sprache', message: 'Pflichtfeld (Spalte fehlt).' },
        {
          line: 2,
          column: 'ÜK-Standort',
          message: 'Pflichtfeld (Spalte fehlt).',
        },
      ]),
    );
  });

  it('dry-runs, imports, re-imports its export unchanged and updates by short name', async () => {
    const body = csv(
      'E2E-BS-S Älpli Schule;E2E-BS-SA;Zürich;ZH;Deutsch;e2e-bs-sloc;info@alpli.ch;ja',
      'E2E-BS-S Beta;E2E-BS-SB;Genève;GE;Französisch;E2E-BS-SLOC;;ja',
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
    const [created] = await ds.query(
      `SELECT nearest_location_id AS "locationId", language FROM vocational_school WHERE short_name = 'E2E-BS-SA'`,
    );
    expect(created).toEqual({ locationId, language: 'de' });

    const exported = await api()
      .get('/vocational-schools/export.csv?q=E2E-BS-S')
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /berufsschulen-\d{4}-\d{2}-\d{2}\.csv/,
    );
    const rows = parseCsv(exported.text);
    expect(rows[0]).toEqual(expect.arrayContaining(['Klassen', 'Lernende']));
    expect(rows[1][rows[0].indexOf('ÜK-Standort')]).toBe('E2E-BS-SLOC');
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 2,
      errors: [],
    });

    const update = await importCsv(
      'Kurzname;Name;Kanton\r\nE2E-BS-SB;E2E-BS-S Beta Neu;',
      false,
    ).expect(200);
    expect(update.body.errors).toEqual([]);
    expect(update.body).toMatchObject({ updated: 1, written: true });
    const [row] = await ds.query(
      `SELECT name, canton, city FROM vocational_school WHERE short_name = 'E2E-BS-SB'`,
    );
    expect(row).toEqual({
      name: 'E2E-BS-S Beta Neu',
      canton: null,
      city: 'Genève',
    });
  });

  it('searches ignoring accents and filters by language and ÜK-Standort', async () => {
    const res = await api()
      .get('/vocational-schools?q=alpli%20zurich')
      .set(asPlanner)
      .expect(200);
    expect(res.body.map((s: { shortName: string }) => s.shortName)).toEqual([
      'E2E-BS-SA',
    ]);
    expect(res.headers['x-total-count']).toBe('1');

    const french = await api()
      .get(
        `/vocational-schools?q=E2E-BS-S&language=fr&nearestLocationId=${locationId}`,
      )
      .set(asPlanner)
      .expect(200);
    expect(french.body.map((s: { shortName: string }) => s.shortName)).toEqual([
      'E2E-BS-SB',
    ]);

    const short = (body: { shortName: string }[]) =>
      body.map((s) => s.shortName);
    const asc = await api()
      .get('/vocational-schools?q=E2E-BS-S&sort=name')
      .set(asPlanner)
      .expect(200);
    const desc = await api()
      .get('/vocational-schools?q=E2E-BS-S&sort=name&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(short(asc.body)).toHaveLength(2);
    expect(short(desc.body)).toEqual(short(asc.body).reverse());
  });

  it('archives and restores in bulk and filters by archive scope', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM vocational_school WHERE short_name LIKE 'E2E-BS-S%' ORDER BY short_name`,
    );
    const ids = rows.map((r) => r.id);

    await api()
      .post('/vocational-schools/bulk')
      .set(asInstructor)
      .send({ action: 'archive', ids })
      .expect(403);
    const archived = await api()
      .post('/vocational-schools/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids })
      .expect(200);
    expect(archived.body).toEqual({ succeeded: ids, failed: [] });

    const active = await api()
      .get('/vocational-schools?q=E2E-BS-S&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(active.body).toHaveLength(0);
    const onlyArchived = await api()
      .get('/vocational-schools?q=E2E-BS-S&archive=archived')
      .set(asPlanner)
      .expect(200);
    expect(onlyArchived.body).toHaveLength(2);

    await api()
      .post('/vocational-schools/bulk')
      .set(asPlanner)
      .send({ action: 'restore', ids: [ids[0]] })
      .expect(200);
    const after = await api()
      .get('/vocational-schools?q=E2E-BS-S&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(after.body.map((s: { shortName: string }) => s.shortName)).toEqual([
      'E2E-BS-SA',
    ]);
  });

  it('deletes in bulk and reports referenced rows as failed', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM vocational_school WHERE short_name LIKE 'E2E-BS-S%' ORDER BY short_name`,
    );
    const [a, b] = rows;
    await ds
      .getRepository(SchoolClass)
      .save({
        vocationalSchoolId: a.id,
        code: 'E2E-BS-K',
        track: 'efz',
        startYear: 2083,
      });

    const res = await api()
      .post('/vocational-schools/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids: [a.id, b.id] })
      .expect(200);
    expect(res.body).toEqual({
      succeeded: [b.id],
      failed: [
        {
          id: a.id,
          label: 'E2E-BS-S Älpli Schule',
          message: 'Wird noch von Schulklassen verwendet.',
        },
      ],
    });
    const left = await ds.query(
      `SELECT short_name AS "shortName" FROM vocational_school WHERE short_name LIKE 'E2E-BS-S%'`,
    );
    expect(left).toEqual([{ shortName: 'E2E-BS-SA' }]);
  });
});
