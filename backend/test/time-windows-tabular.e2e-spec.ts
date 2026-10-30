import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Cohort } from '../src/curriculum/cohort.entity.js';
import { CurriculumModule } from '../src/curriculum/curriculum-module.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const byText = (a: string, b: string) => a.localeCompare(b);

/**
 * CSV template, export, import and bulk delete of /time-windows. Rows use the
 * prefix E2E-KTW (not E2E-KT-, which the course-type file cleans up in parallel).
 */
describe('Time windows CSV and bulk (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let cohortEfz: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    const mk = async (code: string, track: 'efz' | 'eba', sequence: number) => {
      const type = await ds.getRepository(CourseType).save({
        code,
        name: `${code} Modul`,
        kind: 'uk',
        track,
        durationDays: 2,
        languages: ['de'],
        maxParticipants: 12,
      });
      await ds
        .getRepository(CurriculumModule)
        .save({ track, courseTypeId: type.id, semester: 1, sequence });
    };
    await mk('E2E-KTW-1', 'efz', 9911);
    await mk('E2E-KTW-2', 'efz', 9912);
    await mk('E2E-KTW-3', 'eba', 9913);
    cohortEfz = (
      await ds
        .getRepository(Cohort)
        .save({ track: 'efz', startYear: 2097, label: 'E2E-KTW 2097 EFZ' })
    ).id;
    await ds
      .getRepository(Cohort)
      .save({ track: 'eba', startYear: 2097, label: 'E2E-KTW 2097 EBA' });
    await ds.getRepository(Location).save({
      code: 'E2E-KTW-LOC',
      name: 'E2E-KTW Ort',
      kind: 'training_centre',
      languageRegion: 'de',
    });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "time_window" WHERE cohort_id IN (SELECT id FROM "cohort" WHERE label LIKE 'E2E-KTW%')`,
    );
    await ds.query(
      `DELETE FROM "curriculum_module" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code LIKE 'E2E-KTW-%')`,
    );
    await ds.query(`DELETE FROM "cohort" WHERE label LIKE 'E2E-KTW%'`);
    await ds.query(`DELETE FROM "course_type" WHERE code LIKE 'E2E-KTW-%'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2E-KTW-LOC'`);
  }

  const api = () => request(app.getHttpServer());
  const header = 'Modul;Jahrgang;Standort;Von;Bis;Notiz';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/time-windows/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });
  const windows = (): Promise<
    { id: string; note: string | null; ends_on: string }[]
  > =>
    ds.query(
      `SELECT w.id, w.note, to_char(w.ends_on, 'YYYY-MM-DD') AS ends_on
         FROM time_window w JOIN cohort c ON c.id = w.cohort_id
        WHERE c.label LIKE 'E2E-KTW%' ORDER BY w.starts_on, w.location_id NULLS FIRST`,
    );

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/time-windows/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-disposition']).toContain(
      'zeitfenster-vorlage.csv',
    );
    const lines = parseCsv(res.text);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual([
      'Modul',
      'Jahrgang',
      'Standort',
      'Von',
      'Bis',
      'Notiz',
    ]);
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-KTW-1;E2E-KTW 2097 EFZ;;07.09.2097;18.12.2097;',
        'E2E-KTW-9;E2E-KTW 2097 EFZ;;31.02.2097;18.12.2097;',
        'E2E-KTW-2;E2E-KTW 2097 EFZ;;18.12.2097;07.09.2097;',
        'E2E-KTW-1;e2e-ktw 2097 efz;;01.01.2098;02.01.2098;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { line: 3, column: 'Modul', message: '«E2E-KTW-9» nicht gefunden.' },
        { line: 3, column: 'Von', message: 'Ungültiges Datum.' },
        {
          line: 4,
          column: 'Bis',
          message: 'Das Enddatum liegt vor dem Startdatum.',
        },
        {
          line: 5,
          column: 'Modul / Jahrgang / Standort',
          message: 'Doppelt in der Datei (Zeile 2).',
        },
      ]),
    );
    expect(await windows()).toHaveLength(0);
  });

  it('rejects a module and cohort of different Lehrgänge and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-KTW-1;E2E-KTW 2097 EFZ;;07.09.2097;18.12.2097;',
        'E2E-KTW-3;E2E-KTW 2097 EFZ;;07.09.2097;18.12.2097;',
      ),
      false,
    ).expect(400);
    expect(res.body.message).toContain('nicht zum selben Lehrgang');
    expect(await windows()).toHaveLength(0);
  });

  it('imports, re-imports its export unchanged and updates by module, cohort and Standort', async () => {
    const body = csv(
      'E2E-KTW-1;E2E-KTW 2097 EFZ;;07.09.2097;18.12.2097;',
      'E2E-KTW-1;E2E-KTW 2097 EFZ;E2E-KTW-LOC;07.09.2097;20.12.2097;regional',
      'E2E-KTW-2;E2E-KTW 2097 EFZ;;2098-01-05;2098-03-27;',
    );
    const dry = await importCsv(body, true).expect(200);
    expect(dry.body).toMatchObject({
      dryRun: true,
      written: false,
      created: 3,
      errors: [],
    });
    const real = await importCsv(body, false).expect(200);
    expect(real.body).toMatchObject({ written: true, created: 3 });

    const exported = await api()
      .get(`/time-windows/export.csv?cohortId=${cohortEfz}`)
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /zeitfenster-\d{4}-\d{2}-\d{2}\.csv/,
    );
    const lines = parseCsv(exported.text);
    expect(lines).toHaveLength(4);
    expect(lines[1].slice(0, 5)).toEqual([
      'E2E-KTW-1',
      'E2E-KTW 2097 EFZ',
      '',
      '07.09.2097',
      '18.12.2097',
    ]);
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 3,
      errors: [],
    });

    const update = await importCsv(
      csv('E2E-KTW-1;E2E-KTW 2097 EFZ;;07.09.2097;23.12.2097;verlängert'),
      false,
    ).expect(200);
    expect(update.body).toMatchObject({
      created: 0,
      updated: 1,
      written: true,
      errors: [],
    });
    const [first, regional] = await windows();
    expect(first).toMatchObject({ note: 'verlängert', ends_on: '2097-12-23' });
    expect(regional).toMatchObject({ note: 'regional', ends_on: '2097-12-20' });
  });

  it('deletes in bulk and cannot archive', async () => {
    const ids = (await windows()).map((w) => w.id);
    await api()
      .post('/time-windows/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids })
      .expect(400);
    await api()
      .post('/time-windows/bulk')
      .set(asInstructor)
      .send({ action: 'delete', ids })
      .expect(403);
    const res = await api()
      .post('/time-windows/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids })
      .expect(200);
    expect(res.body.failed).toEqual([]);
    expect([...res.body.succeeded].sort(byText)).toEqual([...ids].sort(byText));
    expect(await windows()).toHaveLength(0);
    const audit = await ds.query(
      `SELECT summary FROM audit_entry WHERE entity_id = $1 AND action = 'delete'`,
      [ids[0]],
    );
    expect(audit[0].summary).toBe(
      'hat Zeitfenster «07.09.2097 – 23.12.2097» gelöscht',
    );
  });
});
