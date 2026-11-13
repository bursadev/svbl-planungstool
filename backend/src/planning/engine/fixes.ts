import { Language } from '../../database/enums.js';
import { addDays, isoWeek, mondaysBetween } from './calendar.js';
import {
  checkInstructor,
  rankCandidates,
  requiredCertificateTypes,
  requiredSkills,
  type Candidate,
  type CourseToStaff,
  type EngineContext,
} from './check.js';
import type { DemandGroup } from './demand.js';
import type { ProposedCourse } from './propose.js';
import type { Period } from './readiness.js';
import { feasibleSlots, type Slot, type SlotRequest } from './slots.js';
import type { IsoDate } from './types.js';

export type IssueKind =
  'unplannable' | 'unstaffed' | 'below_minimum' | 'unassigned_apprentice';

/** One problem of a run as the «Prüfen & Beheben» step lists it. */
export interface RunIssue {
  id: string;
  kind: IssueKind;
  courseKey: string | null;
  demandKey: string | null;
  /** «üK 2.0 EFZ · Rupperswil · KW 10 · 2025 EFZ» */
  subject: string;
  problem: string;
  count: number;
}

/** A draft course as the validation sees it: the proposal plus its staffing. */
export interface DraftCourse extends ProposedCourse {
  instructorId: string | null;
  staffingIssue: string | null;
}

export interface RunDrafts {
  courses: DraftCourse[];
  groups: DemandGroup[];
  unassigned: { apprenticeId: string; demandKey: string; reason: string }[];
}

export type FixPatch =
  | {
      kind: 'move';
      locationId: string;
      dates: IsoDate[];
      roomId: string | null;
      language?: Language;
      instructorId?: string;
    }
  | { kind: 'split'; parts: { dates: IsoDate[]; roomId: string | null }[] }
  | { kind: 'assign'; instructorId: string };

export interface FixOption {
  index: number;
  title: string;
  why: string;
  effects: string[];
  /** null: a hint the planner acts on outside the tool. */
  patch: FixPatch | null;
}

const MAX_OPTIONS = 6;
const LANGUAGE_NAMES: Record<Language, string> = {
  [Language.De]: 'Deutsch',
  [Language.Fr]: 'Französisch',
  [Language.It]: 'Italienisch',
};
const WEEKDAY_SHORT = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function subjectOf(course: DraftCourse, ctx: EngineContext): string {
  const { snapshot } = ctx;
  const code =
    snapshot.courseTypes.get(course.courseTypeId)?.code ?? course.courseTypeId;
  const location =
    snapshot.locations.get(course.locationId)?.name ?? course.locationId;
  const cohort = snapshot.cohorts.get(course.cohortId)?.label;
  const week = course.dates.length
    ? `KW ${isoWeek(course.dates[0]).week}`
    : null;
  return [code, location, week, cohort].filter(Boolean).join(' · ');
}

/** Every issue of the drafts: unplannable and unstaffed courses, groups below the minimum, apprentices without a seat. */
export function validateRun(drafts: RunDrafts, ctx: EngineContext): RunIssue[] {
  const issues: RunIssue[] = [];
  for (const course of drafts.courses) {
    if (course.issue !== null) {
      issues.push({
        id: `unplannable:${course.key}`,
        kind: 'unplannable',
        courseKey: course.key,
        demandKey: course.demandKey,
        subject: subjectOf(course, ctx),
        problem: course.issue,
        count: course.memberIds.length || course.seats,
      });
    } else if (course.instructorId === null) {
      issues.push({
        id: `unstaffed:${course.key}`,
        kind: 'unstaffed',
        courseKey: course.key,
        demandKey: course.demandKey,
        subject: subjectOf(course, ctx),
        problem:
          course.staffingIssue ??
          'Kein Ausbilder erfüllt alle harten Regeln für diesen Kurs.',
        count: 1,
      });
    }
  }
  for (const group of drafts.groups) {
    const type = ctx.snapshot.courseTypes.get(group.courseTypeId);
    const min = type?.minParticipants ?? null;
    if (
      min !== null &&
      group.participantCount > 0 &&
      group.participantCount < min
    ) {
      issues.push({
        id: `below_minimum:${group.key}`,
        kind: 'below_minimum',
        courseKey: null,
        demandKey: group.key,
        subject: `${type?.code ?? group.courseTypeId} · ${ctx.snapshot.locations.get(group.locationId)?.name ?? group.locationId}`,
        problem: `Nur ${group.participantCount} Lernende, Minimum ${min}`,
        count: group.participantCount,
      });
    }
  }
  const byGroup = new Map<string, string[]>();
  for (const u of drafts.unassigned) {
    if (u.reason.startsWith('Kurs nicht planbar')) continue;
    byGroup.set(u.demandKey, [...(byGroup.get(u.demandKey) ?? []), u.reason]);
  }
  for (const [demandKey, reasons] of byGroup) {
    const group = drafts.groups.find((g) => g.key === demandKey);
    const type = group
      ? ctx.snapshot.courseTypes.get(group.courseTypeId)
      : undefined;
    const where = group
      ? (ctx.snapshot.locations.get(group.locationId)?.name ?? group.locationId)
      : '';
    issues.push({
      id: `unassigned_apprentice:${demandKey}`,
      kind: 'unassigned_apprentice',
      courseKey: null,
      demandKey,
      subject: `${type?.code ?? demandKey} · ${where}`,
      problem: `${reasons.length} Lernende ohne Platz: ${[...new Set(reasons)].join(', ')}`,
      count: reasons.length,
    });
  }
  return issues;
}

