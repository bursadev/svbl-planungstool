import {
  addDays,
  cohortSemester,
  datesBetween,
  dayPatterns,
  formatDate,
  isoWeek,
  isoWeekday,
  mondayOf,
  mondaysBetween,
  publicHolidays,
  schoolYearStart,
} from './calendar.js';

describe('calendar', () => {
  it('isoWeekday and isoWeek follow ISO 8601', () => {
    expect(isoWeekday('2026-11-13')).toBe(5);
    expect(isoWeekday('2026-11-15')).toBe(7);
    expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
    expect(isoWeek('2026-10-01')).toEqual({ year: 2026, week: 40 });
    expect(mondayOf('2026-11-13')).toBe('2026-11-09');
    expect(mondayOf('2026-11-09')).toBe('2026-11-09');
  });

  it('addDays and datesBetween work across month ends', () => {
    expect(addDays('2027-02-27', 3)).toBe('2027-03-02');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
    expect(datesBetween('2027-02-27', '2027-03-02')).toEqual([
      '2027-02-27',
      '2027-02-28',
      '2027-03-01',
      '2027-03-02',
    ]);
    expect(mondaysBetween('2027-02-03', '2027-02-16')).toEqual([
      '2027-02-01',
      '2027-02-08',
      '2027-02-15',
    ]);
  });

  it('formats dates the Swiss way', () => {
    expect(formatDate('2027-03-04')).toBe('4.3.2027');
    expect(formatDate('2027-03-04', { year: false })).toBe('4.3.');
  });

  it('cohortSemester counts from the August of the start year', () => {
    expect(schoolYearStart('2026-08-01')).toBe(2026);
    expect(schoolYearStart('2027-02-01')).toBe(2026);
    expect(
      cohortSemester({ startYear: 2024, track: 'efz' }, '2026-08-01'),
    ).toBe(5);
    expect(
      cohortSemester({ startYear: 2025, track: 'efz' }, '2027-02-01'),
    ).toBe(4);
    expect(
      cohortSemester({ startYear: 2026, track: 'eba' }, '2027-02-01'),
    ).toBe(2);
    expect(
      cohortSemester({ startYear: 2025, track: 'eba' }, '2027-08-01'),
    ).toBeNull();
    expect(
      cohortSemester({ startYear: 2027, track: 'efz' }, '2027-02-01'),
    ).toBeNull();
  });

  it('publicHolidays knows the moving feasts', () => {
    expect(publicHolidays(2027)).toEqual(
      expect.arrayContaining([
        '2027-01-01',
        '2027-03-26',
        '2027-03-29',
        '2027-05-06',
        '2027-05-17',
        '2027-08-01',
        '2027-12-25',
        '2027-12-26',
      ]),
    );
    expect(publicHolidays(2026)).toContain('2026-04-03');
  });

  it('dayPatterns keeps blocked weekdays, weekends and holidays free', () => {
    const base = {
      weekMonday: '2027-03-22',
      durationDays: 2,
      weekdayRule: 'weekdays',
      maySpanWeeks: false,
      holidays: new Set(['2027-03-26']),
    } as const;
    expect(dayPatterns({ ...base, blockedWeekdays: new Set([1]) })).toEqual([
      ['2027-03-23', '2027-03-24'],
      ['2027-03-24', '2027-03-25'],
    ]);
    expect(
      dayPatterns({ ...base, durationDays: 4, blockedWeekdays: new Set() }),
    ).toEqual([['2027-03-22', '2027-03-23', '2027-03-24', '2027-03-25']]);
    expect(
      dayPatterns({ ...base, durationDays: 4, blockedWeekdays: new Set([3]) }),
    ).toEqual([]);
  });

  it('dayPatterns spans weeks only when the type allows it', () => {
    const req = {
      weekMonday: '2027-03-01',
      durationDays: 4,
      weekdayRule: 'weekdays',
      blockedWeekdays: new Set<number>(),
      holidays: new Set<string>(),
    } as const;
    expect(
      dayPatterns({ ...req, maySpanWeeks: false }).map((p) => p[0]),
    ).toEqual(['2027-03-01', '2027-03-02']);
    expect(dayPatterns({ ...req, maySpanWeeks: true }).at(-1)).toEqual([
      '2027-03-05',
      '2027-03-08',
      '2027-03-09',
      '2027-03-10',
    ]);
  });

  it('dayPatterns respects notBefore', () => {
    expect(
      dayPatterns({
        weekMonday: '2027-03-01',
        durationDays: 1,
        weekdayRule: 'weekdays',
        maySpanWeeks: false,
        blockedWeekdays: new Set(),
        holidays: new Set(),
        notBefore: '2027-03-04',
      }),
    ).toEqual([['2027-03-04'], ['2027-03-05']]);
  });

  it('dayPatterns uses consecutive Saturdays for the Saturday rule', () => {
    expect(
      dayPatterns({
        weekMonday: '2027-03-01',
        durationDays: 2,
        weekdayRule: 'saturday',
        maySpanWeeks: true,
        blockedWeekdays: new Set(),
        holidays: new Set(),
      }),
    ).toEqual([['2027-03-06', '2027-03-13']]);
  });
});
