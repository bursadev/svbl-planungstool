import { Language, RoomKind } from '../../database/enums.js';
import { dayPatterns, mondaysBetween } from './calendar.js';
import { rankCandidates, type EngineContext } from './check.js';
import { deviceCheck } from './devices.js';
import type { IsoDate, SnapshotRoom } from './types.js';

export interface SlotRequest {
  courseId: string;
  courseTypeId: string;
  locationId: string;
  language: Language;
  seats: number;
  blockedWeekdays: ReadonlySet<number>;
  window: { startsOn: IsoDate; endsOn: IsoDate };
  /** Earliest first day (today plus lead time, or the week after the current one). */
  notBefore: IsoDate;
  /** The demand group; slots in a week the group already uses score lower. */
  groupKey: string;
  cohortId: string | null;
}

export interface Slot {
  dates: IsoDate[];
  roomId: string | null;
  score: number;
  reasons: string[];
}

export interface SlotSearch {
  /** Best first; ties by first date, then room. */
  slots: Slot[];
  rejected: { weekMonday: IsoDate; reason: string }[];
}

export interface SlotOptions {
  ignoreDevices?: boolean;
  /** Mondays to search instead of the window's weeks (fix options use it). */
  weeks?: IsoDate[];
  /** Mondays the demand group already has a course in. */
  groupWeeks?: ReadonlySet<IsoDate>;
  /** Overrides the course type's duration (the split option plans two shorter parts). */
  durationDays?: number;
}

const WEEKDAY_SHORT = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
/** Instructor supply is checked for the best slots only; a run would otherwise check every instructor per week. */
const SUPPLY_CHECKED = 8;

function weekdayNames(blocked: ReadonlySet<number>): string {
  return [...blocked]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_SHORT[d])
    .join(', ');
}

function mostFrequent(reasons: string[]): string {
  const counts = new Map<string, number>();
  for (const r of reasons) counts.set(r, (counts.get(r) ?? 0) + 1);
  return (
    [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? 'kein Termin'
  );
}

/**
 * Soft score of a slot that passed the hard checks (start 100): −10 per
 * course already at the location on the busiest of the days, −20 when the
 * group already has a course that week, −30 when no instructor is free
 * (checked by the caller for the best slots only).
 */
export function scoreSlot(
  slot: Pick<Slot, 'dates' | 'roomId'>,
  req: SlotRequest,
  ctx: EngineContext,
  opts: SlotOptions & { checkSupply?: boolean } = {},
): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];
  const load = Math.max(
    ...slot.dates.map((d) => ctx.ledger.locationLoad(req.locationId, d)),
  );
  if (load > 0) {
    score -= 10 * load;
    reasons.push(
      `${load} ${load === 1 ? 'Kurs' : 'Kurse'} am Standort am selben Tag`,
    );
  }
  const monday = mondaysBetween(slot.dates[0], slot.dates[0])[0];
  if (opts.groupWeeks?.has(monday)) {
    score -= 20;
    reasons.push('Gruppe hat in dieser Woche schon einen Kurs');
  }
  if (opts.checkSupply) {
    const supply = rankCandidates(
      {
        id: req.courseId,
        courseTypeId: req.courseTypeId,
        locationId: req.locationId,
        language: req.language,
        cohortId: req.cohortId,
        dates: slot.dates,
      },
      ctx,
    ).length;
    if (supply === 0) {
      score -= 30;
      reasons.push('kein freier Ausbilder in dieser Woche');
    } else {
      reasons.push(`${supply} freie Ausbilder`);
    }
  }
  if (req.blockedWeekdays.size)
    reasons.push(`Schultag ${weekdayNames(req.blockedWeekdays)} ausgespart`);
  const room = slot.roomId ? ctx.snapshot.rooms.get(slot.roomId) : undefined;
  if (room) reasons.push(`Raum ${room.name} reserviert`);
  return { score: Math.max(0, score), reasons };
}

/**
 * Every slot of the course inside its window: a day pattern of the week
 * that keeps the school days free, a free room of the right kind with
 * enough capacity, location capacity and device stock on every day. Weeks
 * without a slot come back with the most frequent rejection reason.
 */
