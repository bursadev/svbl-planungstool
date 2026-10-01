import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { DeviceType } from '../src/devices/device-type.entity.js';
import { CertificateType } from '../src/instructors/certificate-type.entity.js';
import { Skill } from '../src/instructors/skill.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2EK.
describe('Course types (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let skillId: string;
  let certId: string;
  let deviceTypeId: string;
  const api = () => request(app.getHttpServer());

  const base = {
    code: 'E2EK-1',
    name: 'E2EK Grundkurs',
    kind: 'uk',
    track: 'efz',
    durationDays: 2,
    languages: ['de', 'fr'],
    maxParticipants: 12,
  };

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    skillId = (await ds.getRepository(Skill).save({ name: 'E2EK Skill' })).id;
    certId = (
      await ds
        .getRepository(CertificateType)
        .save({ code: 'E2EK-CT', name: 'E2EK Zertifikat' })
    ).id;
    deviceTypeId = (
      await ds
        .getRepository(DeviceType)
        .save({ code: 'E2EK-DT', name: 'E2EK Gerät', category: 'forklift' })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(`DELETE FROM "course_type" WHERE code LIKE 'E2EK-%'`);
    await ds.query(`DELETE FROM "device_type" WHERE code = 'E2EK-DT'`);
    await ds.query(`DELETE FROM "certificate_type" WHERE code = 'E2EK-CT'`);
    await ds.query(`DELETE FROM "skill" WHERE name = 'E2EK Skill'`);
  }

  it('creates a course type, sets its requirements and deletes it', async () => {
    await api().post('/course-types').set(asInstructor).send(base).expect(403);

    const created = await api()
      .post('/course-types')
      .set(asPlanner)
      .send(base)
      .expect(201);
    const id: string = created.body.id;
    expect(created.body).toMatchObject({
      ...base,
      maySpanWeeks: false,
      weekdayRule: 'weekdays',
      published: false,
      active: true,
      requiredSkills: [],
      requiredCertificates: [],
      requiredDevices: [],
      curriculumModule: null,
    });

    const withReqs = await api()
      .put(`/course-types/${id}/requirements`)
      .set(asPlanner)
      .send({
        skillIds: [skillId],
        certificateTypeIds: [certId],
        devices: [{ deviceTypeId, quantity: 4 }],
      })
      .expect(200);
    expect(withReqs.body.requiredSkills).toEqual([
      { id: skillId, name: 'E2EK Skill' },
    ]);
    expect(withReqs.body.requiredCertificates).toEqual([
      { id: certId, code: 'E2EK-CT', name: 'E2EK Zertifikat' },
    ]);
    expect(withReqs.body.requiredDevices).toEqual([
      {
        deviceType: { id: deviceTypeId, code: 'E2EK-DT', name: 'E2EK Gerät' },
        quantity: 4,
      },
    ]);

    const badQuantity = await api()
      .put(`/course-types/${id}/requirements`)
      .set(asPlanner)
      .send({
        skillIds: [],
        certificateTypeIds: [],
        devices: [{ deviceTypeId, quantity: 0 }],
      })
      .expect(400);
    expect(badQuantity.body.errors).toEqual([
      { field: 'devices.0.quantity', message: 'Wert ausserhalb des Bereichs.' },
    ]);

    const unknownSkill = await api()
      .put(`/course-types/${id}/requirements`)
      .set(asPlanner)
      .send({
        skillIds: ['00000000-0000-0000-0000-000000000000'],
        certificateTypeIds: [],
        devices: [],
      })
      .expect(400);
    expect(unknownSkill.body.message).toBe('Unbekannter Skill.');

    const list = await api().get('/course-types').set(asInstructor).expect(200);
    expect(
      list.body.find((t: { id: string }) => t.id === id).requiredDevices,
    ).toHaveLength(1);

    const minOverMax = await api()
      .patch(`/course-types/${id}`)
      .set(asPlanner)
      .send({ minParticipants: 20 })
      .expect(400);
    expect(minOverMax.body.message).toBe(
      'Die Mindestteilnehmerzahl liegt über dem Maximum.',
    );

    await api()
      .patch(`/course-types/${id}`)
      .set(asPlanner)
      .send({ minParticipants: 6, published: true })
      .expect(200);
    await api().delete(`/course-types/${id}`).set(asPlanner).expect(204);
    await api().get(`/course-types/${id}`).set(asPlanner).expect(404);
  });

  it('validates the body', async () => {
    const res = await api()
      .post('/course-types')
      .set(asPlanner)
      .send({
        ...base,
        code: '',
        durationDays: 0,
        languages: [],
        kind: 'party',
      })
      .expect(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'code', message: 'Pflichtfeld.' },
        { field: 'durationDays', message: 'Wert ausserhalb des Bereichs.' },
        { field: 'languages', message: 'Mindestens ein Eintrag.' },
        { field: 'kind', message: 'Ungültiger Wert.' },
      ]),
    );
  });
});
