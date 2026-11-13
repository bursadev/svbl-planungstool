import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { Apprentice } from '../src/apprentices/apprentice.entity.js';
import { SchoolClassDay } from '../src/apprentices/school-class-day.entity.js';
import { SchoolClass } from '../src/apprentices/school-class.entity.js';
import { VocationalSchool } from '../src/apprentices/vocational-school.entity.js';
import { CourseType } from '../src/courses/course-type.entity.js';
import { Cohort } from '../src/curriculum/cohort.entity.js';
import { CurriculumModule } from '../src/curriculum/curriculum-module.entity.js';
import { Instructor } from '../src/instructors/instructor.entity.js';
import { Location } from '../src/locations/location.entity.js';
import { Room } from '../src/locations/room.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

// Test files run in parallel: this file prefixes its rows with E2ER and plans the
// school year 2087/88 for an EBA cohort in its third semester: no other test file creates
// EBA semester-3 modules, so the run never references another file's temporary rows.
const PERIOD = { periodStartsOn: '2087-08-01', periodEndsOn: '2088-01-31' };

/** Like `.expect(200)`, but shows the body when the status differs (parallel e2e files share the database). */
async function ok<T extends { status: number; body: unknown }>(
  request: Promise<T> | T,
  expected = 200,
): Promise<T> {
  const res = await request;
  if (res.status !== expected)
    console.error('unexpected status', res.status, JSON.stringify(res.body));
  expect(res.status).toBe(expected);
  return res;
}