export function feasibleSlots(
  req: SlotRequest,
  ctx: EngineContext,
  opts: SlotOptions = {},
): SlotSearch {
  const { snapshot, ledger } = ctx;
  const type = snapshot.courseTypes.get(req.courseTypeId);
  const location = snapshot.locations.get(req.locationId);
  const weeks =
    opts.weeks ?? mondaysBetween(req.window.startsOn, req.window.endsOn);
  if (!type || !location) {
    return {
      slots: [],
      rejected: weeks.map((weekMonday) => ({
        weekMonday,
        reason: 'Kurstyp oder Standort unbekannt',
      })),
    };
  }
  const durationDays = opts.durationDays ?? type.durationDays;
  const needsPractice = type.requiredDevices.length > 0;
  const roomKind = needsPractice ? RoomKind.PracticeHall : RoomKind.Theory;
  const roomKindLabel = needsPractice ? 'Praxishalle' : 'Theorieraum';
  const rooms = [...snapshot.rooms.values()]
    .filter(
      (r) =>
        r.locationId === req.locationId &&
        r.active &&
        r.kind === roomKind &&
        (r.capacity === null || r.capacity >= req.seats),
    )
    .sort(roomOrder);
  if (rooms.length === 0) {
    return {
      slots: [],
      rejected: weeks.map((weekMonday) => ({
        weekMonday,
        reason: `kein passender Raum am Standort (${roomKindLabel} für ${req.seats} Plätze)`,
      })),
    };
  }

  const slots: Slot[] = [];
  const rejected: SlotSearch['rejected'] = [];
  for (const weekMonday of weeks) {
    const patterns = dayPatterns({
      weekMonday,
      durationDays,
      weekdayRule: type.weekdayRule,
      maySpanWeeks: type.maySpanWeeks,
      blockedWeekdays: req.blockedWeekdays,
      holidays: snapshot.holidays,
      notBefore: req.notBefore,
    }).filter(
      (dates) =>
        dates[0] >= req.window.startsOn &&
        dates[dates.length - 1] <= req.window.endsOn,
    );
    if (patterns.length === 0) {
      rejected.push({
        weekMonday,
        reason: req.blockedWeekdays.size
          ? `Schultag ${weekdayNames(req.blockedWeekdays)} lässt keinen Block von ${durationDays} Tagen zu`
          : `kein Block von ${durationDays} Tagen in dieser Woche (Feiertag, Fensterende oder Startdatum)`,
      });
      continue;
    }
    const weekReasons: string[] = [];
    let found = 0;
    for (const dates of patterns) {
      if (
        dates.some(
          (d) =>
            ledger.locationLoad(req.locationId, d) >=
            location.parallelCourseCapacity,
        )
      ) {
        weekReasons.push('Standortkapazität erreicht');
        continue;
      }
      const room = rooms.find((r) =>
        dates.every((d) => ledger.roomBusyOn(r.id, d) === null),
      );
      if (!room) {
        weekReasons.push(`kein freier ${roomKindLabel}`);
        continue;
      }
      if (!opts.ignoreDevices && needsPractice) {
        const missing = deviceCheck(
          { courseTypeId: req.courseTypeId, locationId: req.locationId, dates },
          ctx,
        ).filter((item) => !item.ok);
        if (missing.length) {
          weekReasons.push(
            `Geräte fehlen: ${missing.map((m) => `${m.needed - Math.max(0, m.free)} × ${m.name}`).join(', ')}`,
          );
          continue;
        }
      }
      const { score, reasons } = scoreSlot(
        { dates, roomId: room.id },
        req,
        ctx,
        opts,
      );
      slots.push({ dates, roomId: room.id, score, reasons });
      found++;
    }
    if (found === 0)
      rejected.push({ weekMonday, reason: mostFrequent(weekReasons) });
  }

  slots.sort(slotOrder);
  // Instructor supply only for the best candidates, then the final order.
  for (const slot of slots.slice(0, SUPPLY_CHECKED)) {
    const scored = scoreSlot(slot, req, ctx, { ...opts, checkSupply: true });
    slot.score = scored.score;
    slot.reasons = scored.reasons;
  }
  slots.sort(slotOrder);
  return { slots, rejected };
}

function roomOrder(a: SnapshotRoom, b: SnapshotRoom): number {
  const ca = a.capacity ?? Number.MAX_SAFE_INTEGER;
  const cb = b.capacity ?? Number.MAX_SAFE_INTEGER;
  return ca - cb || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

function slotOrder(a: Slot, b: Slot): number {
  return (
    b.score - a.score ||
    a.dates[0].localeCompare(b.dates[0]) ||
    (a.roomId ?? '').localeCompare(b.roomId ?? '')
  );
}
