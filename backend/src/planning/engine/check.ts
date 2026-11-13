import type { AssignmentCheckResult } from '../../courses/assignment.entity.js';
import {
  AssignmentStatus,
  AvailabilityKind,
  AvailabilityStatus,
  CourseStatus,
  EmploymentType,
  InstructorStatus,
  Language,
} from '../../database/enums.js';
import { formatDate, isoWeek } from './calendar.js';
import type { Ledger } from './ledger.js';
import { maintenanceStatus } from './maintenance.js';
import type {
  IsoDate,
  PlanningSnapshot,
  SnapshotCourseType,
  SnapshotInstructor,
} from './types.js';

/** What every engine function gets: the world, the bookings and «today». */
export interface EngineContext {
  snapshot: PlanningSnapshot;
  ledger: Ledger;
  today: IsoDate;
}

/** A course (existing or proposed) as the staffing rules see it. */
export interface CourseToStaff {
  id: string;
  courseTypeId: string;
  locationId: string;
  language: Language;
  cohortId: string | null;
  dates: IsoDate[];
  /** Instructors already on the course; the avoid-pairing rule looks at them. */
  coInstructorIds?: string[];
}

export interface Candidate {
  instructor: SnapshotInstructor;
  result: AssignmentCheckResult;
}

const LANGUAGE_NAMES: Record<Language, string> = {
  [Language.De]: 'Deutsch',
  [Language.Fr]: 'Französisch',
  [Language.It]: 'Italienisch',
};

const KIND_LABELS: Record<AvailabilityKind, string> = {
  [AvailabilityKind.Vacation]: 'Ferien',
  [AvailabilityKind.Training]: 'Weiterbildung',
  [AvailabilityKind.Sick]: 'Krankheit',
  [AvailabilityKind.Blocked]: 'Sperre',
  [AvailabilityKind.Available]: 'Verfügbarkeit',
};

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.Approved]: 'genehmigt',
  [AvailabilityStatus.Requested]: 'beantragt',
  [AvailabilityStatus.Rejected]: 'abgelehnt',
};

const ACTIVE = new Set([AssignmentStatus.Confirmed, AssignmentStatus.Proposed]);

/** «+30» / «−10» with the typographic minus, as the prototype prints it. */
function signed(delta: number): string {
  return delta < 0 ? `−${-delta}` : `+${delta}`;
}

function fullName(
  i: Pick<SnapshotInstructor, 'firstName' | 'lastName'>,
): string {
  return `${i.firstName} ${i.lastName}`;
}

/** Required certificate types: the course type's own plus those that qualify for its devices. */
export function requiredCertificateTypes(
  type: SnapshotCourseType,
  snapshot: PlanningSnapshot,
): string[] {
  const deviceTypeIds = new Set(
    type.requiredDevices.map((d) => d.deviceTypeId),
  );
  const fromDevices = snapshot.deviceQualifications
    .filter((q) => deviceTypeIds.has(q.deviceTypeId) && q.certificateTypeId)
    .map((q) => q.certificateTypeId as string);
  return [...new Set([...type.requiredCertificateTypeIds, ...fromDevices])];
}

/** Required skills: the course type's own plus those that qualify for its devices. */
export function requiredSkills(
  type: SnapshotCourseType,
  snapshot: PlanningSnapshot,
): string[] {
  const deviceTypeIds = new Set(
    type.requiredDevices.map((d) => d.deviceTypeId),
  );
  const fromDevices = snapshot.deviceQualifications
    .filter((q) => deviceTypeIds.has(q.deviceTypeId) && q.skillId)
    .map((q) => q.skillId as string);
  return [...new Set([...type.requiredSkillIds, ...fromDevices])];
}

/**
 * The date-independent part of the hard rules: active, speaks the language,
 * holds every skill and every required certificate type (validity is checked
 * per course day by `checkInstructor`). Used to pre-filter the candidate pool.
 */
