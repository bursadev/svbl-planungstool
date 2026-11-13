import { Track } from '../../database/enums.js';
import { cohortSemester } from './calendar.js';
import type {
  IsoDate,
  PlanningSnapshot,
  ReadinessItem,
  ReadinessReport,
  SnapshotCohort,
  SnapshotModule,
} from './types.js';

/** Specialisation variants (.D Distribution, .L Lager) and electives (5.HAB/5.Kran, 6.R3/6.R4). */
export const VARIANT_MODULE_RE = /\.(D|L)\b|5\.HAB|5\.Kran|6\.R[34]/;

/** A module the demand cannot plan yet: it needs a school → variant mapping that does not exist. */
export function isVariantModule(code: string): boolean {
  return VARIANT_MODULE_RE.test(code);
}

export interface Period {
  startsOn: IsoDate;
  endsOn: IsoDate;
}

export interface CohortInPeriod {
  cohort: SnapshotCohort;
  semester: number;
  /** Active apprentices of the cohort. */
  members: number;
}

export interface ModuleInPeriod {
  module: SnapshotModule;
  cohort: SnapshotCohort;
}

/** The cohorts with active apprentices that are in training during the period, and the modules of their semester. */
export function periodScope(
  snapshot: PlanningSnapshot,
  period: Period,
): { cohorts: CohortInPeriod[]; modules: ModuleInPeriod[] } {
  const members = new Map<string, number>();
  for (const a of snapshot.apprentices.values()) {
    members.set(a.cohortId, (members.get(a.cohortId) ?? 0) + 1);
  }
  const cohorts: CohortInPeriod[] = [];
  for (const cohort of [...snapshot.cohorts.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  )) {
    const semester = cohortSemester(cohort, period.startsOn);
    const n = members.get(cohort.id) ?? 0;
    if (semester !== null && n > 0)
      cohorts.push({ cohort, semester, members: n });
  }
  const modules: ModuleInPeriod[] = [];
  for (const { cohort, semester } of cohorts) {
    for (const module of [...snapshot.modules.values()].sort(
      (a, b) => a.sequence - b.sequence,
    )) {
      if (
        module.active &&
        module.track === cohort.track &&
        module.semester === semester
      ) {
        modules.push({ module, cohort });
      }
    }
  }
  return { cohorts, modules };
}

const TRACK_SEMESTERS: Record<Track, number> = {
  [Track.Efz]: 6,
  [Track.Eba]: 4,
};

/**
 * Step 0 of a planning run: which inputs are missing per rule, so a rule
 * without data is shown as skipped, never as passed. Stored on the run.
 */
