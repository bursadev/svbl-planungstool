import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { CourseType } from '../src/courses/course-type.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: every file uses its own prefix (here E2EC) for the rows it creates.
describe('Catalogs (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  const api = () => request(app.getHttpServer());

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
    await ds.query(`DELETE FROM "device_type" WHERE code LIKE 'E2EC-%'`);
    await ds.query(`DELETE FROM "course_type" WHERE code LIKE 'E2EC-%'`);
    await ds.query(`DELETE FROM "certificate_type" WHERE code LIKE 'E2EC-%'`);
    await ds.query(`DELETE FROM "skill" WHERE name LIKE 'E2EC %'`);
  }

  describe('skills', () => {
    it('is read-only for instructors and writable for planners', async () => {
      await api()
        .post('/skills')
        .set(asInstructor)
        .send({ name: 'E2EC Nope' })
        .expect(403);

      const created = await api()
        .post('/skills')
        .set(asPlanner)
        .send({ name: 'E2EC Kran' })
        .expect(201);
      expect(created.body).toMatchObject({ name: 'E2EC Kran', active: true });

      const list = await api().get('/skills').set(asInstructor).expect(200);
      expect(list.body.map((s: { name: string }) => s.name)).toContain(
        'E2EC Kran',
      );

      await api()
        .post('/skills')
        .set(asPlanner)
        .send({ name: 'E2EC Kran' })
        .expect(409);

      const updated = await api()
        .patch(`/skills/${created.body.id}`)
        .set(asPlanner)
        .send({ category: 'Geräte', active: false })
        .expect(200);
      expect(updated.body).toMatchObject({ category: 'Geräte', active: false });

      await api()
        .delete(`/skills/${created.body.id}`)
        .set(asPlanner)
        .expect(204);
      await api()
        .patch(`/skills/${created.body.id}`)
        .set(asPlanner)
        .send({ name: 'x' })
        .expect(404);
    });

    it('validates the name', async () => {
      const res = await api()
        .post('/skills')
        .set(asPlanner)
        .send({ name: '' })
        .expect(400);
      expect(res.body.errors).toEqual([
        { field: 'name', message: 'Pflichtfeld.' },
      ]);
    });
  });

  describe('certificate types', () => {
    it('manages the type and its maintenance course types', async () => {
      const created = await api()
        .post('/certificate-types')
        .set(asPlanner)
        .send({
          code: 'E2EC-CT',
          name: 'E2EC Zertifikat',
          issuer: 'intern',
          validityYears: 2,
          maintenanceMinPerYear: 3,
        })
        .expect(201);
      expect(created.body).toMatchObject({
        code: 'E2EC-CT',
        validityYears: 2,
        warningLeadDays: 60,
        maintenanceMinPerYear: 3,
        maintenanceCourseTypes: [],
      });

      const courseType = await ds.getRepository(CourseType).save({
        code: 'E2EC-KT',
        name: 'E2EC Kurstyp',
        kind: 'adult',
        durationDays: 1,
        languages: ['de'],
        maxParticipants: 8,
      });
      const linked = await api()
        .put(`/certificate-types/${created.body.id}/maintenance-course-types`)
        .set(asPlanner)
        .send({ courseTypeIds: [courseType.id] })
        .expect(200);
      expect(linked.body.maintenanceCourseTypes).toEqual([
        { id: courseType.id, code: 'E2EC-KT', name: 'E2EC Kurstyp' },
      ]);

      const unknown = await api()
        .put(`/certificate-types/${created.body.id}/maintenance-course-types`)
        .set(asPlanner)
        .send({ courseTypeIds: ['00000000-0000-0000-0000-000000000000'] })
        .expect(400);
      expect(unknown.body.message).toBe('Unbekannter Kurstyp.');

      const cleared = await api()
        .put(`/certificate-types/${created.body.id}/maintenance-course-types`)
        .set(asPlanner)
        .send({ courseTypeIds: [] })
        .expect(200);
      expect(cleared.body.maintenanceCourseTypes).toEqual([]);

      const bad = await api()
        .patch(`/certificate-types/${created.body.id}`)
        .set(asPlanner)
        .send({ validityYears: 0 })
        .expect(400);
      expect(bad.body.errors).toEqual([
        { field: 'validityYears', message: 'Wert ausserhalb des Bereichs.' },
      ]);

      await api()
        .delete(`/certificate-types/${created.body.id}`)
        .set(asPlanner)
        .expect(204);
    });
  });

  describe('device types', () => {
    it('manages the type and its qualifications', async () => {
      const skill = await api()
        .post('/skills')
        .set(asPlanner)
        .send({ name: 'E2EC Hubarbeit' })
        .expect(201);
      const cert = await api()
        .post('/certificate-types')
        .set(asPlanner)
        .send({ code: 'E2EC-Q', name: 'E2EC Qualifikation' })
        .expect(201);

      const created = await api()
        .post('/device-types')
        .set(asPlanner)
        .send({ code: 'E2EC-DT', name: 'E2EC Gerät', category: 'crane' })
        .expect(201);
      expect(created.body.qualifications).toEqual({
        certificateTypes: [],
        skills: [],
      });

      const set = await api()
        .put(`/device-types/${created.body.id}/qualifications`)
        .set(asPlanner)
        .send({ certificateTypeIds: [cert.body.id], skillIds: [skill.body.id] })
        .expect(200);
      expect(set.body.qualifications).toEqual({
        certificateTypes: [
          { id: cert.body.id, code: 'E2EC-Q', name: 'E2EC Qualifikation' },
        ],
        skills: [{ id: skill.body.id, name: 'E2EC Hubarbeit' }],
      });

      // A qualifying skill cannot be deleted while referenced.
      const res = await api()
        .delete(`/skills/${skill.body.id}`)
        .set(asPlanner)
        .expect(409);
      expect(res.body.message).toBe(
        'Der Eintrag wird noch verwendet und kann nicht gelöscht werden.',
      );

      const list = await api()
        .get('/device-types')
        .set(asInstructor)
        .expect(200);
      expect(
        list.body.find((t: { code: string }) => t.code === 'E2EC-DT')
          .qualifications.skills,
      ).toHaveLength(1);

      await api()
        .delete(`/device-types/${created.body.id}`)
        .set(asPlanner)
        .expect(204);
      await api().delete(`/skills/${skill.body.id}`).set(asPlanner).expect(204);
      await api()
        .delete(`/certificate-types/${cert.body.id}`)
        .set(asPlanner)
        .expect(204);
    });
  });
});