function requestFor(
  course: DraftCourse,
  group: DemandGroup | undefined,
  period: Period,
  over: Partial<SlotRequest> = {},
): SlotRequest {
  return {
    courseId: course.key,
    courseTypeId: course.courseTypeId,
    locationId: course.locationId,
    language: course.language,
    seats: course.seats,
    blockedWeekdays: new Set(group?.blockedWeekdays ?? []),
    window: group?.window ?? {
      startsOn: period.startsOn,
      endsOn: period.endsOn,
    },
    notBefore: period.startsOn,
    groupKey: course.demandKey,
    cohortId: course.cohortId,
    ...over,
  };
}

function bestCandidate(
  course: CourseToStaff,
  ctx: EngineContext,
): Candidate | undefined {
  return rankCandidates(course, ctx, { limit: 1 })[0];
}

function name(c: Candidate): string {
  return `${c.instructor.firstName} ${c.instructor.lastName}`;
}

/**
 * Ranked ways out of an issue, in the handoff's order; every option with a
 * patch was found through `feasibleSlots` and the instructor check, so
 * applying it cannot break a hard rule.
 */
export function fixOptions(
  issue: RunIssue,
  drafts: RunDrafts,
  ctx: EngineContext,
  period: Period,
): FixOption[] {
  const { snapshot } = ctx;
  const options: Omit<FixOption, 'index'>[] = [];
  const course = drafts.courses.find((c) => c.key === issue.courseKey);
  const group = drafts.groups.find((g) => g.key === issue.demandKey);
  const type = course
    ? snapshot.courseTypes.get(course.courseTypeId)
    : undefined;
  const here = course ? snapshot.locations.get(course.locationId) : undefined;
  const otherLocations = [...snapshot.locations.values()]
    .filter((l) => l.active && l.hostsUk && l.id !== course?.locationId)
    .sort((a, b) => a.code.localeCompare(b.code));
  const week = (dates: IsoDate[]) => `KW ${isoWeek(dates[0]).week}`;
  const roomName = (id: string | null) =>
    id ? (snapshot.rooms.get(id)?.name ?? id) : 'Raum offen';

  if (issue.kind === 'unplannable' && course && type) {
    // The course occupies nothing yet; the ledger is the run as it stands.
    for (const location of otherLocations) {
      if (options.length >= MAX_OPTIONS) break;
      const slot = feasibleSlots(
        requestFor(course, group, period, { locationId: location.id }),
        ctx,
      ).slots[0];
      if (!slot) continue;
      options.push({
        title: `Standort wechseln: ${location.name}`,
        why: `In ${here?.name ?? course.locationId} ist im ganzen Zeitfenster keine Woche mit freiem Raum und Gerät verfügbar.`,
        effects: [
          `Kurs läuft in ${location.name}, ${week(slot.dates)}`,
          `Raum ${roomName(slot.roomId)}`,
          'Reisezeit für die Gruppe steigt',
        ],
        patch: {
          kind: 'move',
          locationId: location.id,
          dates: slot.dates,
          roomId: slot.roomId,
        },
      });
    }
    const window = group?.window ?? period;
    const after = {
      startsOn: addDays(window.endsOn, 1),
      endsOn: addDays(window.endsOn, 56),
    };
    const extension = feasibleSlots(
      requestFor(course, group, period, { window: after }),
      ctx,
      {
        weeks: mondaysBetween(after.startsOn, after.endsOn),
      },
    ).slots[0];
    if (extension) {
      const weeks = Math.ceil(
        (Date.parse(extension.dates[0]) - Date.parse(window.endsOn)) /
          (7 * 864e5),
      );
      options.push({
        title: `Zeitfenster um ${weeks} Wochen überschreiten`,
        why: 'Innerhalb des Zeitfensters ist am Standort nichts frei.',
        effects: [
          `Kurs läuft in ${week(extension.dates)}, Raum ${roomName(extension.roomId)}`,
          'Modul liegt ausserhalb des vorgesehenen Zeitfensters',
          'Braucht Freigabe der Bildungsverantwortlichen',
        ],
        patch: {
          kind: 'move',
          locationId: course.locationId,
          dates: extension.dates,
          roomId: extension.roomId,
        },
      });
    }
    if (type.durationDays > 2) {
      const a = Math.ceil(type.durationDays / 2);
      const b = type.durationDays - a;
      const first = feasibleSlots(requestFor(course, group, period), ctx, {
        durationDays: a,
      }).slots[0];
      const second = first
        ? feasibleSlots(
            requestFor(course, group, period, {
              window: {
                startsOn: addDays(first.dates[first.dates.length - 1], 1),
                endsOn: window.endsOn,
              },
            }),
            ctx,
            { durationDays: b },
          ).slots[0]
        : undefined;
      if (first && second) {
        const days = [...(group?.blockedWeekdays ?? [])]
          .map((d) => WEEKDAY_SHORT[d])
          .join(', ');
        options.push({
          title: `Kurs teilen: ${a} + ${b} Tage über zwei Wochen`,
          why: `Der Schultag ${days} lässt keinen zusammenhängenden Block von ${type.durationDays} Tagen zu.`,
          effects: [
            `Teil 1: ${week(first.dates)}, ${roomName(first.roomId)}, ${a} Tage`,
            `Teil 2: ${week(second.dates)}, ${roomName(second.roomId)}, ${b} Tage`,
            'Gleiche Gruppe, Schultag bleibt in beiden Wochen frei',
          ],
          patch: {
            kind: 'split',
            parts: [
              { dates: first.dates, roomId: first.roomId },
              { dates: second.dates, roomId: second.roomId },
            ],
          },
        });
      }
    }
    if (type.requiredDevices.length) {
      const withRental = feasibleSlots(requestFor(course, group, period), ctx, {
        ignoreDevices: true,
      }).slots[0];
      if (withRental) {
        const devices = type.requiredDevices
          .map(
            (d) =>
              `${d.quantity} × ${snapshot.deviceTypes.get(d.deviceTypeId)?.name ?? d.deviceTypeId}`,
          )
          .join(', ');
        options.push({
          title: `Mietgerät für ${here?.name ?? course.locationId} beschaffen`,
          why: 'Woche und Raum wären frei – nur die Geräte sind in jeder Woche belegt oder in Wartung.',
          effects: [
            `${devices} für ${week(withRental.dates)} zumieten`,
            `Kurs läuft in ${roomName(withRental.roomId)}`,
            'Zusatzkosten beim Anbieter; Gerät im Tool erfassen, dann neu vorschlagen',
          ],
          patch: null,
        });
      }
    }
  }

  if (issue.kind === 'unstaffed' && course && type) {
    const asCourse = (over: Partial<CourseToStaff> = {}): CourseToStaff => ({
      id: course.key,
      courseTypeId: course.courseTypeId,
      locationId: course.locationId,
      language: course.language,
      cohortId: course.cohortId,
      dates: course.dates,
      ...over,
    });
    for (const language of type.languages.filter(
      (l) => l !== course.language,
    )) {
      if (options.length >= MAX_OPTIONS) break;
      const best = bestCandidate(asCourse({ language }), ctx);
      if (!best) continue;
      options.push({
        title: `Kurssprache auf ${LANGUAGE_NAMES[language]} wechseln`,
        why: `Kein Ausbilder mit ${LANGUAGE_NAMES[course.language]} ist an diesen Tagen verfügbar und qualifiziert.`,
        effects: [
          `${name(best)} übernimmt (Score ${best.result.score})`,
          `Kurs wird auf ${LANGUAGE_NAMES[language]} geführt`,
          'Nur sinnvoll, wenn die Gruppe die Sprache versteht',
        ],
        patch: {
          kind: 'move',
          locationId: course.locationId,
          dates: course.dates,
          roomId: course.roomId,
          language,
          instructorId: best.instructor.id,
        },
      });
    }
    // The course occupies its slot in the ledger; release it while looking for alternatives.
    const ledger = ctx.ledger.clone();
    ledger.releaseCourse(course.key);
    const free: EngineContext = { ...ctx, ledger };
    for (const location of otherLocations) {
      if (options.length >= MAX_OPTIONS) break;
      const slot = feasibleSlots(
        requestFor(course, group, period, { locationId: location.id }),
        free,
      ).slots[0];
      if (!slot) continue;
      const best = bestCandidate(
        asCourse({ locationId: location.id, dates: slot.dates }),
        free,
      );
      if (!best) continue;
      options.push({
        title: `Standort wechseln: ${location.name}`,
        why: 'Am bisherigen Standort ist niemand qualifiziert und frei.',
        effects: [
          `${name(best)} übernimmt (Score ${best.result.score})`,
          `${week(slot.dates)}, Raum ${roomName(slot.roomId)}`,
          'Reisezeit für die Gruppe steigt',
        ],
        patch: {
          kind: 'move',
          locationId: location.id,
          dates: slot.dates,
          roomId: slot.roomId,
          instructorId: best.instructor.id,
        },
      });
    }
    if (options.length < MAX_OPTIONS) {
      const thisWeek = course.dates.length
        ? mondaysBetween(course.dates[0], course.dates[0])[0]
        : null;
      const moved = feasibleSlots(requestFor(course, group, period), free)
        .slots.filter(
          (s) => mondaysBetween(s.dates[0], s.dates[0])[0] !== thisWeek,
        )
        .map((s) => ({
          slot: s,
          best: bestCandidate(asCourse({ dates: s.dates }), free),
        }))
        .find(
          (x): x is { slot: Slot; best: Candidate } => x.best !== undefined,
        );
      if (moved) {
        options.push({
          title: `Woche verschieben: ${week(moved.slot.dates)}`,
          why: `In ${course.dates.length ? week(course.dates) : 'dieser Woche'} ist kein qualifizierter Ausbilder frei.`,
          effects: [
            `${name(moved.best)} übernimmt (Score ${moved.best.result.score})`,
            `Raum ${roomName(moved.slot.roomId)} am selben Standort`,
            'Modul bleibt im Zeitfenster',
          ],
          patch: {
            kind: 'move',
            locationId: course.locationId,
            dates: moved.slot.dates,
            roomId: moved.slot.roomId,
            instructorId: moved.best.instructor.id,
          },
        });
      }
    }
    const skills = requiredSkills(type, snapshot);
    const certificates = requiredCertificateTypes(type, snapshot);
    const instructors = [...snapshot.instructors.values()].sort((a, b) =>
      a.lastName.localeCompare(b.lastName),
    );
    for (const instructor of instructors) {
      if (options.length >= MAX_OPTIONS || certificates.length === 0) break;
      if (!instructor.languages.includes(course.language)) continue;
      if (!skills.every((s) => instructor.skillIds.includes(s))) continue;
      const result = checkInstructor(asCourse(), instructor, ctx);
      const expired = result.hard.filter(
        (h) =>
          h.label === 'Zertifikat' &&
          !h.ok &&
          /abgelaufen|läuft ab/.test(h.reason),
      );
      const otherFailures = result.hard.filter(
        (h) =>
          !h.ok &&
          h.label !== 'Zertifikat' &&
          h.label !== 'Gerätequalifikation',
      );
      if (expired.length === 0 || otherFailures.length > 0) continue;
      const who = `${instructor.firstName} ${instructor.lastName}`;
      const certs = expired
        .map((e) => e.reason.split(/ (abgelaufen|läuft ab)/)[0])
        .join(', ');
      options.push({
        title: `Zertifikat auffrischen: ${who}`,
        why: `${who} hat alle Skills und die Sprache, aber ${certs} ist nicht mehr gültig.`,
        effects: [
          `Auffrischung vor ${course.dates.length ? week(course.dates) : 'dem Kurs'} terminieren`,
          'Danach ist der Kurs regelkonform besetzbar',
          'Kein Standort- oder Sprachwechsel nötig',
        ],
        patch: null,
      });
    }
  }

  if (issue.kind === 'below_minimum') {
    options.push({
      title: 'Mit einer Gruppe an einem anderen Standort zusammenlegen',
      why: 'Die Gruppe erreicht die Mindestteilnehmerzahl des Kurstyps nicht.',
      effects: [
        'Lernende reisen an einen anderen Standort',
        'Kurs findet mit voller Gruppe statt',
        'Zuordnung Schule → Standort für diese Gruppe anpassen',
      ],
      patch: null,
    });
  }
  if (issue.kind === 'unassigned_apprentice') {
    options.push({
      title: 'Zusätzliche Durchführung anlegen',
      why: 'Die Kurse der Gruppe haben keine freien Plätze an Tagen, an denen diese Lernenden können.',
      effects: [
        'Weiteren Kurs für die Gruppe vorschlagen',
        'Oder Platz in einem bestehenden Kurs freigeben',
        'Fall erscheint bis dahin unter «Braucht eine Entscheidung»',
      ],
      patch: null,
    });
  }

  if (options.length === 0) {
    options.push({
      title: 'Kein automatischer Ausweg',
      why: 'Weder Standort, Woche, Sprache noch Geräte lösen den Konflikt im Rahmen der harten Regeln.',
      effects: [
        'Bedarf reduzieren oder Gruppe aufteilen',
        'Externen Ausbilder beauftragen',
        'Modul ins nächste Semester schieben',
      ],
      patch: null,
    });
  }
  return options.map((o, index) => ({ index, ...o }));
}
