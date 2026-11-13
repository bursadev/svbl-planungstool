import {
  EmploymentType,
  InstructorStatus,
  Language,
} from '../../database/enums.js';
import type { CourseToStaff, EngineContext } from './check.js';
import { buildSnapshot } from './fixture.js';
import { Ledger } from './ledger.js';
import { staffCourses } from './staffing.js';
import type { PlanningSnapshot, SnapshotInstructor } from './types.js';

function ctxOf(snapshot: PlanningSnapshot): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

const uk2 = (
  id: string,
  language: Language,
  dates = ['2027-02-22', '2027-02-23', '2027-02-24', '2027-02-25'],
): CourseToStaff => ({
  id,
  courseTypeId: 'UK-2',
  locationId: 'RUP',
  language,
  cohortId: null,
  dates,
});

const instructor = (
  id: string,
  lastName: string,
  homeLocationId: string,
  languages: Language[],
): SnapshotInstructor => ({
  id,
  firstName: id,
  lastName,
  employmentType: EmploymentType.Employee,
  homeLocationId,
  languages,
  status: InstructorStatus.Active,
  preferredLocationIds: [],
  avoidInstructorIds: [],
  skillIds: ['stapler'],
  certificates: [{ certificateTypeId: 'SUVA', validUntil: '2028-01-01' }],
});

describe('staffCourses', () => {
  it('staffs the most constrained course first and reports the rest with a reason', () => {
    const ctx = ctxOf(buildSnapshot());
    const result = staffCourses(
      [
        uk2('A', Language.De, [
          '2027-03-08',
          '2027-03-09',
          '2027-03-10',
          '2027-03-11',
        ]),
        uk2('B', Language.De, ['2027-03-09', '2027-03-10']),
      ],
      ctx,
    );
    expect(result.staffed).toHaveLength(1);
    expect(result.unstaffed).toHaveLength(1);
    expect(result.staffed[0]).toMatchObject({
      instructorId: 'I1',
      candidateCount: 1,
    });
    expect(result.unstaffed[0].reason).toBe(
      'kein Ausbilder erfüllt die harten Regeln (2 statisch geeignet, alle an den Kurstagen belegt oder ohne gültiges Zertifikat)',
    );
    expect(ctx.ledger.instructorBusyOn('I1', '2027-03-09')).toBe(
      result.staffed[0].courseId,
    );
  });

  it('names the missing qualification when nobody is statically eligible', () => {
    const ctx = ctxOf(buildSnapshot());
    const result = staffCourses([uk2('C', Language.It)], ctx);
    expect(result.unstaffed[0].reason).toBe(
      'kein Ausbilder mit Skills, Sprache und Zertifikaten für UK-2',
    );
  });

  it('frees an instructor for an unstaffed course by a 2-swap', () => {
    const snapshot = buildSnapshot({
      instructors: new Map(
        [
          instructor('I5', 'Nussbaum', 'BER', [Language.De]),
          instructor('I6', 'Odermatt', 'RUP', [Language.De, Language.Fr]),
          instructor('I7', 'Pfister', 'RUP', [Language.Fr, Language.It]),
        ].map((i) => [i.id, i]),
      ),
      availabilities: [],
    });
    // A (de): I5 or I6, I6 scores higher at its home location; B (fr): I6 or I7; C (it): I7 only.
    const courses = [
      uk2('A', Language.De),
      uk2('B', Language.Fr),
      uk2('C', Language.It),
    ];

    const greedy = staffCourses(courses, ctxOf(snapshot), { improve: false });
    expect(greedy.staffed.map((s) => [s.courseId, s.instructorId])).toEqual([
      ['A', 'I6'],
      ['C', 'I7'],
    ]);
    expect(greedy.unstaffed.map((u) => u.courseId)).toEqual(['B']);

    const improved = staffCourses(courses, ctxOf(snapshot));
    expect(improved.unstaffed).toEqual([]);
    expect(improved.staffed.map((s) => [s.courseId, s.instructorId])).toEqual([
      ['A', 'I5'],
      ['B', 'I6'],
      ['C', 'I7'],
    ]);
  });

  it('is deterministic', () => {
    const courses = [
      uk2('A', Language.De),
      uk2('B', Language.De, ['2027-03-01', '2027-03-02']),
    ];
    const first = staffCourses(courses, ctxOf(buildSnapshot()));
    const second = staffCourses(courses, ctxOf(buildSnapshot()));
    expect(second).toEqual(first);
  });
});
