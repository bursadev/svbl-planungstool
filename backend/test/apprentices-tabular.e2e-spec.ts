import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { Apprentice } from '../src/apprentices/apprentice.entity.js';
import { SchoolClass } from '../src/apprentices/school-class.entity.js';
import { TrainingCompany } from '../src/apprentices/training-company.entity.js';
import { VocationalSchool } from '../src/apprentices/vocational-school.entity.js';
import { parseCsv } from '../src/common/csv.js';
import { Cohort } from '../src/curriculum/cohort.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

/**
 * Export, archive scope (by status), search, filters, sorting and paging of
 * /apprentices; export only, so no template, import or bulk. Rows are
 * prefixed E2E-BS-L.
 */
describe('Apprentices CSV export and list (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let schoolId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    const location = await ds.getRepository(Location).save({
      code: 'E2E-BS-LLOC',
      name: 'E2E-BS-L Zentrum',
      kind: 'training_centre',
      languageRegion: 'de',
    });
    const school = await ds.getRepository(VocationalSchool).save({
      name: 'E2E-BS-L Schule',
      shortName: 'E2E-BS-LS',
      language: 'de',
      nearestLocationId: location.id,
    });
    schoolId = school.id;
    const cohort = await ds
      .getRepository(Cohort)
      .save({ track: 'efz', startYear: 2084, label: 'E2E-BS-L 2084 EFZ' });
    const cls = await ds
      .getRepository(SchoolClass)
      .save({
        vocationalSchoolId: school.id,
        code: 'E2E-BS-LK1',
        track: 'efz',
        startYear: 2084,
      });
    const company = await ds
      .getRepository(TrainingCompany)
      .save({ name: 'E2E-BS-L Gärtnerei Müller', postalCode: '5000' });
    const base = {
      birthDate: '2068-03-04',
      track: 'efz',
      cohortId: cohort.id,
      vocationalSchoolId: school.id,
    } as const;
    await ds.getRepository(Apprentice).save([
      {
        ...base,
        firstName: 'Zoë',
        lastName: 'E2E-BS-L Ackermann',
        externalId: 'E2E-BS-L-001',
        email: 'zoe@example.ch',
        language: 'de',
        schoolClassId: cls.id,
        trainingCompanyId: company.id,
        ahvNumber: '756.9999.0000.01',
        apprenticeshipStart: '2084-08-01',
        gender: 'f',
      },
      {
        ...base,
        firstName: 'Anna',
        lastName: 'E2E-BS-L Ackermann',
        language: 'de',
      },
      { ...base, firstName: 'Luc', lastName: 'E2E-BS-L Blanc', language: 'fr' },
      {
        ...base,
        firstName: 'Max',
        lastName: 'E2E-BS-L Fertig',
        language: 'de',
        status: 'finished',
      },
      {
        ...base,
        firstName: 'Mia',
        lastName: 'E2E-BS-L Weg',
        language: 'de',
        status: 'dropped',
      },
    ] as never);
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(`DELETE FROM "apprentice" WHERE last_name LIKE 'E2E-BS-L%'`);
    await ds.query(`DELETE FROM "school_class" WHERE code LIKE 'E2E-BS-L%'`);
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name LIKE 'E2E-BS-L%'`,
    );
    await ds.query(
      `DELETE FROM "training_company" WHERE name LIKE 'E2E-BS-L%'`,
    );
    await ds.query(`DELETE FROM "cohort" WHERE label LIKE 'E2E-BS-L%'`);
    await ds.query(`DELETE FROM "location" WHERE code LIKE 'E2E-BS-L%'`);
  }

  const api = () => request(app.getHttpServer());
  const names = (body: { firstName: string }[]) => body.map((a) => a.firstName);

  it('maps the archive scope onto the status; without it all rows come back', async () => {
    const all = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}`)
      .set(asInstructor)
      .expect(200);
    expect(all.body).toHaveLength(5);
    const active = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}&archive=active`)
      .set(asInstructor)
      .expect(200);
    expect(names(active.body).sort()).toEqual(['Anna', 'Luc', 'Zoë']);
    const archived = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}&archive=archived`)
      .set(asInstructor)
      .expect(200);
    expect(names(archived.body).sort()).toEqual(['Max', 'Mia']);
  });

  it('searches name, external id, e-mail, company and class ignoring accents', async () => {
    for (const q of [
      'zoe',
      'E2E-BS-L-001',
      'zoe@example',
      'gartnerei muller',
      'E2E-BS-LK1',
    ]) {
      const res = await api()
        .get(`/apprentices?q=${encodeURIComponent(q)}`)
        .set(asInstructor)
        .expect(200);
      expect(names(res.body)).toEqual(['Zoë']);
    }
    const french = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}&language=fr`)
      .set(asInstructor)
      .expect(200);
    expect(names(french.body)).toEqual(['Luc']);
  });

  it('sorts by last then first name and pages with X-Total-Count', async () => {
    const first = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}&page=1&pageSize=2`)
      .set(asInstructor)
      .expect(200);
    expect(first.headers['x-total-count']).toBe('5');
    expect(names(first.body)).toEqual(['Anna', 'Zoë']);
    const second = await api()
      .get(`/apprentices?vocationalSchoolId=${schoolId}&page=2&pageSize=2`)
      .set(asInstructor)
      .expect(200);
    expect(names(second.body)).toEqual(['Luc', 'Max']);
    const desc = await api()
      .get(
        `/apprentices?vocationalSchoolId=${schoolId}&sort=name&dir=desc&page=1&pageSize=1`,
      )
      .set(asInstructor)
      .expect(200);
    expect(names(desc.body)).toEqual(['Mia']);
    const byCompany = await api()
      .get(
        `/apprentices?vocationalSchoolId=${schoolId}&sort=company&page=1&pageSize=1`,
      )
      .set(asInstructor)
      .expect(200);
    expect(names(byCompany.body)).toEqual(['Zoë']);
  });

  it('exports the filtered rows without the AHV number and has no import', async () => {
    const res = await api()
      .get(
        `/apprentices/export.csv?vocationalSchoolId=${schoolId}&archive=active`,
      )
      .set(asPlanner)
      .expect(200);
    expect(res.headers['content-disposition']).toMatch(
      /lernende-\d{4}-\d{2}-\d{2}\.csv/,
    );
    expect(res.text).not.toContain('756.9999');
    const [header, ...rows] = parseCsv(res.text);
    expect(header).not.toContain('AHV-Nummer');
    expect(rows).toHaveLength(3);
    const zoe = Object.fromEntries(
      header.map((h, i) => [h, rows.find((r) => r.includes('Zoë'))![i]]),
    );
    expect(zoe).toMatchObject({
      'Externe ID': 'E2E-BS-L-001',
      Nachname: 'E2E-BS-L Ackermann',
      Geburtsdatum: '04.03.2068',
      Geschlecht: 'weiblich',
      Sprache: 'Deutsch',
      Lehrgang: 'EFZ',
      Jahrgang: 'E2E-BS-L 2084 EFZ',
      Berufsschule: 'E2E-BS-LS',
      Klasse: 'E2E-BS-LK1',
      Lehrbetrieb: 'E2E-BS-L Gärtnerei Müller',
      Lehrbeginn: '01.08.2084',
      Status: 'aktiv',
    });

    await api()
      .get('/apprentices/import-template.csv')
      .set(asPlanner)
      .expect(404);
    await api()
      .post('/apprentices/import')
      .set(asPlanner)
      .send({ csv: 'x' })
      .expect(404);
    await api().post('/apprentices/bulk').set(asPlanner).send({}).expect(404);
  });
});