export function staticallyEligible(
  type: SnapshotCourseType,
  language: Language,
  instructor: SnapshotInstructor,
  snapshot: PlanningSnapshot,
): boolean {
  if (instructor.status !== InstructorStatus.Active) return false;
  if (!instructor.languages.includes(language)) return false;
  const skills = new Set(instructor.skillIds);
  if (!requiredSkills(type, snapshot).every((s) => skills.has(s))) return false;
  const held = new Set(instructor.certificates.map((c) => c.certificateTypeId));
  return requiredCertificateTypes(type, snapshot).every((ct) => held.has(ct));
}

/**
 * The handoff's `check(course, instructor, ledger)`: hard rules block, soft
 * rules score from `weights.base`, every row carries a German reason.
 */
export function checkInstructor(
  course: CourseToStaff,
  instructor: SnapshotInstructor,
  ctx: EngineContext,
): AssignmentCheckResult {
  const { snapshot, ledger, today } = ctx;
  const w = snapshot.weights;
  if (course.dates.length === 0) {
    return {
      ok: false,
      hard: [
        { label: 'Termine', ok: false, reason: 'Kurs hat keine Kurstage' },
      ],
      soft: [],
      score: 0,
    };
  }
  const type = snapshot.courseTypes.get(course.courseTypeId);
  if (!type) {
    return {
      ok: false,
      hard: [{ label: 'Kurstyp', ok: false, reason: 'Kurstyp unbekannt' }],
      soft: [],
      score: 0,
    };
  }
  const dates = [...course.dates].sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const hard: AssignmentCheckResult['hard'] = [];
  const soft: AssignmentCheckResult['soft'] = [];
  let score = w.base;
  const add = (delta: number, text: string) => {
    score += delta;
    soft.push({ text: `${text} (${signed(delta)})`, delta });
  };

  // 1. Status
  const active = instructor.status === InstructorStatus.Active;
  hard.push({
    label: 'Status',
    ok: active,
    reason: active ? 'aktiv' : 'inaktiv',
  });

  // 2. Skills
  const skills = requiredSkills(type, snapshot);
  const missing = skills.filter((s) => !instructor.skillIds.includes(s));
  hard.push({
    label: 'Skills',
    ok: missing.length === 0,
    reason: missing.length
      ? `fehlt: ${missing.join(', ')}`
      : skills.length
        ? skills.join(', ')
        : 'keine Skills gefordert',
  });

  // 3. Certificates, valid on every course day
  const certificateOk = new Map<string, boolean>();
  for (const certificateTypeId of requiredCertificateTypes(type, snapshot)) {
    const name =
      snapshot.certificateTypes.get(certificateTypeId)?.name ??
      certificateTypeId;
    const held = instructor.certificates.filter(
      (c) => c.certificateTypeId === certificateTypeId,
    );
    if (held.length === 0) {
      hard.push({
        label: 'Zertifikat',
        ok: false,
        reason: `${name} nicht vorhanden`,
      });
      certificateOk.set(certificateTypeId, false);
      continue;
    }
    const best = held.reduce((a, b) =>
      a.validUntil === null
        ? a
        : b.validUntil === null
          ? b
          : a.validUntil >= b.validUntil
            ? a
            : b,
    );
    if (best.validUntil === null || best.validUntil >= last) {
      hard.push({
        label: 'Zertifikat',
        ok: true,
        reason:
          best.validUntil === null
            ? `${name} gültig (unbefristet)`
            : `${name} gültig bis ${formatDate(best.validUntil)}`,
      });
      certificateOk.set(certificateTypeId, true);
    } else {
      const until = best.validUntil;
      const firstUncovered = dates.find((d) => d > until) ?? first;
      const verb = until < today ? 'abgelaufen am' : 'läuft ab am';
      hard.push({
        label: 'Zertifikat',
        ok: false,
        reason: `${name} ${verb} ${formatDate(until)} – Kurstag ${formatDate(firstUncovered, { year: false })} nicht gedeckt`,
      });
      certificateOk.set(certificateTypeId, false);
    }
  }

  // 4. Device qualification
  if (type.requiredDevices.length) {
    const unqualified: string[] = [];
    const names: string[] = [];
    for (const { deviceTypeId } of type.requiredDevices) {
      const name = snapshot.deviceTypes.get(deviceTypeId)?.name ?? deviceTypeId;
      names.push(name);
      const qualifications = snapshot.deviceQualifications.filter(
        (q) => q.deviceTypeId === deviceTypeId,
      );
      if (qualifications.length === 0) continue; // no rule configured for this device type
      const qualified = qualifications.some((q) =>
        q.certificateTypeId
          ? certificateOk.get(q.certificateTypeId) === true
          : q.skillId !== null && instructor.skillIds.includes(q.skillId),
      );
      if (!qualified) unqualified.push(name);
    }
    hard.push({
      label: 'Gerätequalifikation',
      ok: unqualified.length === 0,
      reason: unqualified.length
        ? `nicht qualifiziert für ${unqualified.join(', ')}`
        : names.join(', '),
    });
  }

  // 5. Language
  const speaks = instructor.languages.includes(course.language);
  hard.push({
    label: 'Sprache',
    ok: speaks,
    reason: speaks
      ? `spricht ${LANGUAGE_NAMES[course.language]}`
      : `spricht kein ${LANGUAGE_NAMES[course.language]} (${instructor.languages.join('/')})`,
  });

  // 6. Availability on every course day
  const clashDate = dates.find((d) => {
    const busy = ledger.instructorBusyOn(instructor.id, d);
    return busy !== null && busy !== course.id;
  });
  const absences = snapshot.availabilities.filter(
    (a) =>
      a.instructorId === instructor.id &&
      a.kind !== AvailabilityKind.Available &&
      a.status !== AvailabilityStatus.Rejected &&
      a.startsOn <= last &&
      a.endsOn >= first,
  );
  const blocking = absences.find(
    (a) => a.status === AvailabilityStatus.Approved,
  );
  const requested = absences.find(
    (a) =>
      a.status === AvailabilityStatus.Requested &&
      a.kind === AvailabilityKind.Vacation,
  );
  if (clashDate) {
    const busyId = ledger.instructorBusyOn(instructor.id, clashDate) as string;
    const other = snapshot.courses.get(busyId);
    const code = other
      ? (snapshot.courseTypes.get(other.courseTypeId)?.code ??
        other.courseTypeId)
      : busyId;
    const where = other
      ? snapshot.locations.get(other.locationId)?.name
      : undefined;
    hard.push({
      label: 'Verfügbarkeit',
      ok: false,
      reason: `bereits eingesetzt: ${code}${where ? ` ${where}` : ''} KW ${isoWeek(clashDate).week}`,
    });
  } else if (blocking) {
    hard.push({
      label: 'Verfügbarkeit',
      ok: false,
      reason: `${KIND_LABELS[blocking.kind]} ${formatDate(blocking.startsOn, { year: false })}–${formatDate(blocking.endsOn)} (${STATUS_LABELS[blocking.status]})`,
    });
  } else {
    const week = requested ? isoWeek(requested.startsOn).week : null;
    hard.push({
      label: 'Verfügbarkeit',
      ok: true,
      reason:
        week === null
          ? 'frei an allen Kurstagen'
          : `frei – offener Ferienantrag KW ${week}`,
    });
    if (week !== null)
      add(w.openVacationRequest, `Offener Ferienantrag KW ${week}`);
  }

  // Soft: location
  const home = snapshot.locations.get(instructor.homeLocationId);
  const here = snapshot.locations.get(course.locationId);
  if (instructor.homeLocationId === course.locationId) {
    add(w.homeLocation, `Heimstandort ${here?.name ?? course.locationId}`);
  } else if (home && here && home.languageRegion === here.languageRegion) {
    add(
      w.sameRegion,
      `Gleiche Sprachregion, Reise ${home.name} → ${here.name}`,
    );
  } else {
    add(
      w.otherRegion,
      `Andere Region, lange Reise ${home?.name ?? '?'} → ${here?.name ?? '?'}`,
    );
  }
  if (instructor.preferredLocationIds.includes(course.locationId)) {
    add(w.preferredLocation, 'Bevorzugter Standort laut Präferenzen');
  }

  // Soft: continuity with the cohort
  if (course.cohortId) {
    const knows = [...snapshot.courses.values()].some(
      (c) =>
        c.id !== course.id &&
        c.cohortId === course.cohortId &&
        c.status !== CourseStatus.Cancelled &&
        c.assignments.some(
          (a) => a.instructorId === instructor.id && ACTIVE.has(a.status),
        ),
    );
    if (knows) {
      const label =
        snapshot.cohorts.get(course.cohortId)?.label ?? course.cohortId;
      add(w.cohortContinuity, `Kontinuität: kennt Jahrgang ${label}`);
    }
  }

  // Soft: qualification maintenance
  const year = Number(first.slice(0, 4));
  const rule = maintenanceStatus(instructor, year, ctx).find((m) =>
    m.courseTypeIds.includes(course.courseTypeId),
  );
  if (rule && rule.open > 0) {
    add(
      w.maintenanceOpen,
      `Qualifikationspflege: braucht noch ${rule.open} Kurs${rule.open > 1 ? 'e' : ''} dieses Typs in ${year}`,
    );
  }

  // Soft: employment
  if (instructor.employmentType === EmploymentType.Employee) {
    add(w.employee, 'Festangestellt, keine Zusatzkosten');
  } else {
    soft.push({ text: 'Freelancer, Honorar fällt an (±0)', delta: 0 });
  }

  // Soft: pairings to avoid
  for (const coId of course.coInstructorIds ?? []) {
    if (coId === instructor.id) continue;
    const co = snapshot.instructors.get(coId);
    if (
      instructor.avoidInstructorIds.includes(coId) ||
      co?.avoidInstructorIds.includes(instructor.id)
    ) {
      add(
        w.avoidPairing,
        `Soll nicht mit ${co ? fullName(co) : coId} eingesetzt werden`,
      );
    }
  }

  return {
    ok: hard.every((h) => h.ok),
    hard,
    soft,
    score: Math.max(0, Math.min(100, score)),
  };
}

