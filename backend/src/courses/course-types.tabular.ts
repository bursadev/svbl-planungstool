import type { EntityManager } from 'typeorm';
import {
  COURSE_KIND_LABELS,
  LANGUAGE_LABELS,
  TRACK_LABELS,
  WEEKDAY_RULE_LABELS,
} from '../common/labels.js';
import type { RowValues, TabularSpec } from '../common/tabular-spec.js';
import {
  bool,
  enumList,
  enumOf,
  int,
  normalizeKey,
  readOnly,
  refList,
  text,
} from '../common/tabular.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { CourseTypeCertificate } from './course-type-certificate.entity.js';
import { CourseTypeSkill } from './course-type-skill.entity.js';
import { CourseType } from './course-type.entity.js';
import type { CourseTypeView } from './course-types.service.js';
import {
  ImportCourseTypeDto,
  ImportUpdateCourseTypeDto,
} from './dto/course-type.dto.js';

/** `code → id` (or `name → id`) of a whole table, keys normalized. */
async function lookupBy<T extends { id: string }>(
  manager: EntityManager,
  entity: new () => T,
  key: (row: T) => string,
): Promise<Map<string, string>> {
  const rows = await manager.find(entity);
  return new Map(rows.map((row) => [normalizeKey(key(row)), row.id]));
}

/**
 * CSV columns, import and bulk actions of `/course-types`; the key is the
 * code. Skills (by name) and certificate types (by code) are imported into
 * the requirement link tables; the device requirements are only exported.
 */
export const COURSE_TYPES_TABULAR: TabularSpec<CourseType> = {
  entity: CourseType,
  entityType: 'course_type',
  noun: 'Kurstyp',
  fileName: 'kurstypen',
  label: (t) => (t.name ? `${t.code} ${t.name}` : t.code),
  columns: [
    text('Code', 'code', {
      required: true,
      examples: ['UK-EFZ-1', 'SUVA-STA'],
    }),
    text('Name', 'name', {
      required: true,
      examples: ['ÜK 1 Grundlagen Logistik', 'Staplerausbildung SUVA'],
    }),
    enumOf('Art', 'kind', COURSE_KIND_LABELS, {
      required: true,
      examples: ['ÜK', 'Erwachsene'],
    }),
    enumOf('Lehrgang', 'track', TRACK_LABELS, {
      nullable: true,
      examples: ['EFZ', ''],
    }),
    int('Dauer (Tage)', 'durationDays', {
      required: true,
      examples: ['3', '2'],
    }),
    bool('Wochenübergreifend', 'maySpanWeeks', { examples: ['nein', 'ja'] }),
    enumOf('Wochentagsregel', 'weekdayRule', WEEKDAY_RULE_LABELS, {
      examples: ['Wochentage', 'Samstag'],
    }),
    enumList('Sprachen', 'languages', LANGUAGE_LABELS, {
      required: true,
      examples: ['Deutsch, Französisch', 'Deutsch'],
    }),
    int('Min. Teilnehmende', 'minParticipants', {
      nullable: true,
      examples: ['8', ''],
    }),
    int('Max. Teilnehmende', 'maxParticipants', {
      required: true,
      examples: ['16', '6'],
    }),
    text('Beschreibung', 'description', {
      nullable: true,
      examples: ['Einführung in Lager und Warenfluss', ''],
    }),
    bool('Veröffentlicht', 'published', { examples: ['ja', 'nein'] }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
    refList('Skills', 'skillIds', 'skill', {
      nullable: true,
      get: (t: CourseTypeView) => t.requiredSkills?.map((s) => s.name),
      examples: ['Lagerlogistik', 'Stapler'],
    }),
    refList('Zertifikatstypen', 'certificateTypeIds', 'certificateType', {
      nullable: true,
      get: (t: CourseTypeView) => t.requiredCertificates?.map((c) => c.code),
      examples: ['', 'SUVA-STA'],
    }),
    readOnly('Geräte', (t: CourseTypeView) =>
      (t.requiredDevices ?? [])
        .map((d) => `${d.deviceType.code}×${d.quantity}`)
        .join(', '),
    ),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (t) => !t.active,
  },
  import: {
    createDto: ImportCourseTypeDto,
    updateDto: ImportUpdateCourseTypeDto,
    keyHeaders: ['Code'],
    key: (values) =>
      typeof values.code === 'string' && values.code
        ? normalizeKey(values.code)
        : null,
    entityKey: (t) => normalizeKey(t.code),
    lookups: {
      skill: (manager) => lookupBy(manager, Skill, (s) => s.name),
      certificateType: (manager) =>
        lookupBy(manager, CertificateType, (c) => c.code),
    },
    loadExisting: (manager) =>
      manager.find(CourseType, {
        relations: { requiredSkills: true, requiredCertificates: true },
      }),
    // An empty requirement cell exports as empty and imports as null: compare null with null.
    currentValues: (t): RowValues => {
      const skillIds = (t.requiredSkills ?? []).map((s) => s.skillId);
      const certificateTypeIds = (t.requiredCertificates ?? []).map(
        (c) => c.certificateTypeId,
      );
      return Object.assign({}, t, {
        skillIds: skillIds.length ? skillIds : null,
        certificateTypeIds: certificateTypeIds.length
          ? certificateTypeIds
          : null,
      }) as unknown as RowValues;
    },
    virtualFields: ['skillIds', 'certificateTypeIds'],
    // Same rule as the dialogs (and the service), checked against the merged row.
    validateRow: ({ minParticipants, maxParticipants }) =>
      typeof minParticipants === 'number' &&
      typeof maxParticipants === 'number' &&
      minParticipants > maxParticipants
        ? [
            {
              column: 'Min. Teilnehmende',
              message: 'Die Mindestteilnehmerzahl liegt über dem Maximum.',
            },
          ]
        : [],
    // Like PUT /course-types/:id/requirements, but only for the columns in the file, and the
    // device requirements are left alone.
    async afterSave(manager, rows) {
      for (const { entity, values } of rows) {
        if ('skillIds' in values) {
          await manager.delete(CourseTypeSkill, { courseTypeId: entity.id });
          const ids = (values.skillIds as string[] | null) ?? [];
          if (ids.length) {
            await manager.insert(
              CourseTypeSkill,
              ids.map((skillId) => ({ courseTypeId: entity.id, skillId })),
            );
          }
        }
        if ('certificateTypeIds' in values) {
          await manager.delete(CourseTypeCertificate, {
            courseTypeId: entity.id,
          });
          const ids = (values.certificateTypeIds as string[] | null) ?? [];
          if (ids.length) {
            await manager.insert(
              CourseTypeCertificate,
              ids.map((certificateTypeId) => ({
                courseTypeId: entity.id,
                certificateTypeId,
              })),
            );
          }
        }
      }
    },
  },
};