describe('Planning runs (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;
  const ids: Record<string, string> = {};
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
    ids.location = (
      await ds.getRepository(Location).save({
        code: 'E2ER-LOC',
        name: 'E2ER Ort',
        kind: 'training_centre',
        languageRegion: 'de',
        hostsUk: true,
        parallelCourseCapacity: 2,
      })
    ).id;
    ids.room = (
      await ds.getRepository(Room).save({
        locationId: ids.location,
        name: 'E2ER Raum',
        kind: 'theory',
        capacity: 12,
      })
    ).id;
    ids.courseType = (
      await ds.getRepository(CourseType).save({
        code: 'E2ER-UK',
        name: 'E2ER Kurs',
        kind: 'uk',
        track: 'eba',
        durationDays: 1,
        languages: ['de'],
        maxParticipants: 2,
      })
    ).id;
    ids.cohort = (
      await ds
        .getRepository(Cohort)
        .save({ track: 'eba', startYear: 2086, label: 'E2ER 2086 EBA' })
    ).id;
    ids.module = (
      await ds.getRepository(CurriculumModule).save({
        track: 'eba',
        courseTypeId: ids.courseType,
        semester: 3,
        sequence: 9952,
      })
    ).id;
    ids.school = (
      await ds.getRepository(VocationalSchool).save({
        name: 'E2ER Berufsschule',
        shortName: 'E2ER-BS',
        language: 'de',
        nearestLocationId: ids.location,
      })
    ).id;
    ids.class = (
      await ds.getRepository(SchoolClass).save({
        vocationalSchoolId: ids.school,
        code: 'E2ER-K1',
        track: 'eba',
        startYear: 2086,
      })
    ).id;
    await ds
      .getRepository(SchoolClassDay)
      .insert({ schoolClassId: ids.class, schoolYearStart: 2087, weekday: 2 });
    const apprentices = ds.getRepository(Apprentice);
    const apprentice = (firstName: string, schoolClassId: string | null) =>
      apprentices.save({
        firstName,
        lastName: 'E2ER Lernende',
        birthDate: '2070-01-01',
        language: 'de',
        track: 'eba',
        cohortId: ids.cohort,
        vocationalSchoolId: ids.school,
        schoolClassId,
      });
    ids.a1 = (await apprentice('Anna', ids.class)).id;
    ids.a2 = (await apprentice('Beat', ids.class)).id;
    ids.a3 = (await apprentice('Cem', null)).id;
    ids.instructor = (
      await ds.getRepository(Instructor).save({
        firstName: 'Ida',
        lastName: 'E2ER Lehrer',
        employmentType: 'employee',
        homeLocationId: ids.location,
        languages: ['de'],
      })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "course" WHERE planning_run_id IN (SELECT id FROM "planning_run" WHERE label LIKE 'E2ER%' OR label = 'Herbstsemester 2087')`,
    );
    await ds.query(
      `DELETE FROM "planning_run" WHERE label LIKE 'E2ER%' OR label = 'Herbstsemester 2087'`,
    );
    await ds.query(
      `DELETE FROM "audit_entry" WHERE entity_type = 'planning_run' AND summary LIKE '%2087%'`,
    );
    await ds.query(
      `DELETE FROM "course" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code = 'E2ER-UK')`,
    );
    await ds.query(
      `DELETE FROM "apprentice" WHERE last_name = 'E2ER Lernende'`,
    );
    await ds.query(`DELETE FROM "school_class" WHERE code = 'E2ER-K1'`);
    await ds.query(
      `DELETE FROM "vocational_school" WHERE short_name = 'E2ER-BS'`,
    );
    await ds.query(
      `DELETE FROM "curriculum_module" WHERE course_type_id IN (SELECT id FROM "course_type" WHERE code = 'E2ER-UK')`,
    );
    await ds.query(`DELETE FROM "cohort" WHERE label = 'E2ER 2086 EBA'`);
    await ds.query(`DELETE FROM "instructor" WHERE last_name = 'E2ER Lehrer'`);
    await ds.query(`DELETE FROM "course_type" WHERE code = 'E2ER-UK'`);
    await ds.query(`DELETE FROM "location" WHERE code = 'E2ER-LOC'`);
  }

  it('creates a run with its readiness, lists it and discards it', async () => {
    await api()
      .post('/planning-runs')
      .set(asInstructor)
      .send(PERIOD)
      .expect(403);
    await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send({ periodStartsOn: '2088-01-31', periodEndsOn: '2087-08-01' })
      .expect(400);
    await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send({ periodStartsOn: '2087-08-01', periodEndsOn: '2089-01-31' })
      .expect(400);

    const created = await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send(PERIOD)
      .expect(201);
    expect(created.body).toMatchObject({
      label: 'Herbstsemester 2087',
      periodStartsOn: '2087-08-01',
      periodEndsOn: '2088-01-31',
      stage: 'demand',
      status: 'draft',
      committedAt: null,
      demandSummary: null,
      counts: {
        demandGroups: 0,
        apprentices: 0,
        coursesNeeded: 0,
        coursesProposed: 0,
        coursesStaffed: 0,
      },
    });
    expect(created.body.readiness.items).toHaveLength(10);
    const rule = (name: string) =>
      created.body.readiness.items.find(
        (i: { rule: string }) => i.rule === name,
      );
    // The real curriculum has more EBA semester-3 modules; ours is among the ones without a window.
    expect(rule('time_windows').status).toBe('warning');
    expect(rule('time_windows').details).toContain('E2ER-UK · E2ER 2086 EBA');
    expect(rule('school_days')).toMatchObject({ status: 'warning', count: 1 });
    expect(rule('uk_locations')).toMatchObject({ status: 'ok' });
    ids.run = created.body.id;

    const duplicate = await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send(PERIOD)
      .expect(409);
    expect(duplicate.body.message).toContain('Herbstsemester 2087');

    const list = await api()
      .get('/planning-runs')
      .set(asInstructor)
      .expect(200);
    expect(list.body.map((r: { id: string }) => r.id)).toContain(ids.run);
    const one = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(one.body.createdBy).toBe('Test planner');

    const overview = await api()
      .get('/planning/overview')
      .set(asPlanner)
      .expect(200);
    expect(overview.body).toEqual({
      activeApprentices: expect.any(Number),
      apprenticesWithoutFutureUk: expect.any(Number),
      unstaffedCourses: expect.any(Number),
      modulesWithoutTimeWindow: expect.any(Number),
    });
    expect(overview.body.apprenticesWithoutFutureUk).toBeGreaterThanOrEqual(3);
    // Stage 1: demand. The E2ER cohort is in semester 3, so the real EBA semester-3 modules appear too.
    await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asInstructor)
      .expect(403);
    const demand = await ok(
      api().post(`/planning-runs/${ids.run}/demand`).set(asPlanner),
    );
    const ours = demand.body.filter(
      (d: { module: { code: string } }) => d.module.code === 'E2ER-UK',
    );
    expect(ours).toHaveLength(1);
    expect(ours[0]).toMatchObject({
      cohort: { label: 'E2ER 2086 EBA' },
      module: { code: 'E2ER-UK', semester: 3, durationDays: 1 },
      location: { code: 'E2ER-LOC' },
      language: 'de',
      schoolWeekday: 2,
      blockedWeekdays: [2],
      window: {
        startsOn: '2087-08-01',
        endsOn: '2088-01-31',
        fromTimeWindow: false,
      },
      participantCount: 3,
      memberCount: 3,
      existingFreeSeats: 0,
      coursesNeeded: 2,
    });
    expect(ours[0].note).toContain('Schultag-Gruppen zusammengelegt');
    const afterDemand = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(afterDemand.body.stage).toBe('demand');
    expect(afterDemand.body.demandSummary).toMatchObject({
      // Semester 3: the real EBA modules of semesters 1 and 2 are uncovered for all three.
      catchUps: 3,
      apprenticesWithoutClass: 1,
    });
    expect(afterDemand.body.counts.apprentices).toBe(3);
    expect(afterDemand.body.counts.demandGroups).toBeGreaterThanOrEqual(1);
    const listed = await api()
      .get(`/planning-runs/${ids.run}/demand`)
      .set(asInstructor)
      .expect(200);
    expect(listed.body.map((d: { id: string }) => d.id)).toContain(ours[0].id);
    const again = await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asPlanner)
      .expect(200);
    expect(again.body.map((d: { id: string }) => d.id)).not.toContain(
      ours[0].id,
    );
    // Stage 2: courses and dates. Three apprentices, max 2 per course → two courses on free days.
    await api()
      .post(`/planning-runs/${ids.run}/courses`)
      .set(asInstructor)
      .expect(403);
    const proposed = await ok(
      api().post(`/planning-runs/${ids.run}/courses`).set(asPlanner),
    );
    const ourCourses = proposed.body.filter(
      (c: { courseType: { code: string } }) => c.courseType.code === 'E2ER-UK',
    );
    expect(ourCourses).toHaveLength(2);
    for (const course of ourCourses) {
      expect(course).toMatchObject({
        location: { code: 'E2ER-LOC' },
        language: 'de',
        room: { name: 'E2ER Raum' },
        blockedWeekdays: [2],
        planningIssue: null,
        proposedInstructor: null,
        staffingIssue: null,
      });
      expect(course.dates).toHaveLength(1);
      expect(new Date(course.dates[0]).getUTCDay()).not.toBe(2);
      expect(
        course.dates[0] >= '2087-08-01' && course.dates[0] <= '2088-01-31',
      ).toBe(true);
      expect(course.reasons).toContain('Raum E2ER Raum reserviert');
    }
    expect(
      ourCourses.map((c: { seats: number; booked: number }) => [
        c.seats,
        c.booked,
      ]),
    ).toEqual([
      [2, 2],
      [1, 1],
    ]);
    const afterCourses = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(afterCourses.body.stage).toBe('courses');
    expect(afterCourses.body.counts.coursesProposed).toBeGreaterThanOrEqual(2);
    expect(afterCourses.body.counts.unassignedApprentices).toBe(0);
    const drafts = await api()
      .get(`/courses?planningRunId=${ids.run}&from=2087-01-01`)
      .set(asPlanner)
      .expect(200);
    expect(
      drafts.body.every((c: { status: string }) => c.status === 'demand'),
    ).toBe(true);
    expect(drafts.body.length).toBe(proposed.body.length);
    const listedCourses = await api()
      .get(`/planning-runs/${ids.run}/courses`)
      .set(asInstructor)
      .expect(200);
    expect(listedCourses.body.map((c: { id: string }) => c.id).sort()).toEqual(
      proposed.body.map((c: { id: string }) => c.id).sort(),
    );

    // Stage 3: instructors. Ida (de, at the location) is feasible for every course.
    await api()
      .post(`/planning-runs/${ids.run}/staffing`)
      .set(asInstructor)
      .expect(403);
    const staffed = await ok(
      api().post(`/planning-runs/${ids.run}/staffing`).set(asPlanner),
    );
    const staffedOurs = staffed.body.filter(
      (c: { courseType: { code: string } }) => c.courseType.code === 'E2ER-UK',
    );
    for (const course of staffedOurs) {
      expect(course.proposedInstructor).toMatchObject({
        lastName: 'E2ER Lehrer',
        score: expect.any(Number),
      });
      expect(course.proposedInstructor.candidateCount).toBeGreaterThanOrEqual(
        1,
      );
      expect(course.proposedInstructor.why).toContain('Heimstandort');
      expect(course.staffingIssue).toBeNull();
    }
    const afterStaffing = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(afterStaffing.body.stage).toBe('staffing');
    expect(afterStaffing.body.counts.coursesStaffed).toBeGreaterThanOrEqual(2);
    const restaffed = await api()
      .post(`/planning-runs/${ids.run}/staffing`)
      .set(asPlanner)
      .expect(200);
    const firstIds = staffedOurs.map(
      (c: { proposedInstructor: { assignmentId: string } }) =>
        c.proposedInstructor.assignmentId,
    );
    const secondIds = restaffed.body
      .filter(
        (c: { courseType: { code: string } }) =>
          c.courseType.code === 'E2ER-UK',
      )
      .map(
        (c: { proposedInstructor: { assignmentId: string } }) =>
          c.proposedInstructor.assignmentId,
      );
    expect(secondIds).not.toEqual(expect.arrayContaining(firstIds));

    // Stage 4: issues, fix options, summary.
    const issues = await api()
      .get(`/planning-runs/${ids.run}/issues`)
      .set(asInstructor)
      .expect(200);
    expect(Array.isArray(issues.body)).toBe(true);
    expect(
      issues.body.filter((i: { subject: string }) =>
        i.subject.startsWith('E2ER-UK'),
      ),
    ).toEqual([]);
    const noOptions = await api()
      .get(`/planning-runs/${ids.run}/courses/${ourCourses[0].id}/fix-options`)
      .set(asPlanner)
      .expect(200);
    expect(noOptions.body).toEqual([]);
    await api()
      .post(`/planning-runs/${ids.run}/courses/${ourCourses[0].id}/fix`)
      .set(asPlanner)
      .send({ option: 0 })
      .expect(409);
    const summary = await api()
      .get(`/planning-runs/${ids.run}/summary`)
      .set(asPlanner)
      .expect(200);
    expect(summary.body).toMatchObject({ unplannable: 0, unassigned: 0 });
    expect(summary.body.toCreate).toBeGreaterThanOrEqual(2);
    expect(summary.body.withInstructor).toBeGreaterThanOrEqual(2);
    expect(summary.body.apprenticesPlaced).toBe(3);

    // A new demand drops every draft course and enrollment of the run.
    await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asPlanner)
      .expect(200);
    const afterReset = await api()
      .get(`/planning-runs/${ids.run}/courses`)
      .set(asPlanner)
      .expect(200);
    expect(afterReset.body).toEqual([]);
    const [{ n }] = await ds.query(
      `SELECT COUNT(*)::int AS n FROM enrollment WHERE planning_run_id = $1`,
      [ids.run],
    );
    expect(n).toBe(0);
    // Commit: courses again, staffing, then the whole run in one transaction.
    await api()
      .post(`/planning-runs/${ids.run}/commit`)
      .set(asPlanner)
      .expect(409); // no courses yet
    await api()
      .post(`/planning-runs/${ids.run}/courses`)
      .set(asPlanner)
      .expect(200);
    await api()
      .post(`/planning-runs/${ids.run}/staffing`)
      .set(asPlanner)
      .expect(200);
    await api()
      .post(`/planning-runs/${ids.run}/commit`)
      .set(asInstructor)
      .expect(403);
    const committed = await api()
      .post(`/planning-runs/${ids.run}/commit`)
      .set(asPlanner)
      .expect(200);
    expect(committed.body).toMatchObject({ dropped: 0 });
    expect(committed.body.created).toBeGreaterThanOrEqual(2);
    expect(committed.body.withInstructor).toBe(committed.body.created);
    const done = await api()
      .get(`/planning-runs/${ids.run}`)
      .set(asPlanner)
      .expect(200);
    expect(done.body).toMatchObject({
      status: 'committed',
      stage: 'committed',
    });
    expect(done.body.committedAt).toBeTruthy();
    const planned = await api()
      .get(`/courses?planningRunId=${ids.run}&from=2087-01-01`)
      .set(asPlanner)
      .expect(200);
    expect(planned.body.length).toBe(committed.body.created);
    expect(
      planned.body.every((c: { status: string }) => c.status === 'planned'),
    ).toBe(true);
    expect(
      planned.body.every(
        (c: { instructors: unknown[] }) => c.instructors.length === 1,
      ),
    ).toBe(true);
    await api()
      .post(`/planning-runs/${ids.run}/commit`)
      .set(asPlanner)
      .expect(409);
    await api()
      .post(`/planning-runs/${ids.run}/demand`)
      .set(asPlanner)
      .expect(409);
    await api().delete(`/planning-runs/${ids.run}`).set(asPlanner).expect(409);

    // Discard: a second run with drafts goes away completely, courses first.
    const second = await api()
      .post('/planning-runs')
      .set(asPlanner)
      .send({
        label: 'E2ER Frühlingssemester 2088',
        periodStartsOn: '2088-02-01',
        periodEndsOn: '2088-07-31',
      })
      .expect(201);
    await api()
      .post(`/planning-runs/${second.body.id}/demand`)
      .set(asPlanner)
      .expect(200);
    await api()
      .post(`/planning-runs/${second.body.id}/courses`)
      .set(asPlanner)
      .expect(200);
    await api()
      .delete(`/planning-runs/${second.body.id}`)
      .set(asInstructor)
      .expect(403);
    await api()
      .delete(`/planning-runs/${second.body.id}`)
      .set(asPlanner)
      .expect(204);
    await api()
      .get(`/planning-runs/${second.body.id}`)
      .set(asPlanner)
      .expect(404);
    const [{ n: leftCourses }] = await ds.query(
      `SELECT COUNT(*)::int AS n FROM course WHERE planning_run_id = $1`,
      [second.body.id],
    );
    expect(leftCourses).toBe(0);
    await api()
      .delete(`/planning-runs/${second.body.id}`)
      .set(asPlanner)
      .expect(404);
  });
});