export function checkReadiness(
  snapshot: PlanningSnapshot,
  period: Period,
): ReadinessReport {
  const { cohorts, modules } = periodScope(snapshot, period);
  const codeOf = (m: SnapshotModule) =>
    snapshot.courseTypes.get(m.courseTypeId)?.code ?? m.courseTypeId;
  const items: ReadinessItem[] = [];

  const plannable = modules.filter(
    ({ module }) => !isVariantModule(codeOf(module)),
  );
  const withoutWindow = plannable.filter(
    ({ module, cohort }) =>
      !snapshot.timeWindows.some(
        (w) => w.curriculumModuleId === module.id && w.cohortId === cohort.id,
      ),
  );
  items.push(
    withoutWindow.length
      ? {
          rule: 'time_windows',
          status: 'warning',
          count: withoutWindow.length,
          message: `${withoutWindow.length} Module ohne Zeitfenster – der Lauf verwendet die Periode als Fenster`,
          details: withoutWindow.map(
            ({ module, cohort }) => `${codeOf(module)} · ${cohort.label}`,
          ),
        }
      : {
          rule: 'time_windows',
          status: 'ok',
          count: 0,
          message: 'Alle Module der Periode haben ein Zeitfenster',
        },
  );

  const links = [...snapshot.modules.values()].reduce(
    (n, m) => n + m.prerequisiteModuleIds.length,
    0,
  );
  items.push(
    links === 0
      ? {
          rule: 'prerequisites',
          status: 'skipped',
          count: 0,
          message:
            'Keine Modul-Voraussetzungen erfasst – Reihenfolge wird nicht geprüft',
        }
      : {
          rule: 'prerequisites',
          status: 'ok',
          count: links,
          message: `${links} Modul-Voraussetzungen erfasst`,
        },
  );

  const cohortIds = new Set(cohorts.map((c) => c.cohort.id));
  const inScope = [...snapshot.apprentices.values()].filter((a) =>
    cohortIds.has(a.cohortId),
  );
  const withoutSchoolDays = inScope.filter((a) => {
    const cls = a.schoolClassId
      ? snapshot.classes.get(a.schoolClassId)
      : undefined;
    return !cls || cls.blockedWeekdays.length === 0;
  }).length;
  items.push(
    withoutSchoolDays
      ? {
          rule: 'school_days',
          status: 'warning',
          count: withoutSchoolDays,
          message: `${withoutSchoolDays} Lernende ohne bekannte Schultage – ÜK-Tage können auf Schultage fallen`,
        }
      : {
          rule: 'school_days',
          status: 'ok',
          count: 0,
          message: 'Alle Lernenden der Periode haben Schultage',
        },
  );

  const variants = [
    ...new Set(
      modules.map(({ module }) => codeOf(module)).filter(isVariantModule),
    ),
  ];
  items.push(
    variants.length
      ? {
          rule: 'variants',
          status: 'warning',
          count: variants.length,
          message: `${variants.length} Varianten- und Wahlmodule werden nicht geplant (Zuordnung Schule → Variante fehlt)`,
          details: variants,
        }
      : {
          rule: 'variants',
          status: 'ok',
          count: 0,
          message: 'Keine Varianten- oder Wahlmodule in der Periode',
        },
  );

  const anomalies = [...snapshot.modules.values()].filter(
    (m) => m.active && m.semester > TRACK_SEMESTERS[m.track],
  );
  items.push(
    anomalies.length
      ? {
          rule: 'semesters',
          status: 'warning',
          count: anomalies.length,
          message: `${anomalies.length} Module liegen ausserhalb der Semester ihres Lehrgangs`,
          details: anomalies.map(
            (m) => `${codeOf(m)} · Semester ${m.semester}`,
          ),
        }
      : {
          rule: 'semesters',
          status: 'ok',
          count: 0,
          message: 'Alle Module liegen innerhalb ihres Lehrgangs',
        },
  );

  const typeIds = [
    ...new Set(modules.map(({ module }) => module.courseTypeId)),
  ];
  const withoutRequirements = typeIds.filter((id) => {
    const t = snapshot.courseTypes.get(id);
    return (
      !t ||
      (t.requiredSkillIds.length === 0 &&
        t.requiredCertificateTypeIds.length === 0)
    );
  }).length;
  items.push(
    withoutRequirements === 0
      ? {
          rule: 'requirements',
          status: 'ok',
          count: 0,
          message: `Skills und Zertifikate: alle ${typeIds.length} Kurstypen haben Anforderungen`,
        }
      : {
          rule: 'requirements',
          status:
            withoutRequirements === typeIds.length ? 'skipped' : 'warning',
          count: withoutRequirements,
          message: `Skills und Zertifikate: ${withoutRequirements} von ${typeIds.length} Kurstypen ohne Anforderungen – Regel prüft nur Sprache und Verfügbarkeit`,
        },
  );

  items.push(
    snapshot.devices.size === 0
      ? {
          rule: 'devices',
          status: 'skipped',
          count: 0,
          message: 'Keine Geräte erfasst – Gerätebestand wird nicht geprüft',
        }
      : {
          rule: 'devices',
          status: 'ok',
          count: snapshot.devices.size,
          message: `${snapshot.devices.size} Geräte erfasst`,
        },
  );

  const absences = snapshot.availabilities.filter(
    (a) => a.startsOn <= period.endsOn && a.endsOn >= period.startsOn,
  ).length;
  items.push(
    absences === 0
      ? {
          rule: 'availability',
          status: 'skipped',
          count: 0,
          message:
            'Keine Abwesenheiten im Zeitraum erfasst – Verfügbarkeit prüft nur bestehende Einsätze',
        }
      : {
          rule: 'availability',
          status: 'ok',
          count: absences,
          message: `${absences} Abwesenheiten im Zeitraum`,
        },
  );

  const schoolIds = new Set(inScope.map((a) => a.schoolId));
  const badSchools = [...schoolIds]
    .map((id) => snapshot.schools.get(id))
    .filter((s) => s && !snapshot.locations.get(s.nearestLocationId)?.hostsUk)
    .map((s) => s!.name)
    .sort();
  items.push(
    badSchools.length
      ? {
          rule: 'uk_locations',
          status: 'warning',
          count: badSchools.length,
          message: `${badSchools.length} Berufsschulen sind einem Standort ohne ÜK zugeordnet`,
          details: badSchools,
        }
      : {
          rule: 'uk_locations',
          status: 'ok',
          count: 0,
          message: 'Jede Berufsschule hat einen ÜK-Standort',
        },
  );

  items.push({
    rule: 'holidays',
    status: 'ok',
    count: 0,
    message: 'Nationale Feiertage werden ausgespart; Schulferien nicht',
  });

  return { checkedAt: new Date().toISOString(), items };
}
