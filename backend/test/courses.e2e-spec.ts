import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { Assignment } from '../src/courses/assignment.entity.js';
import { CourseDay } from '../src/courses/course-day.entity.js';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Course } from '../src/courses/course.entity.js';
import { Instructor } from '../src/instructors/instructor.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2EC.
describe('Courses (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  let locationId: string;
  let courseTypeId: string;
  let instructorId: string;
  let courseA: string;
  let courseB: string;
  let courseC: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    locationId = (
      await ds.getRepository(Location).save({
        code: 'E2EC-LOC',
        name: 'E2EC Ort',
        kind: 'training_centre',
        languageRegion: 'de',
        hostsUk: true,
      })
    ).id;
    courseTypeId = (
      await ds.getRepository(CourseType).save({
        code: 'E2EC-UK',
        name: 'E2EC Kurs',
        kind: 'uk',
        track: 'efz',
        durationDays: 1,
        languages: ['de'],
        maxParticipants: 12,
      })
    ).id;
    instructorId = (
      await ds.getRepository(Instructor).save({
        firstName: 'Ida',
        lastName: 'E2EC Lehrer',
        employmentType: 'employee',
        homeLocationId: locationId,
        languages: ['de'],
      })
    ).id;
    const course = (externalRef: string) =>
      ds.getRepository(Course).save({
        courseTypeId,
        locationId,
        language: 'de',
        capacity: 12,
        externalRef,
      });
    courseA = (await course('E2EC-A')).id;
    courseB = (await course('E2EC-B')).id;
    courseC = (await course('E2EC-C')).id;
    const day = (courseId: string, heldOn: string, sequence: number) => ({
      courseId,
      heldOn,
      startsAt: '08:15',
      endsAt: '16:45',
      sequence,
    });
    await ds
      .getRepository(CourseDay)
      .insert([
        day(courseA, '2027-03-02', 1),
        day(courseB, '2027-04-07', 2),
        day(courseB, '2027-04-06', 1),
        day(courseC, '2026-01-05', 1),
      ]);
    await ds
      .getRepository(Assignment)
      .insert({ courseId: courseA, instructorId, status: 'confirmed' });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(`DELETE FROM "course" WHERE external_ref LIKE 'E2EC-%'`);
    await ds.query(`DELETE FROM "instructor" WHERE last_name = 'E2EC Lehrer'`);
    await ds.query(`DELETE FROM "course_type" WHERE code = 'E2EC-UK'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2EC-LOC'`);
  }

  it('lists courses of a range with dates, seats and instructors', async () => {
    const res = await api()
      .get(`/courses?from=2027-01-01&to=2027-12-31&locationId=${locationId}`)
      .set(asInstructor)
      .expect(200);
    expect(res.headers['x-total-count']).toBe('2');
    expect(res.body.map((r: { id: string }) => r.id)).toEqual([
      courseA,
      courseB,
    ]);
    expect(res.body[0]).toMatchObject({
      courseType: { code: 'E2EC-UK', kind: 'uk', durationDays: 1 },
      location: { code: 'E2EC-LOC' },
      status: 'planned',
      capacity: 12,
      booked: 0,
      startsOn: '2027-03-02',
      endsOn: '2027-03-02',
      dayCount: 1,
      isoWeek: 9,
      externalRef: 'E2EC-A',
    });
    expect(res.body[0].instructors).toEqual([
      expect.objectContaining({
        id: instructorId,
        lastName: 'E2EC Lehrer',
        role: 'lead',
        status: 'confirmed',
      }),
    ]);
    expect(res.body[1]).toMatchObject({
      startsOn: '2027-04-06',
      endsOn: '2027-04-07',
      dayCount: 2,
      instructors: [],
    });
  });

  it('filters by staffing, starts today by default, searches and pages', async () => {
    const unstaffed = await api()
      .get(
        `/courses?from=2027-01-01&locationId=${locationId}&staffing=unstaffed`,
      )
      .set(asPlanner)
      .expect(200);
    expect(unstaffed.body.map((r: { id: string }) => r.id)).toEqual([courseB]);
    const staffed = await api()
      .get(`/courses?from=2027-01-01&locationId=${locationId}&staffing=staffed`)
      .set(asPlanner)
      .expect(200);
    expect(staffed.body.map((r: { id: string }) => r.id)).toEqual([courseA]);

    const upcoming = await api()
      .get(`/courses?locationId=${locationId}`)
      .set(asPlanner)
      .expect(200);
    const ids = upcoming.body.map((r: { id: string }) => r.id);
    expect(ids).toEqual(expect.arrayContaining([courseA, courseB]));
    expect(ids).not.toContain(courseC);

    const searched = await api()
      .get(`/courses?from=2026-01-01&q=e2ec-b`)
      .set(asPlanner)
      .expect(200);
    expect(searched.body.map((r: { id: string }) => r.id)).toEqual([courseB]);

    const paged = await api()
      .get(
        `/courses?from=2027-01-01&locationId=${locationId}&page=1&pageSize=1&sort=startsOn&dir=desc`,
      )
      .set(asPlanner)
      .expect(200);
    expect(paged.headers['x-total-count']).toBe('2');
    expect(paged.body.map((r: { id: string }) => r.id)).toEqual([courseB]);

    // Drafts of planning runs stay hidden unless asked for.
    await ds.getRepository(Course).update(courseB, { status: 'demand' });
    const withoutDrafts = await api()
      .get(`/courses?from=2027-01-01&locationId=${locationId}`)
      .set(asPlanner)
      .expect(200);
    expect(withoutDrafts.body.map((r: { id: string }) => r.id)).toEqual([
      courseA,
    ]);
    const drafts = await api()
      .get(`/courses?from=2027-01-01&locationId=${locationId}&status=demand`)
      .set(asPlanner)
      .expect(200);
    expect(drafts.body.map((r: { id: string }) => r.id)).toEqual([courseB]);
    await ds.getRepository(Course).update(courseB, { status: 'planned' });

    await api().get('/courses?from=2027-13-01').set(asPlanner).expect(400);
    await api().get('/courses?staffing=maybe').set(asPlanner).expect(400);
  });

  it('returns the detail with days and assignments, 404 for unknown ids', async () => {
    const res = await api()
      .get(`/courses/${courseB}`)
      .set(asInstructor)
      .expect(200);
    expect(res.body).toMatchObject({
      id: courseB,
      startsOn: '2027-04-06',
      cohort: null,
      timeWindow: null,
      assignments: [],
      notes: null,
    });
    expect(
      res.body.days.map((d: { heldOn: string; sequence: number }) => [
        d.sequence,
        d.heldOn,
      ]),
    ).toEqual([
      [1, '2027-04-06'],
      [2, '2027-04-07'],
    ]);
    const withInstructor = await api()
      .get(`/courses/${courseA}`)
      .set(asPlanner)
      .expect(200);
    expect(withInstructor.body.assignments).toEqual([
      expect.objectContaining({
        status: 'confirmed',
        role: 'lead',
        instructor: expect.objectContaining({
          lastName: 'E2EC Lehrer',
          homeLocation: { id: locationId, code: 'E2EC-LOC', name: 'E2EC Ort' },
        }),
      }),
    ]);
    await api()
      .get('/courses/00000000-0000-4000-8000-000000000000')
      .set(asPlanner)
      .expect(404);
    // `uuidPipe` answers 404 for a malformed id, like an unknown one.
    await api().get('/courses/not-a-uuid').set(asPlanner).expect(404);
    await api().get(`/courses/${courseA}`).expect(401);
  });
});
