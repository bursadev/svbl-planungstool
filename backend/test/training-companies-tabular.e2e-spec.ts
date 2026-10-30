import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const byText = (a: string, b: string) => a.localeCompare(b);

/** CSV template, export, import, bulk actions, archive filter, search and paging of /training-companies. */
describe('Training companies CSV and bulk (e2e)', () => {
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
         (SELECT id FROM "training_company" WHERE name LIKE 'E2E-LBK-%')`,
    );
    await ds.query(
      `DELETE FROM "training_company" WHERE name LIKE 'E2E-LBK-%'`,
    );
  }

  const api = () => request(app.getHttpServer());
  const header = 'Name;Adresse;PLZ;Ort;E-Mail;Telefon;Externe Ref.;Aktiv';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/training-companies/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/training-companies/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-disposition']).toContain(
      'lehrbetriebe-vorlage.csv',
    );
    const rows = parseCsv(res.text);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual([
      'Name',
      'Adresse',
      'PLZ',
      'Ort',
      'E-Mail',
      'Telefon',
      'Externe Ref.',
      'Aktiv',
    ]);
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-LBK-Alpha;;3000;Bern;;;E2E-LBK-R1;ja',
        'E2E-LBK-Beta;;;;keine-mail;;;vielleicht',
        'E2E-LBK-Gamma;;;;;;E2E-LBK-R1;',
        ';Ohne Name;;;;;;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { line: 3, column: 'Aktiv', message: '«ja» oder «nein» erwartet.' },
        { line: 4, column: 'Name', message: 'Doppelt in der Datei (Zeile 2).' },
        { line: 5, column: 'Name', message: 'Schlüssel fehlt.' },
      ]),
    );
    const count = await ds.query(
      `SELECT count(*)::int AS n FROM training_company WHERE name LIKE 'E2E-LBK-%'`,
    );
    expect(count[0].n).toBe(0);
  });

  it('dry-runs, imports, re-imports its export unchanged and updates by ref or name + PLZ', async () => {
    const body = csv(
      'E2E-LBK-Älpli Gartenbau;Bahnhofstrasse 1;8000;Zürich;info@aelpli.ch;;E2E-LBK-R1;ja',
      'E2E-LBK-Beta;;1700;Fribourg;;;;ja',
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
      .get('/training-companies/export.csv?q=E2E-LBK')
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /lehrbetriebe-\d{4}-\d{2}-\d{2}\.csv/,
    );
    expect(parseCsv(exported.text)[0]).toContain('Lernende');
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 2,
      errors: [],
    });

    // By external ref: the name may change. Without ref: by name + PLZ (spaces ignored).
    const update = await importCsv(
      'Name;PLZ;Externe Ref.;Ort\r\nE2E-LBK-Alpli Neu;8000;E2E-LBK-R1;Zürich\r\nE2E-LBK-Beta;17 00;;',
      false,
    ).expect(200);
    expect(update.body.errors).toEqual([]);
    expect(update.body).toMatchObject({
      updated: 2,
      created: 0,
      written: true,
    });
    const rows = await ds.query(
      `SELECT name, city FROM training_company WHERE name LIKE 'E2E-LBK-%' ORDER BY name`,
    );
    expect(rows).toEqual([
      { name: 'E2E-LBK-Alpli Neu', city: 'Zürich' },
      { name: 'E2E-LBK-Beta', city: null },
    ]);
  });

  it('searches word by word ignoring accents and pages with X-Total-Count', async () => {
    const res = await api()
      .get('/training-companies?q=alpli%20zurich')
      .set(asPlanner)
      .expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual([
      'E2E-LBK-Alpli Neu',
    ]);
    expect(res.body[0]).toMatchObject({
      active: true,
      apprenticeCount: 0,
      trainerCount: 0,
    });

    const byRef = await api()
      .get('/training-companies?q=e2e-lbk-r1')
      .set(asPlanner)
      .expect(200);
    expect(byRef.body).toHaveLength(1);

    const paged = await api()
      .get('/training-companies?q=E2E-LBK&page=1&pageSize=1&sort=name&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(paged.headers['x-total-count']).toBe('2');
    expect(paged.body.map((c: { name: string }) => c.name)).toEqual([
      'E2E-LBK-Beta',
    ]);
  });

  it('archives and restores in bulk and filters by archive scope', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM training_company WHERE name LIKE 'E2E-LBK-%' ORDER BY name`,
    );
    const ids = rows.map((r) => r.id);

    await api()
      .post('/training-companies/bulk')
      .set(asInstructor)
      .send({ action: 'archive', ids })
      .expect(403);
    const archived = await api()
      .post('/training-companies/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids })
      .expect(200);
    expect(archived.body.failed).toEqual([]);
    expect([...(archived.body.succeeded as string[])].sort(byText)).toEqual(
      [...ids].sort(byText),
    );

    const active = await api()
      .get('/training-companies?q=E2E-LBK&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(active.body).toHaveLength(0);
    const onlyArchived = await api()
      .get('/training-companies?q=E2E-LBK&archive=archived')
      .set(asPlanner)
      .expect(200);
    expect(onlyArchived.body).toHaveLength(2);
    // Without `archive` the list keeps returning every row (pickers).
    const all = await api()
      .get('/training-companies?q=E2E-LBK')
      .set(asPlanner)
      .expect(200);
    expect(all.body).toHaveLength(2);

    await api()
      .post('/training-companies/bulk')
      .set(asPlanner)
      .send({ action: 'restore', ids: [ids[0]] })
      .expect(200);
    const after = await api()
      .get('/training-companies?q=E2E-LBK&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(after.body.map((c: { id: string }) => c.id)).toEqual([ids[0]]);
  });

  it('deletes in bulk and reports referenced rows as failed', async () => {
    const rows: { id: string; name: string }[] = await ds.query(
      `SELECT id, name FROM training_company WHERE name LIKE 'E2E-LBK-%' ORDER BY name`,
    );
    const [a, b] = rows;
    await api()
      .post(`/training-companies/${a.id}/trainers`)
      .set(asPlanner)
      .send({ firstName: 'E2E', lastName: 'Berufsbildner' })
      .expect(201);

    const res = await api()
      .post('/training-companies/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids: [a.id, b.id] })
      .expect(200);
    expect(res.body).toEqual({
      succeeded: [b.id],
      failed: [
        {
          id: a.id,
          label: a.name,
          message: 'Wird noch von Berufsbildnern verwendet.',
        },
      ],
    });
  });
});
