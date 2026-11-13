import type { EngineContext } from './check.js';
import { generateDemand, mergeGroups } from './demand.js';
import { buildSnapshot } from './fixture.js';
import { Ledger } from './ledger.js';
import {
  existingCoursesFor,
  packApprentices,
  proposeCourses,
} from './propose.js';
import type { PlanningSnapshot } from './types.js';

const FS_2027 = { startsOn: '2027-02-01', endsOn: '2027-07-31' };

function ctxOf(snapshot: PlanningSnapshot = buildSnapshot()): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

function groupsOf(snapshot: PlanningSnapshot) {
  return mergeGroups(generateDemand(snapshot, FS_2027).groups, snapshot);
}

describe('proposeCourses', () => {
  it('places the courses of every group and names the issue of the rest', () => {
    const ctx = ctxOf();
    const { courses, unassigned } = proposeCourses(
      groupsOf(ctx.snapshot),
      ctx,
      { notBefore: '2027-02-01' },
    );
    const summary = courses.map((c) => [
      c.courseTypeId,
      c.locationId,
      c.seats,
      c.dates.length,
      c.roomId,
      c.issue,
    ]);
    expect(summary).toEqual([
      ['UK-1', 'MAR', 6, 1, 'MT1', null],
      ['UK-1', 'RUP', 10, 1, 'T1', null],
      ['UK-1', 'RUP', 9, 1, 'T1', null],
      [
        'UK-2',
        'MAR',
        6,
        0,
        null,
        'kein passender Raum am Standort (Praxishalle für 6 Plätze)',
      ],
      ['UK-2', 'RUP', 11, 4, 'H1', null],
      ['UK-2', 'RUP', 11, 4, 'H1', null],
      [
        'UK-2',
        'RUP',
        10,
        0,
        null,
        'Schultag Di, Do lässt keinen Block von 4 Tagen zu',
      ],
    ]);
    // The two UK-2 courses share the only practice hall and the two forklifts: different weeks.
    const uk2 = courses.filter(
      (c) => c.courseTypeId === 'UK-2' && c.dates.length,
    );
    expect(uk2[0].dates[0] < uk2[1].dates[0]).toBe(true);
    expect(
      uk2.every((c) => c.dates.every((d) => new Date(d).getUTCDay() !== 1)),
    ).toBe(true);
    // Members: 31 in the merged UK-1 group → 12 into X1 and 19 into the two courses.
    const uk1 = courses.filter(
      (c) => c.courseTypeId === 'UK-1' && c.locationId === 'RUP',
    );
    expect(uk1.map((c) => c.memberIds.length)).toEqual([10, 9]);
    expect(unassigned.map((u) => u.reason)).toEqual([
      ...Array(6).fill(
        'Kurs nicht planbar: kein passender Raum am Standort (Praxishalle für 6 Plätze)',
      ),
      ...Array(10).fill(
        'Kurs nicht planbar: Schultag Di, Do lässt keinen Block von 4 Tagen zu',
      ),
    ]);
  });

  it('is deterministic', () => {
    const run = () => {
      const ctx = ctxOf();
      return proposeCourses(groupsOf(ctx.snapshot), ctx, {
        notBefore: '2027-02-01',
      });
    };
    expect(run()).toEqual(run());
  });
});

describe('packApprentices', () => {
  it('fills existing courses first with whole classes, keeps classmates together and respects school days', () => {
    const ctx = ctxOf();
    const group = groupsOf(ctx.snapshot).find(
      (g) => g.courseTypeId === 'UK-1' && g.locationId === 'RUP',
    )!;
    const courses = [
      { ...course(group, '#1', 10), dates: ['2027-02-03'], roomId: 'T1' },
      { ...course(group, '#2', 9), dates: ['2027-02-05'], roomId: 'T1' },
    ];
    const existing = existingCoursesFor(group, ctx.snapshot);
    expect(existing.map((c) => c.id)).toEqual(['X1']);
    const { placements, unassigned } = packApprentices(
      group,
      courses,
      existing,
      ctx,
    );
    expect(unassigned).toEqual([]);
    expect(placements).toHaveLength(31);
    const into = (key: string | null, existingId: string | null) =>
      placements
        .filter((p) => p.courseKey === key && p.existingCourseId === existingId)
        .map((p) => p.apprenticeId);
    // K2 (10, school on Tuesday) cannot sit in X1 on 2 February: it takes the 10-seat course as a whole.
    expect(into(courses[0].key, null).sort()).toEqual(
      group.memberIds
        .filter(
          (id) => ctx.snapshot.apprentices.get(id)?.schoolClassId === 'K2',
        )
        .sort(),
    );
    expect(into(null, 'X1')).toHaveLength(12);
    expect(into(courses[1].key, null)).toHaveLength(9);
    expect(ctx.ledger.apprenticeBusyOn(into(null, 'X1')[0], '2027-02-02')).toBe(
      'X1',
    );
  });

  it('reports apprentices that are busy on every target day', () => {
    const ctx = ctxOf();
    const group = groupsOf(ctx.snapshot).find(
      (g) => g.courseTypeId === 'UK-1' && g.locationId === 'MAR',
    )!;
    ctx.ledger.bookApprentices(['f01'], ['2027-02-04'], 'X1');
    const { placements, unassigned } = packApprentices(
      group,
      [{ ...course(group, '#1', 6), dates: ['2027-02-04'], roomId: 'MT1' }],
      [],
      ctx,
    );
    expect(placements).toHaveLength(5);
    expect(unassigned).toEqual([
      { apprenticeId: 'f01', reason: 'an diesen Tagen bereits in UK-1' },
    ]);
  });

  it('lists the members of an unplannable group', () => {
    const ctx = ctxOf();
    const group = groupsOf(ctx.snapshot).find(
      (g) => g.courseTypeId === 'UK-2' && g.locationId === 'MAR',
    )!;
    const { unassigned } = packApprentices(
      group,
      [{ ...course(group, '#1', 6), issue: 'kein Raum' }],
      [],
      ctx,
    );
    expect(unassigned).toHaveLength(6);
    expect(unassigned[0].reason).toBe('Kurs nicht planbar: kein Raum');
  });
});

function course(
  group: ReturnType<typeof groupsOf>[number],
  suffix: string,
  seats: number,
) {
  return {
    key: `${group.key}${suffix}`,
    demandKey: group.key,
    courseTypeId: group.courseTypeId,
    locationId: group.locationId,
    language: group.language,
    cohortId: group.cohortId,
    timeWindowId: group.timeWindowId,
    seats,
    dates: [] as string[],
    roomId: null as string | null,
    memberIds: [] as string[],
    issue: null as string | null,
    reasons: [] as string[],
  };
}
