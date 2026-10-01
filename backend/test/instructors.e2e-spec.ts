import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { CertificateType } from '../src/instructors/certificate-type.entity.js';
import { Skill } from '../src/instructors/skill.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2EI.
describe('Instructors (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let locationId: string;
  let skillId: string;
  let certTypeId: string;
  const api = () => request(app.getHttpServer());

  const base = () => ({
    firstName: 'Ida',
    lastName: 'E2EI Test',
    email: 'ida@e2ei.test',
    employmentType: 'employee',
    homeLocationId: locationId,
    languages: ['de', 'fr'],
    maxTravelMinutes: 45,
  });

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    locationId = (
      await ds.getRepository(Location).save({
        code: 'E2EI-LOC',
        name: 'E2EI Ort',
        kind: 'training_centre',
        languageRegion: 'de',
      })
    ).id;
    skillId = (await ds.getRepository(Skill).save({ name: 'E2EI Skill' })).id;
    certTypeId = (
      await ds.getRepository(CertificateType).save({
        code: 'E2EI-CT',
        name: 'E2EI Zertifikat',
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
    await ds.query(`DELETE FROM "instructor" WHERE last_name LIKE 'E2EI%'`);
    await ds.query(`DELETE FROM "certificate_type" WHERE code = 'E2EI-CT'`);
    await ds.query(`DELETE FROM "skill" WHERE name = 'E2EI Skill'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2EI-LOC'`);
  }

  it('enforces the role policy and validates the body', async () => {
    await api().post('/instructors').set(asInstructor).send(base()).expect(403);

    const res = await api()
      .post('/instructors')
      .set(asPlanner)
      .send({ ...base(), languages: [], homeLocationId: 'nope', email: 'x' })
      .expect(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'languages', message: 'Mindestens ein Eintrag.' },
        { field: 'homeLocationId', message: 'Ungültige Referenz.' },
        { field: 'email', message: 'Ungültige E-Mail-Adresse.' },
      ]),
    );

    const unknownLocation = await api()
      .post('/instructors')
      .set(asPlanner)
      .send({
        ...base(),
        homeLocationId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(400);
    expect(unknownLocation.body.message).toBe('Unbekannter Standort.');
  });

  it('creates, filters, updates and deletes an instructor with skills', async () => {
    const created = await api()
      .post('/instructors')
      .set(asPlanner)
      .send(base())
      .expect(201);
    const id: string = created.body.id;
    expect(created.body).toMatchObject({
      firstName: 'Ida',
      lastName: 'E2EI Test',
      status: 'active',
      homeLocation: { code: 'E2EI-LOC', name: 'E2EI Ort' },
      skills: [],
      certificates: [],
      availabilities: [],
      maxTravelMinutes: 45,
    });

    const withSkills = await api()
      .put(`/instructors/${id}/skills`)
      .set(asPlanner)
      .send({ skillIds: [skillId] })
      .expect(200);
    expect(withSkills.body.skills).toEqual([
      { id: skillId, name: 'E2EI Skill' },
    ]);

    await api()
      .put(`/instructors/${id}/skills`)
      .set(asPlanner)
      .send({ skillIds: ['00000000-0000-0000-0000-000000000000'] })
      .expect(400);

    const bySkill = await api()
      .get(`/instructors?skillId=${skillId}`)
      .set(asInstructor)
      .expect(200);
    expect(bySkill.body.map((i: { id: string }) => i.id)).toEqual([id]);
    const byLanguage = await api()
      .get(`/instructors?language=fr&q=e2ei`)
      .set(asInstructor)
      .expect(200);
    expect(byLanguage.body.map((i: { id: string }) => i.id)).toEqual([id]);
    const byOtherLanguage = await api()
      .get(`/instructors?language=it&q=e2ei`)
      .set(asInstructor)
      .expect(200);
    expect(byOtherLanguage.body).toEqual([]);
    await api().get('/instructors?language=xx').set(asInstructor).expect(400);

    const updated = await api()
      .patch(`/instructors/${id}`)
      .set(asPlanner)
      .send({
        employmentType: 'freelancer',
        weeklyHours: 20.5,
        preferences: { preferredLocationIds: [locationId], notes: 'Nur Di–Do' },
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      employmentType: 'freelancer',
      weeklyHours: 20.5,
      preferences: { preferredLocationIds: [locationId], notes: 'Nur Di–Do' },
    });

    await api().delete(`/instructors/${id}`).set(asPlanner).expect(204);
    await api().get(`/instructors/${id}`).set(asPlanner).expect(404);
  });

  it('manages certificates with a derived status', async () => {
    const instructor = await api()
      .post('/instructors')
      .set(asPlanner)
      .send(base())
      .expect(201);
    const id: string = instructor.body.id;

    const expired = await api()
      .post(`/instructors/${id}/certificates`)
      .set(asPlanner)
      .send({ certificateTypeId: certTypeId, issuedOn: '2020-01-15' })
      .expect(201);
    expect(expired.body).toMatchObject({
      validUntil: '2022-01-15',
      status: 'expired',
      certificateType: { code: 'E2EI-CT' },
    });

    const valid = await api()
      .post(`/instructors/${id}/certificates`)
      .set(asPlanner)
      .send({
        certificateTypeId: certTypeId,
        issuedOn: '2026-01-01',
        validUntil: '2030-01-01',
      })
      .expect(201);
    expect(valid.body.status).toBe('valid');

    const unknownType = await api()
      .post(`/instructors/${id}/certificates`)
      .set(asPlanner)
      .send({
        certificateTypeId: '00000000-0000-0000-0000-000000000000',
        issuedOn: '2026-01-01',
      })
      .expect(400);
    expect(unknownType.body.message).toBe('Unbekannter Zertifikatstyp.');

    const badDate = await api()
      .post(`/instructors/${id}/certificates`)
      .set(asPlanner)
      .send({ certificateTypeId: certTypeId, issuedOn: '15.01.2026' })
      .expect(400);
    expect(badDate.body.errors).toEqual([
      { field: 'issuedOn', message: 'Ungültiges Datum.' },
    ]);

    const detail = await api()
      .get(`/instructors/${id}`)
      .set(asInstructor)
      .expect(200);
    expect(
      detail.body.certificates.map((c: { status: string }) => c.status),
    ).toEqual(['expired', 'valid']);

    await api()
      .patch(`/instructor-certificates/${expired.body.id}`)
      .set(asPlanner)
      .send({ validUntil: null })
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('valid'));
    await api()
      .delete(`/instructor-certificates/${valid.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api().delete(`/instructors/${id}`).set(asPlanner).expect(204);
  });

  it('manages availabilities with the approval flow', async () => {
    const instructor = await api()
      .post('/instructors')
      .set(asPlanner)
      .send(base())
      .expect(201);
    const id: string = instructor.body.id;

    const vacation = await api()
      .post(`/instructors/${id}/availabilities`)
      .set(asPlanner)
      .send({ startsOn: '2026-11-02', endsOn: '2026-11-06', kind: 'vacation' })
      .expect(201);
    expect(vacation.body).toMatchObject({
      status: 'requested',
      source: 'manual',
    });

    const training = await api()
      .post(`/instructors/${id}/availabilities`)
      .set(asPlanner)
      .send({ startsOn: '2026-12-01', endsOn: '2026-12-01', kind: 'training' })
      .expect(201);
    expect(training.body.status).toBe('approved');

    const backwards = await api()
      .post(`/instructors/${id}/availabilities`)
      .set(asPlanner)
      .send({ startsOn: '2026-12-05', endsOn: '2026-12-01', kind: 'sick' })
      .expect(400);
    expect(backwards.body.message).toBe(
      'Das Enddatum liegt vor dem Startdatum.',
    );

    const approved = await api()
      .post(`/availabilities/${vacation.body.id}/approve`)
      .set(asPlanner)
      .expect(200);
    expect(approved.body.status).toBe('approved');
    expect(approved.body.decidedByUserId).toBeTruthy();

    const again = await api()
      .post(`/availabilities/${vacation.body.id}/reject`)
      .set(asPlanner)
      .expect(409);
    expect(again.body.message).toBe('Der Antrag ist bereits entschieden.');

    const detail = await api()
      .get(`/instructors/${id}`)
      .set(asInstructor)
      .expect(200);
    expect(
      detail.body.availabilities.map((a: { startsOn: string }) => a.startsOn),
    ).toEqual(['2026-12-01', '2026-11-02']);

    await api()
      .delete(`/availabilities/${training.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api().delete(`/instructors/${id}`).set(asPlanner).expect(204);
  });
});
