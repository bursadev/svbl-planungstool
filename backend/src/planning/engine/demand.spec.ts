import { Track } from '../../database/enums.js';
import {
  generateDemand,
  mergeGroups,
  openModules,
  sizeCourses,
} from './demand.js';
import { buildSnapshot } from './fixture.js';

const FS_2027 = { startsOn: '2027-02-01', endsOn: '2027-07-31' };
const HS_2027 = { startsOn: '2027-08-01', endsOn: '2028-01-31' };

describe('sizeCourses', () => {
  it('balances the sizes', () => {
    expect(sizeCourses(25, 12, null)).toEqual([9, 8, 8]);
    expect(sizeCourses(24, 12, null)).toEqual([12, 12]);
    expect(sizeCourses(3, 12, 6)).toEqual([3]);
    expect(sizeCourses(0, 12, null)).toEqual([]);
  });
});

describe('openModules', () => {
  it('splits the modules into the semester and the catch-ups, leaving out covered and variant modules', () => {
    const snapshot = buildSnapshot();
    const a01 = snapshot.apprentices.get('a01')!;
    expect(openModules(a01, 4, snapshot).current.map((m) => m.id)).toEqual([
      'M2',
    ]);
    expect(
      openModules(snapshot.apprentices.get('a02')!, 4, snapshot).current.map(
        (m) => m.id,
      ),
    ).toEqual(['M1', 'M2']);
    expect(openModules(a01, 5, snapshot)).toEqual({
      current: [],
      catchUp: [expect.objectContaining({ id: 'M2' })],
    });
  });
});

describe('generateDemand', () => {
  it('groups the apprentices by module, location, language and school days', () => {
    const { groups, catchUps, skippedVariantModules, apprenticesWithoutClass } =
      generateDemand(buildSnapshot(), FS_2027);
    expect(
      groups.map((g) => [
        g.moduleId,
        g.locationId,
        g.language,
        g.blockedWeekdays,
        g.memberIds.length,
      ]),
    ).toEqual([
      ['M1', 'MAR', 'fr', [5], 6],
      ['M1', 'RUP', 'de', [], 2],
      ['M1', 'RUP', 'de', [1], 19],
      ['M1', 'RUP', 'de', [2, 4], 10],
      ['M2', 'MAR', 'fr', [5], 6],
      ['M2', 'RUP', 'de', [], 2],
      ['M2', 'RUP', 'de', [1], 20],
      ['M2', 'RUP', 'de', [2, 4], 10],
    ]);
    expect(catchUps).toBe(0);
    expect(skippedVariantModules).toEqual([]);
    expect(apprenticesWithoutClass).toBe(2);
  });

  it('attaches the time window or the period and nets the free seats of existing courses once', () => {
    const { groups } = generateDemand(buildSnapshot(), FS_2027);
    const m1 = groups.filter(
      (g) => g.moduleId === 'M1' && g.locationId === 'RUP',
    );
    expect(m1.map((g) => g.timeWindowId)).toEqual(['W1', 'W1', 'W1']);
    expect(m1[0].window).toEqual({
      startsOn: '2027-02-01',
      endsOn: '2027-04-30',
    });
    // X1 (12 free seats) is handed to the first group in order; the others get nothing.
    expect(
      m1.map((g) => [g.existingFreeSeats, g.participantCount, g.sizes]),
    ).toEqual([
      [2, 0, []],
      [10, 9, [9]],
      [0, 10, [10]],
    ]);
    expect(m1[1].notes).toContain(
      '10 freie Plätze in bestehenden Kursen angerechnet',
    );
    const m2 = groups.find(
      (g) =>
        g.moduleId === 'M2' &&
        g.locationId === 'RUP' &&
        g.blockedWeekdays.join() === '1',
    )!;
    expect(m2.timeWindowId).toBeNull();
    expect(m2.window).toEqual(FS_2027);
    expect(m2.notes).toContain('Zeitfenster: Periode (kein Fenster erfasst)');
    expect(m2.sizes).toEqual([20]);
    expect(m2.classIds).toEqual(['K1']);
  });

  it('counts catch-ups and skipped variant modules', () => {
    const snapshot = buildSnapshot();
    snapshot.courseTypes.set('UK-0', {
      ...snapshot.courseTypes.get('UK-1')!,
      id: 'UK-0',
      code: 'UK-0',
    });
    snapshot.modules.set('M0', {
      id: 'M0',
      track: Track.Efz,
      courseTypeId: 'UK-0',
      semester: 1,
      sequence: 101,
      active: true,
      prerequisiteModuleIds: [],
    });
    expect(generateDemand(snapshot, FS_2027).catchUps).toBe(38);
    const autumn = generateDemand(buildSnapshot(), HS_2027);
    expect(autumn.groups).toEqual([]);
    expect(autumn.skippedVariantModules).toEqual(['üK 5.1.D EFZ']);
  });

  it('is deterministic', () => {
    expect(generateDemand(buildSnapshot(), FS_2027)).toEqual(
      generateDemand(buildSnapshot(), FS_2027),
    );
  });
});

describe('mergeGroups', () => {
  it('merges school-day groups while a course still fits, smallest first', () => {
    const snapshot = buildSnapshot();
    const merged = mergeGroups(
      generateDemand(snapshot, FS_2027).groups,
      snapshot,
    );
    const rup = (moduleId: string) =>
      merged.filter((g) => g.moduleId === moduleId && g.locationId === 'RUP');
    // 1-day course: every school day still leaves a free day, one group of 31.
    expect(
      rup('M1').map((g) => [
        g.blockedWeekdays,
        g.memberIds.length,
        g.existingFreeSeats,
        g.sizes,
      ]),
    ).toEqual([[[1, 2, 4], 31, 12, [10, 9]]]);
    expect(rup('M1')[0].classIds.sort()).toEqual(['K1', 'K2']);
    expect(rup('M1')[0].notes).toContain('Schultag-Gruppen zusammengelegt');
    // 4-day course: Tuesday + Thursday leave no block at all, so nothing joins the K2 group and the
    // apprentices without class go to the Monday class instead.
    expect(
      rup('M2').map((g) => [g.blockedWeekdays, g.memberIds.length, g.sizes]),
    ).toEqual([
      [[1], 22, [11, 11]],
      [[2, 4], 10, [10]],
    ]);
    expect(merged.filter((g) => g.locationId === 'MAR')).toHaveLength(2);
  });
});
