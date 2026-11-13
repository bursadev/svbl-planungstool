import { Language } from '../../database/enums.js';
import type { EngineContext } from './check.js';
import { buildSnapshot } from './fixture.js';
import { Ledger } from './ledger.js';
import { feasibleSlots, type SlotRequest } from './slots.js';
import type { PlanningSnapshot } from './types.js';

function ctxOf(snapshot: PlanningSnapshot = buildSnapshot()): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

const request = (over: Partial<SlotRequest> = {}): SlotRequest => ({
  courseId: 'P1',
  courseTypeId: 'UK-1',
  locationId: 'RUP',
  language: Language.De,
  seats: 10,
  blockedWeekdays: new Set([1]),
  window: { startsOn: '2027-02-01', endsOn: '2027-04-30' },
  notBefore: '2027-02-01',
  groupKey: 'g1',
  cohortId: null,
  ...over,
});

describe('feasibleSlots', () => {
  it('prefers a free day and the smallest sufficient room, keeps the school day free', () => {
    const { slots, rejected } = feasibleSlots(request(), ctxOf());
    expect(rejected).toEqual([]);
    expect(slots[0]).toMatchObject({
      dates: ['2027-02-03'],
      roomId: 'T1',
      score: 100,
    });
    expect(slots[0].reasons).toEqual([
      '3 freie Ausbilder',
      'Schultag Mo ausgespart',
      'Raum T1 reserviert',
    ]);
    // Tuesday 2 February: X1 occupies T1 and the location, so T2 and a spread penalty.
    const tuesday = slots.find((s) => s.dates[0] === '2027-02-02')!;
    expect(tuesday).toMatchObject({ roomId: 'T2', score: 90 });
    expect(
      slots.every((s) => s.dates.every((d) => new Date(d).getUTCDay() !== 1)),
    ).toBe(true);
  });

  it('rejects weeks without devices and finds the practice hall otherwise', () => {
    const req = request({
      courseTypeId: 'UK-2',
      seats: 20,
      blockedWeekdays: new Set(),
      window: { startsOn: '2027-03-01', endsOn: '2027-03-14' },
    });
    const { slots, rejected } = feasibleSlots(req, ctxOf());
    expect(rejected).toEqual([
      { weekMonday: '2027-03-01', reason: 'Geräte fehlen: 1 × Stapler' },
    ]);
    expect(slots.map((s) => [s.dates[0], s.roomId])).toEqual([
      ['2027-03-08', 'H1'],
      ['2027-03-09', 'H1'],
    ]);
    expect(
      feasibleSlots(req, ctxOf(), { ignoreDevices: true }).rejected,
    ).toEqual([]);
  });

  it('explains when the school days leave no block', () => {
    const req = request({
      courseTypeId: 'UK-2',
      seats: 10,
      blockedWeekdays: new Set([2, 4]),
    });
    const { slots, rejected } = feasibleSlots(req, ctxOf());
    expect(slots).toEqual([]);
    expect(rejected[0].reason).toBe(
      'Schultag Di, Do lässt keinen Block von 4 Tagen zu',
    );
    expect(rejected).toHaveLength(13);
  });

  it('respects room capacity, location capacity and the group weeks', () => {
    const ctx = ctxOf();
    expect(feasibleSlots(request({ seats: 30 }), ctx).rejected[0].reason).toBe(
      'kein passender Raum am Standort (Theorieraum für 30 Plätze)',
    );
    const mar = feasibleSlots(
      request({
        locationId: 'MAR',
        language: Language.Fr,
        blockedWeekdays: new Set([5]),
        window: { startsOn: '2027-02-01', endsOn: '2027-02-07' },
      }),
      ctx,
    );
    expect(mar.slots.map((s) => s.dates[0])).toEqual([
      '2027-02-01',
      '2027-02-02',
      '2027-02-03',
      '2027-02-04',
    ]);
    ctx.ledger.bookCourse({
      id: 'OTHER',
      courseTypeId: 'UK-1',
      days: [{ heldOn: '2027-02-01', locationId: 'MAR', roomId: 'MT1' }],
      instructorIds: [],
      apprenticeIds: [],
    });
    // MAR takes one parallel course: Monday is full now.
    const marBusy = feasibleSlots(
      request({
        locationId: 'MAR',
        language: Language.Fr,
        blockedWeekdays: new Set([5]),
        window: { startsOn: '2027-02-01', endsOn: '2027-02-07' },
      }),
      ctx,
    );
    expect(marBusy.slots.map((s) => s.dates[0])).toEqual([
      '2027-02-02',
      '2027-02-03',
      '2027-02-04',
    ]);
    const grouped = feasibleSlots(
      request({ window: { startsOn: '2027-02-01', endsOn: '2027-02-14' } }),
      ctxOf(),
      {
        groupWeeks: new Set(['2027-02-01']),
      },
    );
    expect(grouped.slots[0].dates[0]).toBe('2027-02-09');
    expect(
      grouped.slots.find((s) => s.dates[0] === '2027-02-03'),
    ).toMatchObject({ score: 80 });
  });

  it('flags weeks without a free instructor', () => {
    const snapshot = buildSnapshot();
    for (const i of snapshot.instructors.values()) i.languages = [Language.Fr];
    const { slots } = feasibleSlots(
      request({ window: { startsOn: '2027-02-01', endsOn: '2027-02-07' } }),
      ctxOf(snapshot),
    );
    expect(slots[0]).toMatchObject({ score: 70 });
    expect(slots[0].reasons).toContain('kein freier Ausbilder in dieser Woche');
  });
});
