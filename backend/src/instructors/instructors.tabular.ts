import type { EntityManager } from 'typeorm';
import { InstructorStatus } from '../database/enums.js';
import {
  EMPLOYMENT_TYPE_LABELS,
  INSTRUCTOR_STATUS_LABELS,
  LANGUAGE_LABELS,
} from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import {
  enumList,
  enumOf,
  int,
  normalizeKey,
  number,
  ref,
  refList,
  text,
} from '../common/tabular.js';
import { Location } from '../locations/location.entity.js';
import {
  ImportInstructorDto,
  UpdateImportInstructorDto,
} from './dto/instructor.dto.js';
import { InstructorSkill } from './instructor-skill.entity.js';
import { Instructor } from './instructor.entity.js';
import {
  fullName,
  instructorColumns,
  type InstructorRow,
} from './instructors.service.js';
import { Skill } from './skill.entity.js';

/** Natural key of an import row or record: the e-mail, else the external ref. */
function instructorKey(email: unknown, externalRef: unknown): string | null {
  if (typeof email === 'string' && email.trim()) {
    return `email:${normalizeKey(email)}`;
  }
  if (typeof externalRef === 'string' && externalRef.trim()) {
    return `ref:${normalizeKey(externalRef)}`;
  }
  return null;
}

const decimal = (v: string | null): number | null =>
  v === null ? null : Number(v);

/**
 * CSV columns, import and bulk actions of `/instructors`. The key is the
 * e-mail, else the external ref; the home location is referenced by its code
 * and the skills by name. Archived means `status = inactive`.
 */
export const INSTRUCTORS_TABULAR: TabularSpec<Instructor> = {
  entity: Instructor,
  entityType: 'instructor',
  noun: 'Ausbilder',
  fileName: 'ausbilder',
  label: (i) => fullName(i),
  columns: [
    text('Vorname', 'firstName', {
      required: true,
      examples: ['Sandra', 'Luc'],
    }),
    text('Nachname', 'lastName', {
      required: true,
      examples: ['Meier', 'Bovet'],
    }),
    text('E-Mail', 'email', {
      nullable: true,
      examples: ['sandra.meier@svbl.ch', 'luc.bovet@svbl.ch'],
    }),
    text('Telefon', 'phone', {
      nullable: true,
      examples: ['+41 79 123 45 67', '+41 78 765 43 21'],
    }),
    enumOf('Anstellung', 'employmentType', EMPLOYMENT_TYPE_LABELS, {
      required: true,
      examples: ['Angestellt', 'Freelancer'],
    }),
    ref('Heimstandort', 'homeLocationId', 'location', {
      required: true,
      get: (r: InstructorRow) => r.homeLocation?.code,
      examples: ['RUP', 'MAR'],
    }),
    enumList('Sprachen', 'languages', LANGUAGE_LABELS, {
      required: true,
      examples: ['Deutsch', 'Französisch, Deutsch'],
    }),
    refList('Skills', 'skillIds', 'skill', {
      nullable: true,
      get: (r: InstructorRow) => r.skills?.map((s) => s.name),
      examples: ['', ''],
    }),
    number('Wochenstunden', 'weeklyHours', {
      nullable: true,
      examples: ['42', ''],
    }),
    number('Überstunden-Limit', 'overtimeCapHours', {
      nullable: true,
      examples: ['100', ''],
    }),
    number('Kostensatz', 'costRate', { nullable: true, examples: ['', '95'] }),
    int('Max. Reisezeit (Min.)', 'maxTravelMinutes', {
      nullable: true,
      examples: ['60', '90'],
    }),
    text('Externe Ref.', 'externalRef', {
      nullable: true,
      examples: ['A-1001', 'A-1002'],
    }),
    enumOf('Status', 'status', INSTRUCTOR_STATUS_LABELS, {
      examples: ['Aktiv', 'Aktiv'],
    }),
  ],
  archive: {
    archived: { status: InstructorStatus.Inactive },
    restored: { status: InstructorStatus.Active },
    isArchived: (i) => i.status !== InstructorStatus.Active,
  },
  import: {
    createDto: ImportInstructorDto,
    updateDto: UpdateImportInstructorDto,
    keyHeaders: ['E-Mail', 'Externe Ref.'],
    key: (values) => instructorKey(values.email, values.externalRef),
    entityKey: (i) => instructorKey(i.email, i.externalRef),
    lookups: {
      location: async (manager: EntityManager) => {
        const locations = await manager.find(Location, {
          select: { id: true, code: true },
        });
        return new Map(locations.map((l) => [normalizeKey(l.code), l.id]));
      },
      skill: async (manager: EntityManager) => {
        const skills = await manager.find(Skill, {
          select: { id: true, name: true },
        });
        return new Map(skills.map((s) => [normalizeKey(s.name), s.id]));
      },
    },
    loadExisting: (manager) =>
      manager.find(Instructor, { relations: { skills: true } }),
    currentValues: (i) => ({
      firstName: i.firstName,
      lastName: i.lastName,
      email: i.email,
      phone: i.phone,
      employmentType: i.employmentType,
      homeLocationId: i.homeLocationId,
      languages: i.languages,
      // An empty Skills cell (null) matches an instructor without skills.
      skillIds: i.skills?.length ? i.skills.map((s) => s.skillId) : null,
      weeklyHours: decimal(i.weeklyHours),
      overtimeCapHours: decimal(i.overtimeCapHours),
      costRate: decimal(i.costRate),
      maxTravelMinutes: i.maxTravelMinutes,
      externalRef: i.externalRef,
      status: i.status,
    }),
    toColumns: (values) => instructorColumns(values),
    virtualFields: ['skillIds'],
    afterSave: async (manager, rows) => {
      for (const { entity, values } of rows) {
        if (!('skillIds' in values)) continue;
        const skillIds = (values.skillIds as string[] | null) ?? [];
        // Keep the rows of skills that stay (with their level and date).
        const remove = manager
          .createQueryBuilder()
          .delete()
          .from(InstructorSkill)
          .where('instructor_id = :id', { id: entity.id });
        if (skillIds.length) {
          remove.andWhere('skill_id NOT IN (:...skillIds)', { skillIds });
        }
        await remove.execute();
        if (skillIds.length) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(InstructorSkill)
            .values(
              skillIds.map((skillId) => ({ instructorId: entity.id, skillId })),
            )
            .orIgnore()
            .execute();
        }
      }
    },
  },
};
