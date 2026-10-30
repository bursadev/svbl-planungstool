import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { CertificateType } from '../src/instructors/certificate-type.entity.js';
import { InstructorCertificate } from '../src/instructors/instructor-certificate.entity.js';
import { Skill } from '../src/instructors/skill.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

/** CSV template, export, import, bulk actions, archive filter, search, filters and paging of /instructors. */
describe('Instructors CSV and bulk (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let skillA: string;
  let skillB: string;
  let certTypeId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    await ds.getRepository(Location).save({
      code: 'E2E-AUS-LOC',
      name: 'E2E-AUS Zürich Ort',
      kind: 'training_centre',
      languageRegion: 'de',
    });
    skillA = (await ds.getRepository(Skill).save({ name: 'E2E-AUS Skill A' }))
      .id;
    skillB = (await ds.getRepository(Skill).save({ name: 'E2E-AUS Skill B' }))
      .id;
    certTypeId = (
      await ds.getRepository(CertificateType).save({
        code: 'E2E-AUS-CT',
        name: 'E2E-AUS Zertifikat',
        validityYears: 2,
        warningLeadDays: 60,
      })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(`DELETE FROM "instructor" WHERE last_name LIKE 'E2E-AUS%'`);
    await ds.query(`DELETE FROM "certificate_type" WHERE code = 'E2E-AUS-CT'`);
    await ds.query(`DELETE FROM "skill" WHERE name LIKE 'E2E-AUS%'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2E-AUS-LOC'`);
  }

  const api = () => request(app.getHttpServer());
  const header =
    'Vorname;Nachname;E-Mail;Telefon;Anstellung;Heimstandort;Sprachen;Skills;Wochenstunden;Überstunden-Limit;Kostensatz;Max. Reisezeit (Min.);Externe Ref.;Status';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/instructors/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });
  const lastNames = (body: { lastName: string }[]) =>
    body.map((i) => i.lastName);

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/instructors/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(
      'ausbilder-vorlage.csv',
    );
    const rows = parseCsv(res.text);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(header.split(';'));
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'Ida;E2E-AUS Alpha;ida@e2e-aus.test;;Angestellt;E2E-AUS-LOC;Deutsch;;;;;;;',
        'Max;E2E-AUS Beta;max@e2e-aus.test;;Chef;NOPE;Klingonisch;Fliegen;viel;;;1.5;;',
        'Eva;E2E-AUS Gamma;IDA@e2e-aus.test;;Angestellt;E2E-AUS-LOC;Deutsch;;;;;;;',
        'Ohne;E2E-AUS Key;;;Angestellt;E2E-AUS-LOC;Deutsch;;;;;;;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        {
          line: 3,
          column: 'Anstellung',
          message: expect.stringContaining('Unbekannter Wert «Chef»'),
        },
        { line: 3, column: 'Heimstandort', message: '«NOPE» nicht gefunden.' },
        {
          line: 3,
          column: 'Sprachen',
          message: expect.stringContaining('Klingonisch'),
        },
        { line: 3, column: 'Skills', message: '«Fliegen» nicht gefunden.' },
        { line: 3, column: 'Wochenstunden', message: 'Zahl erwartet.' },
        {
          line: 3,
          column: 'Max. Reisezeit (Min.)',
          message: 'Ganze Zahl erwartet.',
        },
        {
          line: 4,
          column: 'E-Mail / Externe Ref.',
          message: 'Doppelt in der Datei (Zeile 2).',
        },
        {
          line: 5,
          column: 'E-Mail / Externe Ref.',
          message: 'Schlüssel fehlt.',
        },
      ]),
    );
    const count = await ds.query(
      `SELECT count(*)::int AS n FROM instructor WHERE last_name LIKE 'E2E-AUS%'`,
    );
    expect(count[0].n).toBe(0);
  });

  it('needs a key column, and required fields only for new rows', async () => {
    const noKey = await importCsv('Vorname\r\nX', true).expect(200);
    // One of the key columns has to be there.
    expect(noKey.body.errors).toEqual([
      { line: 1, column: 'E-Mail / Externe Ref.', message: 'Spalte fehlt.' },
    ]);
    const res = await importCsv(
      'E-Mail;Vorname\r\nneu@e2e-aus.test;Neu',
      true,
    ).expect(200);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        {
          line: 2,
          column: 'Heimstandort',
          message: 'Pflichtfeld (Spalte fehlt).',
        },
        { line: 2, column: 'Sprachen', message: 'Pflichtfeld (Spalte fehlt).' },
      ]),
    );
  });

  it('imports with skills, re-imports its export unchanged and updates by e-mail or ref', async () => {
    const body = csv(
      'Ida;E2E-AUS Älpli;ida@e2e-aus.test;+41 79 000 00 01;Angestellt;e2e-aus-loc;Deutsch, Französisch;E2E-AUS Skill A, E2E-AUS Skill B;42,5;100;95.5;60;;Aktiv',
      'Luc;E2E-AUS Beta;;;Freelancer;E2E-AUS-LOC;Französisch;;;;;;E2E-AUS-REF-1;',
    );
    const dry = await importCsv(body, true).expect(200);
    expect(dry.body).toMatchObject({
      dryRun: true,
      written: false,
      created: 2,
      errors: [],
    });

    const real = await importCsv(body, false).expect(200);
    expect(real.body).toMatchObject({
      written: true,
      created: 2,
      updated: 0,
      errors: [],
    });
    const [ida] = await ds.query(
      `SELECT id, weekly_hours, cost_rate, status, languages::text[] AS languages FROM instructor WHERE email = 'ida@e2e-aus.test'`,
    );
    expect(ida).toMatchObject({
      weekly_hours: '42.50',
      cost_rate: '95.50',
      status: 'active',
      languages: ['de', 'fr'],
    });
    const skills = await ds.query(
      `SELECT skill_id FROM instructor_skill WHERE instructor_id = $1`,
      [ida.id],
    );
    expect(skills.map((s: { skill_id: string }) => s.skill_id).sort()).toEqual(
      [skillA, skillB].sort(),
    );

    const exported = await api()
      .get('/instructors/export.csv?q=E2E-AUS')
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /ausbilder-\d{4}-\d{2}-\d{2}\.csv/,
    );
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 2,
      errors: [],
    });

    // Matched by e-mail (case-insensitive) and by external ref; empty Skills clears them.
    const update = await importCsv(
      'E-Mail;Externe Ref.;Nachname;Skills;Telefon\r\nIDA@E2E-AUS.TEST;;E2E-AUS Älpli;E2E-AUS Skill B;\r\n;E2E-AUS-REF-1;E2E-AUS Beta Neu;;',
      false,
    ).expect(200);
    expect(update.body.errors).toEqual([]);
    expect(update.body).toMatchObject({
      updated: 2,
      created: 0,
      written: true,
    });
    const after = await ds.query(
      `SELECT skill_id FROM instructor_skill WHERE instructor_id = $1`,
      [ida.id],
    );
    expect(after).toEqual([{ skill_id: skillB }]);
    const [idaRow] = await ds.query(
      `SELECT phone, weekly_hours FROM instructor WHERE id = $1`,
      [ida.id],
    );
    // Columns that are not in the file stay; an empty nullable cell clears.
    expect(idaRow).toEqual({ phone: null, weekly_hours: '42.50' });
    const [luc] = await ds.query(
      `SELECT last_name FROM instructor WHERE external_ref = 'E2E-AUS-REF-1'`,
    );
    expect(luc.last_name).toBe('E2E-AUS Beta Neu');
  });

  it('searches word by word ignoring accents, filters by certificate and pages with X-Total-Count', async () => {
    const res = await api()
      .get('/instructors?q=alpli%20ida')
      .set(asPlanner)
      .expect(200);
    expect(lastNames(res.body)).toEqual(['E2E-AUS Älpli']);
    const byLocation = await api()
      .get('/instructors?q=zurich%20ort')
      .set(asPlanner)
      .expect(200);
    expect(lastNames(byLocation.body).sort()).toEqual(
      ['E2E-AUS Beta Neu', 'E2E-AUS Älpli'].sort(),
    );

    const paged = await api()
      .get('/instructors?q=E2E-AUS&page=1&pageSize=1&sort=name&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(paged.headers['x-total-count']).toBe('2');
    expect(lastNames(paged.body)).toEqual(['E2E-AUS Älpli']);
    for (const sort of ['location', 'employmentType']) {
      const sorted = await api()
        .get(`/instructors?q=E2E-AUS&page=1&pageSize=1&sort=${sort}`)
        .set(asPlanner)
        .expect(200);
      expect(sorted.headers['x-total-count']).toBe('2');
      expect(sorted.body).toHaveLength(1);
    }
    const byEmployment = await api()
      .get('/instructors?q=E2E-AUS&sort=employmentType&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(lastNames(byEmployment.body)).toEqual([
      'E2E-AUS Beta Neu',
      'E2E-AUS Älpli',
    ]);

    const [ida] = await ds.query(
      `SELECT id FROM instructor WHERE lower(email) = 'ida@e2e-aus.test'`,
    );
    const soon = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
    await ds.getRepository(InstructorCertificate).save({
      instructorId: ida.id,
      certificateTypeId: certTypeId,
      issuedOn: '2024-01-01',
      validUntil: soon,
    });
    const byType = await api()
      .get(`/instructors?q=E2E-AUS&certificateTypeId=${certTypeId}`)
      .set(asPlanner)
      .expect(200);
    expect(lastNames(byType.body)).toEqual(['E2E-AUS Älpli']);
    const expiring = await api()
      .get(
        `/instructors?q=E2E-AUS&certificateTypeId=${certTypeId}&certificateStatus=expiring`,
      )
      .set(asPlanner)
      .expect(200);
    expect(lastNames(expiring.body)).toEqual(['E2E-AUS Älpli']);
    const valid = await api()
      .get('/instructors?q=E2E-AUS&certificateStatus=valid')
      .set(asPlanner)
      .expect(200);
    expect(valid.body).toHaveLength(0);
    const expired = await api()
      .get('/instructors?q=E2E-AUS&certificateStatus=expired')
      .set(asPlanner)
      .expect(200);
    expect(expired.body).toHaveLength(0);
  });

  it('archives and restores in bulk and filters by archive scope', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM instructor WHERE last_name LIKE 'E2E-AUS%' ORDER BY last_name`,
    );
    const ids = rows.map((r) => r.id);

    await api()
      .post('/instructors/bulk')
      .set(asInstructor)
      .send({ action: 'archive', ids })
      .expect(403);
    const archived = await api()
      .post('/instructors/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids })
      .expect(200);
    expect(archived.body.failed).toEqual([]);
    expect(archived.body.succeeded).toEqual(expect.arrayContaining(ids));
    expect(archived.body.succeeded).toHaveLength(ids.length);
    const statuses = await ds.query(
      `SELECT DISTINCT status FROM instructor WHERE id = ANY($1)`,
      [ids],
    );
    expect(statuses).toEqual([{ status: 'inactive' }]);

    const active = await api()
      .get('/instructors?q=E2E-AUS&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(active.body).toHaveLength(0);
    const onlyArchived = await api()
      .get('/instructors?q=E2E-AUS&archive=archived')
      .set(asPlanner)
      .expect(200);
    expect(onlyArchived.body).toHaveLength(2);
    // Without `archive` every row is listed (dropdowns elsewhere).
    const all = await api()
      .get('/instructors?q=E2E-AUS')
      .set(asPlanner)
      .expect(200);
    expect(all.body).toHaveLength(2);

    await api()
      .post('/instructors/bulk')
      .set(asPlanner)
      .send({ action: 'restore', ids: [ids[0]] })
      .expect(200);
    const after = await api()
      .get('/instructors?q=E2E-AUS&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(after.body.map((i: { id: string }) => i.id)).toEqual([ids[0]]);
  });

  it('deletes in bulk with skills and certificates', async () => {
    const rows: { id: string }[] = await ds.query(
      `SELECT id FROM instructor WHERE last_name LIKE 'E2E-AUS%'`,
    );
    const res = await api()
      .post('/instructors/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids: rows.map((r) => r.id) })
      .expect(200);
    expect(res.body.failed).toEqual([]);
    expect(res.body.succeeded).toHaveLength(2);
    const left = await ds.query(
      `SELECT count(*)::int AS n FROM instructor WHERE last_name LIKE 'E2E-AUS%'`,
    );
    expect(left[0].n).toBe(0);
  });
});
