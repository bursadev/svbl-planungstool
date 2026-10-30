import { BadRequestException } from '@nestjs/common';
import type { TabularSpec } from '../common/tabular-spec.js';
import {
  date,
  formatDate,
  normalizeKey,
  readOnly,
  ref,
  text,
} from '../common/tabular.js';
import { Location } from '../locations/location.entity.js';
import { Cohort } from './cohort.entity.js';
import { CurriculumModule } from './curriculum-module.entity.js';
import type { TimeWindowView } from './curriculum.service.js';
import {
  CreateTimeWindowDto,
  UpdateTimeWindowDto,
} from './dto/curriculum.dto.js';
import { TimeWindow } from './time-window.entity.js';

/**
 * CSV columns, import and bulk delete of `/time-windows`. The key is module
 * (course type code) + cohort (label) + Standort (code; empty = all
 * Standorte). Time windows cannot be archived, only deleted.
 */
export const TIME_WINDOWS_TABULAR: TabularSpec<TimeWindow> = {
  entity: TimeWindow,
  entityType: 'time_window',
  noun: 'Zeitfenster',
  fileName: 'zeitfenster',
  // In bulk deletes the relations are not loaded; then the period has to do.
  label: (w) => {
    const period =
      w.startsOn && w.endsOn
        ? `${formatDate(w.startsOn)} – ${formatDate(w.endsOn)}`
        : '';
    const code = w.curriculumModule?.courseType?.code;
    return code
      ? `${code} (${w.cohort?.label ?? ''})${period ? ` ${period}` : ''}`
      : period;
  },
  columns: [
    ref('Modul', 'curriculumModuleId', 'module', {
      required: true,
      get: (w: TimeWindowView) => w.curriculumModule?.courseType.code,
      examples: ['UK-EFZ-1', 'UK-EFZ-2'],
    }),
    ref('Jahrgang', 'cohortId', 'cohort', {
      required: true,
      get: (w: TimeWindowView) => w.cohort?.label,
      examples: ['EFZ 2026', 'EFZ 2026'],
    }),
    ref('Standort', 'locationId', 'location', {
      get: (w: TimeWindowView) => w.location?.code,
      examples: ['', 'RUP'],
    }),
    date('Von', 'startsOn', {
      required: true,
      examples: ['07.09.2026', '02.11.2026'],
    }),
    date('Bis', 'endsOn', {
      required: true,
      examples: ['18.12.2026', '29.01.2027'],
    }),
    text('Notiz', 'note', { nullable: true, examples: ['', 'Nur Rupperswil'] }),
    readOnly(
      'Modulname',
      (w: TimeWindowView) => w.curriculumModule?.courseType.name,
    ),
  ],
  import: {
    createDto: CreateTimeWindowDto,
    updateDto: UpdateTimeWindowDto,
    keyHeaders: ['Modul', 'Jahrgang', 'Standort'],
    key: (values) =>
      typeof values.curriculumModuleId === 'string' &&
      typeof values.cohortId === 'string'
        ? windowKey(
            values.curriculumModuleId,
            values.cohortId,
            values.locationId as string | null | undefined,
          )
        : null,
    entityKey: (w) => windowKey(w.curriculumModuleId, w.cohortId, w.locationId),
    lookups: {
      module: async (manager) => {
        const modules = await manager.find(CurriculumModule, {
          relations: { courseType: true },
        });
        return new Map(
          modules.map((m) => [normalizeKey(m.courseType.code), m.id]),
        );
      },
      cohort: async (manager) => {
        const cohorts = await manager.find(Cohort);
        return new Map(cohorts.map((c) => [normalizeKey(c.label), c.id]));
      },
      location: async (manager) => {
        const locations = await manager.find(Location);
        return new Map(locations.map((l) => [normalizeKey(l.code), l.id]));
      },
    },
    loadExisting: (manager) =>
      manager.find(TimeWindow, {
        relations: { curriculumModule: { courseType: true }, cohort: true },
      }),
    currentValues: (w) => ({
      curriculumModuleId: w.curriculumModuleId,
      cohortId: w.cohortId,
      locationId: w.locationId,
      startsOn: w.startsOn,
      endsOn: w.endsOn,
      note: w.note,
    }),
    // Same check as the table's `starts_on <= ends_on`, so the dry run reports it per line.
    validateRow: ({ startsOn, endsOn }) =>
      typeof startsOn === 'string' &&
      typeof endsOn === 'string' &&
      startsOn > endsOn
        ? [{ column: 'Bis', message: 'Das Enddatum liegt vor dem Startdatum.' }]
        : [],
    /**
     * Module and cohort have to belong to the same Lehrgang, like in
     * POST /time-windows. The import has no per-row hook for a check that
     * needs the database, so a mismatch rolls the whole import back here.
     */
    async afterSave(manager, rows) {
      const mismatches: { code: string; label: string }[] = await manager.query(
        `SELECT ct.code, c.label
           FROM time_window w
           JOIN curriculum_module m ON m.id = w.curriculum_module_id
           JOIN course_type ct ON ct.id = m.course_type_id
           JOIN cohort c ON c.id = w.cohort_id
          WHERE w.id = ANY($1) AND m.track <> c.track
          ORDER BY ct.code
          LIMIT 5`,
        [rows.map((r) => r.entity.id)],
      );
      if (mismatches.length) {
        throw new BadRequestException(
          `Modul und Jahrgang gehören nicht zum selben Lehrgang: ${mismatches
            .map((m) => `«${m.code}» / «${m.label}»`)
            .join(', ')}.`,
        );
      }
    },
  },
};

function windowKey(
  moduleId: string,
  cohortId: string,
  locationId: string | null | undefined,
): string {
  return `${moduleId}|${cohortId}|${locationId ?? ''}`;
}
