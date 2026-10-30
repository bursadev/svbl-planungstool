import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { CourseTypeDevice } from '../src/courses/course-type-device.entity.js';
import { CurriculumModule } from '../src/curriculum/curriculum-module.entity.js';
import { DeviceType } from '../src/devices/device-type.entity.js';
import { CertificateType } from '../src/instructors/certificate-type.entity.js';
import { Skill } from '../src/instructors/skill.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const byText = (a: string, b: string) => a.localeCompare(b);

type Row = { id: string; code: string };

/** CSV template, export, import, bulk actions, archive filter, search and paging of /course-types. */
describe('Course types CSV and bulk (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let skillId: string;
  let certId: string;
  let deviceTypeId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    skillId = (await ds.getRepository(Skill).save({ name: 'E2E-KT Skill' })).id;
    certId = (
      await ds
        .getRepository(CertificateType)
        .save({ code: 'E2E-KT-CT', name: 'E2E-KT Zertifikat' })
    ).id;
    deviceTypeId = (
      await ds
        .getRepository(DeviceType)
        .save({ code: 'E2E-KT-DT', name: 'E2E-KT Gerät', category: 'forklift' })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "curriculum_module" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code LIKE 'E2E-KT-%')`,
    );
    await ds.query(`DELETE FROM "course_type" WHERE code LIKE 'E2E-KT-%'`);
    await ds.query(`DELETE FROM "device_type" WHERE code = 'E2E-KT-DT'`);
    await ds.query(`DELETE FROM "certificate_type" WHERE code = 'E2E-KT-CT'`);
    await ds.query(`DELETE FROM "skill" WHERE name = 'E2E-KT Skill'`);
  }

  const api = () => request(app.getHttpServer());
  const header =
    'Code;Name;Art;Lehrgang;Dauer (Tage);Sprachen;Min. Teilnehmende;Max. Teilnehmende;Beschreibung;Skills;Zertifikatstypen';
  const csv = (...lines: string[]) => [header, ...lines].join('\r\n');
  const importCsv = (body: string, dryRun: boolean) =>
    api()
      .post(`/course-types/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });
  const rows = (): Promise<Row[]> =>
    ds.query(
      `SELECT id, code FROM course_type WHERE code LIKE 'E2E-KT-%' ORDER BY code`,
    );

  it('serves the template with header and two example rows', async () => {
    const res = await api()
      .get('/course-types/import-template.csv')
      .set(asInstructor)
      .expect(200);
    expect(res.headers['content-disposition']).toContain(
      'kurstypen-vorlage.csv',
    );
    const lines = parseCsv(res.text);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual(
      expect.arrayContaining([
        'Code',
        'Sprachen',
        'Skills',
        'Zertifikatstypen',
      ]),
    );
    expect(lines[0]).not.toContain('Geräte');
  });

  it('reports errors per line and column and writes nothing', async () => {
    const res = await importCsv(
      csv(
        'E2E-KT-A;Alpha;ÜK;EFZ;2;Deutsch;;12;;E2E-KT Skill;',
        'E2E-KT-B;Beta;Kurs;;null;Klingonisch;20;10;;Unbekannt;',
        'E2E-KT-C;Gamma;Erwachsene;;1;Deutsch;20;10;;;',
      ),
      false,
    ).expect(200);
    expect(res.body.written).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        {
          line: 3,
          column: 'Art',
          message: expect.stringContaining('Unbekannter Wert «Kurs»'),
        },
        { line: 3, column: 'Dauer (Tage)', message: 'Ganze Zahl erwartet.' },
        {
          line: 3,
          column: 'Sprachen',
          message: expect.stringContaining('Klingonisch'),
        },
        { line: 3, column: 'Skills', message: '«Unbekannt» nicht gefunden.' },
        {
          line: 4,
          column: 'Min. Teilnehmende',
          message: 'Die Mindestteilnehmerzahl liegt über dem Maximum.',
        },
      ]),
    );
    expect(await rows()).toHaveLength(0);
  });

  it('imports with requirements, re-imports its export unchanged and keeps device requirements', async () => {
    const body = csv(
      'E2E-KT-A;Älpli Grundkurs;ÜK;EFZ;2;Deutsch, Französisch;6;12;Lager;E2E-KT Skill;E2E-KT-CT',
      'E2E-KT-B;Beta Stapler;Erwachsene;;1;Deutsch;;8;;;',
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

    const [a] = await rows();
    await ds
      .getRepository(CourseTypeDevice)
      .save({ courseTypeId: a.id, deviceTypeId, quantity: 2 });
    const view = await api()
      .get(`/course-types/${a.id}`)
      .set(asPlanner)
      .expect(200);
    expect(view.body).toMatchObject({
      languages: ['de', 'fr'],
      track: 'efz',
      requiredSkills: [{ id: skillId }],
      requiredCertificates: [{ id: certId }],
    });

    const exported = await api()
      .get('/course-types/export.csv?q=E2E-KT-')
      .set(asPlanner)
      .expect(200);
    expect(exported.headers['content-disposition']).toMatch(
      /kurstypen-\d{4}-\d{2}-\d{2}\.csv/,
    );
    expect(exported.text).toContain('E2E-KT-DT×2');
    const again = await importCsv(exported.text, false).expect(200);
    expect(again.body).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 2,
      errors: [],
    });

    // An empty Skills cell clears the skills; certificates (not in the file) and devices stay.
    const update = await importCsv(
      'Code;Name;Skills\r\nE2E-KT-A;Älpli Neu;',
      false,
    ).expect(200);
    expect(update.body).toMatchObject({
      updated: 1,
      written: true,
      errors: [],
    });
    const after = await api()
      .get(`/course-types/${a.id}`)
      .set(asPlanner)
      .expect(200);
    expect(after.body).toMatchObject({
      name: 'Älpli Neu',
      requiredSkills: [],
      requiredCertificates: [{ id: certId }],
      requiredDevices: [{ deviceType: { id: deviceTypeId }, quantity: 2 }],
    });
  });

  it('searches ignoring accents, filters by language and track and pages with X-Total-Count', async () => {
    const search = await api()
      .get('/course-types?q=alpli%20e2e-kt')
      .set(asPlanner)
      .expect(200);
    expect(search.body.map((t: Row) => t.code)).toEqual(['E2E-KT-A']);

    const french = await api()
      .get('/course-types?q=E2E-KT-&language=fr')
      .set(asPlanner)
      .expect(200);
    expect(french.body.map((t: Row) => t.code)).toEqual(['E2E-KT-A']);
    const noTrack = await api()
      .get('/course-types?q=E2E-KT-&track=none')
      .set(asPlanner)
      .expect(200);
    expect(noTrack.body.map((t: Row) => t.code)).toEqual(['E2E-KT-B']);

    const paged = await api()
      .get('/course-types?q=E2E-KT-&page=1&pageSize=1&sort=duration&dir=desc')
      .set(asPlanner)
      .expect(200);
    expect(paged.headers['x-total-count']).toBe('2');
    expect(paged.body.map((t: Row) => t.code)).toEqual(['E2E-KT-A']);
    expect(paged.body[0].requiredDevices).toHaveLength(1);
  });

  it('archives and restores in bulk and filters by archive scope', async () => {
    const ids = (await rows()).map((r) => r.id);
    await api()
      .post('/course-types/bulk')
      .set(asInstructor)
      .send({ action: 'archive', ids })
      .expect(403);
    const archived = await api()
      .post('/course-types/bulk')
      .set(asPlanner)
      .send({ action: 'archive', ids })
      .expect(200);
    expect(archived.body.failed).toEqual([]);
    expect([...archived.body.succeeded].sort(byText)).toEqual(
      [...ids].sort(byText),
    );

    const active = await api()
      .get('/course-types?q=E2E-KT-&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(active.body).toHaveLength(0);
    const onlyArchived = await api()
      .get('/course-types?q=E2E-KT-&archive=archived')
      .set(asPlanner)
      .expect(200);
    expect(onlyArchived.body).toHaveLength(2);

    await api()
      .post('/course-types/bulk')
      .set(asPlanner)
      .send({ action: 'restore', ids: [ids[0]] })
      .expect(200);
    const after = await api()
      .get('/course-types?q=E2E-KT-&archive=active')
      .set(asPlanner)
      .expect(200);
    expect(after.body.map((t: Row) => t.code)).toEqual(['E2E-KT-A']);
  });

  it('deletes in bulk and reports referenced rows as failed', async () => {
    const [a, b] = await rows();
    await ds.getRepository(CurriculumModule).save({
      track: 'efz',
      courseTypeId: a.id,
      semester: 1,
      sequence: 9901,
    });
    const res = await api()
      .post('/course-types/bulk')
      .set(asPlanner)
      .send({ action: 'delete', ids: [a.id, b.id] })
      .expect(200);
    expect(res.body).toEqual({
      succeeded: [b.id],
      failed: [
        {
          id: a.id,
          label: 'E2E-KT-A Älpli Neu',
          message: 'Wird noch von Bildungsplan-Modulen verwendet.',
        },
      ],
    });
    expect((await rows()).map((r) => r.code)).toEqual(['E2E-KT-A']);
  });
});
