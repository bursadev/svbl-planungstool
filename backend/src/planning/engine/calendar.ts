import { Track, WeekdayRule } from '../../database/enums.js';
import type { IsoDate, SnapshotCohort } from './types.js';

/**
 * Date arithmetic of the engine. Everything runs on UTC timestamps of ISO
 * date strings, so daylight-saving changes cannot shift a day.
 */

const DAY_MS = 86_400_000;

function toUtc(date: IsoDate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(date: IsoDate): number {
  const day = new Date(toUtc(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, 1 - isoWeekday(date));
}

/** ISO 8601 week: the week that contains the Thursday decides the year. */
export function isoWeek(date: IsoDate): { year: number; week: number } {
  const thursday = addDays(mondayOf(date), 3);
  const year = Number(thursday.slice(0, 4));
  const week1Monday = mondayOf(`${year}-01-04`);
  const week =
    Math.round((toUtc(thursday) - toUtc(week1Monday)) / (7 * DAY_MS)) + 1;
  return { year, week };
}

/** Every date from `from` to `to`, both inclusive. */
export function datesBetween(from: IsoDate, to: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  for (let t = toUtc(from); t <= toUtc(to); t += DAY_MS) out.push(fromUtc(t));
  return out;
}

/** The Monday of every ISO week that touches `[from, to]`. */
export function mondaysBetween(from: IsoDate, to: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  for (let monday = mondayOf(from); monday <= to; monday = addDays(monday, 7)) {
    out.push(monday);
  }
  return out;
}

/** Swiss short date «4.3.2027», or «4.3.» without the year. */
export function formatDate(date: IsoDate, opts?: { year?: boolean }): string {
  const [y, m, d] = date.split('-').map(Number);
  return opts?.year === false ? `${d}.${m}.` : `${d}.${m}.${y}`;
}

/** Calendar year the school year of `date` starts in: August to December → that year, else the year before. */
export function schoolYearStart(date: IsoDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return month >= 8 ? year : year - 1;
}

/**
 * Semester of a cohort in the period that starts on `periodStartsOn`:
 * `2 · (schoolYearStart − startYear) + (spring ? 2 : 1)`; null when the
 * cohort has not started yet or has finished (EFZ 6 semesters, EBA 4).
 */
export function cohortSemester(
  cohort: Pick<SnapshotCohort, 'startYear' | 'track'>,
  periodStartsOn: IsoDate,
): number | null {
  const spring = Number(periodStartsOn.slice(5, 7)) < 8;
  const semester =
    2 * (schoolYearStart(periodStartsOn) - cohort.startYear) + (spring ? 2 : 1);
  const last = cohort.track === Track.Eba ? 4 : 6;
  return semester >= 1 && semester <= last ? semester : null;
}

/** Easter Sunday (Gregorian, Meeus/Jones/Butcher). */
function easterSunday(year: number): IsoDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return fromUtc(Date.UTC(year, month - 1, day));
}

/** The national holidays of Switzerland; no course day falls on them. */
export function publicHolidays(year: number): IsoDate[] {
  const easter = easterSunday(year);
  return [
    `${year}-01-01`,
    addDays(easter, -2), // Karfreitag
    addDays(easter, 1), // Ostermontag
    addDays(easter, 39), // Auffahrt
    addDays(easter, 50), // Pfingstmontag
    `${year}-08-01`,
    `${year}-12-25`,
    `${year}-12-26`,
  ];
}

export interface DayPatternRequest {
  /** Monday of the week the course starts in. */
  weekMonday: IsoDate;
  durationDays: number;
  weekdayRule: WeekdayRule;
  maySpanWeeks: boolean;
  /** ISO weekdays the group is at school. */
  blockedWeekdays: ReadonlySet<number>;
  holidays: ReadonlySet<IsoDate>;
  /** Patterns starting before this date are dropped. */
  notBefore?: IsoDate;
}

/**
 * Every list of course dates that starts in the given week, earliest first.
 * Weekday courses run on consecutive Monday–Friday days: a holiday or a
 * school day breaks the block («zusammenhängend», handoff), only a weekend
 * may be skipped, and only when the course type may span weeks. Saturday
 * courses run on consecutive Saturdays.
 */
export function dayPatterns(req: DayPatternRequest): IsoDate[][] {
  const {
    weekMonday,
    durationDays,
    weekdayRule,
    maySpanWeeks,
    blockedWeekdays,
    holidays,
    notBefore,
  } = req;
  if (durationDays < 1) return [];

  if (weekdayRule === WeekdayRule.Saturday) {
    const saturday = addDays(weekMonday, 5);
    if (notBefore && saturday < notBefore) return [];
    const dates: IsoDate[] = [];
    for (let i = 0; i < durationDays; i++) dates.push(addDays(saturday, 7 * i));
    const usable = dates.every(
      (date) => !holidays.has(date) && !blockedWeekdays.has(isoWeekday(date)),
    );
    return usable ? [dates] : [];
  }

  const usable = (date: IsoDate): boolean => {
    const weekday = isoWeekday(date);
    return weekday <= 5 && !blockedWeekdays.has(weekday) && !holidays.has(date);
  };
  const out: IsoDate[][] = [];
  for (let offset = 0; offset < 5; offset++) {
    const start = addDays(weekMonday, offset);
    if (!usable(start) || (notBefore !== undefined && start < notBefore)) {
      continue;
    }
    const dates = [start];
    let cursor = start;
    let contiguous = true;
    while (dates.length < durationDays) {
      cursor = addDays(cursor, 1);
      if (isoWeekday(cursor) > 5) {
        if (!maySpanWeeks) {
          contiguous = false;
          break;
        }
        continue;
      }
      if (!usable(cursor)) {
        contiguous = false;
        break;
      }
      dates.push(cursor);
    }
    if (contiguous) out.push(dates);
  }
  return out;
}
