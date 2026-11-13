import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { CourseDay } from '../src/courses/course-day.entity.js';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Course } from '../src/courses/course.entity.js';
import { Instructor } from '../src/instructors/instructor.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2EA.
describe('Staffing (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let locationId: string;
  let courseTypeId: string;
  let ida: string;
  let jean: string;
  let courseId: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    locationId = (
      await ds.getRepository(Location).save({
        code: 'E2EA-LOC',
        name: 'E2EA Ort',
        kind: 'training_centre',
        languageRegion: 'de',
        hostsUk: true,
      })
    ).id;
    courseTypeId = (
      await ds.getRepository(CourseType).save({
        code: 'E2EA-UK',
        name: 'E2EA Kurs',
        kind: 'uk',
        track: 'efz',
        durationDays: 1,
        languages: ['de', 'fr'],
        maxParticipants: 12,
      })
    ).id;
    const instructor = (firstName: string, languages: string[]) =>
      ds.getRepository(Instructor).save({
        firstName,
        lastName: 'E2EA Lehrer',
        employmentType: 'employee',
        homeLocationId: locationId,
        languages,
      });
    ida = (await instructor('Ida', ['de'])).id;
    jean = (await instructor('Jean', ['fr'])).id;
    courseId = (
      await ds.getRepository(Course).save({
        courseTypeId,
        locationId,
        language: 'de',
        capacity: 12,
        externalRef: 'E2EA-1',
      })
    ).id;
    await ds.getRepository(CourseDay).insert({
      courseId,
      heldOn: '2027-03-02',
      startsAt: '08:15',
      endsAt: '16:45',
      sequence: 1,
    });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "audit_entry" WHERE entity_type = 'assignment' AND summary LIKE '%E2EA%'`,
    );
    await ds.query(`DELETE FROM "course" WHERE external_ref LIKE 'E2EA-%'`);
    await ds.query(`DELETE FROM "instructor" WHERE last_name = 'E2EA Lehrer'`);
    await ds.query(`DELETE FROM "course_type" WHERE code = 'E2EA-UK'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2EA-LOC'`);
  }

  it('ranks candidates and checks one instructor', async () => {
    const feasible = await api()
      .get(`/courses/${courseId}/candidates`)
      .set(asInstructor)
      .expect(200);
    const feasibleIds = feasible.body.map(
      (c: { instructor: { id: string } }) => c.instructor.id,
    );
    expect(feasibleIds).toContain(ida);
    expect(feasibleIds).not.toContain(jean);
    const idaRow = feasible.body.find(
      (c: { instructor: { id: string } }) => c.instructor.id === ida,
    );
    expect(idaRow.result.ok).toBe(true);
    expect(idaRow.result.score).toBeGreaterThanOrEqual(50);
    expect(idaRow.instructor).toMatchObject({
      firstName: 'Ida',
      homeLocation: { code: 'E2EA-LOC' },
    });

    const all = await api()
      .get(`/courses/${courseId}/candidates?all=true&limit=1000`)
      .set(asPlanner)
      .expect(200);
    const jeanRow = all.body.find(
      (c: { instructor: { id: string } }) => c.instructor.id === jean,
    );
    expect(jeanRow.result.ok).toBe(false);
    expect(jeanRow.result.hard).toContainEqual({
      label: 'Sprache',
      ok: false,
      reason: 'spricht kein Deutsch (fr)',
    });

    const check = await api()
      .get(`/courses/${courseId}/check/${jean}`)
      .set(asPlanner)
      .expect(200);
    expect(check.body.ok).toBe(false);
    await api()
      .get(`/courses/${courseId}/check/00000000-0000-4000-8000-000000000000`)
      .set(asPlanner)
      .expect(404);
    await api()
      .get(`/courses/${courseId}/candidates?limit=0`)
      .set(asPlanner)
      .expect(400);
  });

  it('assigns, confirms and removes instructors with the check as gate', async () => {
    await api()
      .post(`/courses/${courseId}/assignments`)
      .set(asInstructor)
      .send({ instructorId: ida })
      .expect(403);

    const refused = await api()
      .post(`/courses/${courseId}/assignments`)
      .set(asPlanner)
      .send({ instructorId: jean })
      .expect(409);
    expect(refused.body.message).toBe(
      'Harte Regel verletzt: spricht kein Deutsch (fr)',
    );
    expect(refused.body.details.checkResult.ok).toBe(false);

    const forced = await api()
      .post(`/courses/${courseId}/assignments`)
      .set(asPlanner)
      .send({ instructorId: jean, force: true, role: 'assistant' })
      .expect(201);
    expect(forced.body).toMatchObject({
      status: 'proposed',
      role: 'assistant',
      instructor: { id: jean },
    });
    expect(forced.body.checkResult.ok).toBe(false);

    const assigned = await api()
      .post(`/courses/${courseId}/assignments`)
      .set(asPlanner)
      .send({ instructorId: ida })
      .expect(201);
    expect(assigned.body).toMatchObject({
      status: 'proposed',
      role: 'lead',
      instructor: { id: ida },
    });
    expect(assigned.body.score).toBeGreaterThanOrEqual(50);
    expect(assigned.body.checkResult.ok).toBe(true);

    await api()
      .post(`/courses/${courseId}/assignments`)
      .set(asPlanner)
      .send({ instructorId: ida })
      .expect(409);

    const remaining = await api()
      .get(`/courses/${courseId}/candidates?all=true`)
      .set(asPlanner)
      .expect(200);
    expect(
      remaining.body.map(
        (c: { instructor: { id: string } }) => c.instructor.id,
      ),
    ).not.toContain(ida);

    const confirmed = await api()
      .post(`/assignments/${assigned.body.id}/confirm`)
      .set(asPlanner)
      .expect(200);
    expect(confirmed.body.status).toBe('confirmed');
    expect(confirmed.body.confirmedAt).toBeTruthy();
    await api()
      .post(`/assignments/${assigned.body.id}/confirm`)
      .set(asPlanner)
      .expect(409);

    await api()
      .delete(`/assignments/${forced.body.id}`)
      .set(asInstructor)
      .expect(403);
    await api()
      .delete(`/assignments/${forced.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .delete(`/assignments/${forced.body.id}`)
      .set(asPlanner)
      .expect(404);

    const detail = await api()
      .get(`/courses/${courseId}`)
      .set(asPlanner)
      .expect(200);
    expect(detail.body.assignments).toEqual([
      expect.objectContaining({
        status: 'confirmed',
        instructor: expect.objectContaining({ id: ida }),
      }),
    ]);
    expect(detail.body.instructors).toHaveLength(1);

    const audits: { summary: string }[] = await ds.query(
      `SELECT summary FROM "audit_entry" WHERE entity_type = 'assignment' AND summary LIKE '%E2EA%' ORDER BY occurred_at`,
    );
    expect(audits.map((a) => a.summary)).toEqual([
      'hat Jean E2EA Lehrer dem Kurs E2EA-UK E2EA Ort KW 9 zugewiesen (Score 85, harte Regel verletzt)',
      'hat Ida E2EA Lehrer dem Kurs E2EA-UK E2EA Ort KW 9 zugewiesen (Score 85)',
      'hat die Zuweisung von Ida E2EA Lehrer für E2EA-UK E2EA Ort KW 9 bestätigt',
      'hat die Zuweisung von Jean E2EA Lehrer für E2EA-UK E2EA Ort KW 9 aufgehoben',
    ]);
  });
});