/**
 * Every instructor checked against the course: feasible ones first by score,
 * then (with `includeInfeasible`) the rest by score; ties by name, then id.
 */
export function rankCandidates(
  course: CourseToStaff,
  ctx: EngineContext,
  opts: { limit?: number; includeInfeasible?: boolean } = {},
): Candidate[] {
  const type = ctx.snapshot.courseTypes.get(course.courseTypeId);
  const candidates: Candidate[] = [];
  for (const instructor of ctx.snapshot.instructors.values()) {
    if (
      !opts.includeInfeasible &&
      (!type ||
        !staticallyEligible(type, course.language, instructor, ctx.snapshot))
    ) {
      continue;
    }
    const result = checkInstructor(course, instructor, ctx);
    if (result.ok || opts.includeInfeasible)
      candidates.push({ instructor, result });
  }
  candidates.sort(
    (a, b) =>
      Number(b.result.ok) - Number(a.result.ok) ||
      b.result.score - a.result.score ||
      a.instructor.lastName.localeCompare(b.instructor.lastName, 'de-CH') ||
      a.instructor.firstName.localeCompare(b.instructor.firstName, 'de-CH') ||
      a.instructor.id.localeCompare(b.instructor.id),
  );
  return opts.limit === undefined
    ? candidates
    : candidates.slice(0, opts.limit);
}
