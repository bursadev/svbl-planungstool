import type { TabularSpec } from '../common/tabular-spec.js';
import { bool, normalizeKey, text } from '../common/tabular.js';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto.js';
import { Skill } from './skill.entity.js';

/** CSV columns, import and bulk actions of `/skills`; the key is the name. */
export const SKILLS_TABULAR: TabularSpec<Skill> = {
  entity: Skill,
  entityType: 'skill',
  noun: 'Skill',
  fileName: 'skills',
  label: (s) => s.name,
  columns: [
    text('Name', 'name', {
      required: true,
      examples: ['Kranführer', 'Staplerfahrer'],
    }),
    text('Kategorie', 'category', {
      nullable: true,
      examples: ['Geräte', 'Geräte'],
    }),
    text('Beschreibung', 'description', {
      nullable: true,
      examples: ['Darf Kurse am Kran leiten', ''],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (s) => !s.active,
  },
  import: {
    createDto: CreateSkillDto,
    updateDto: UpdateSkillDto,
    keyHeaders: ['Name'],
    key: (values) =>
      typeof values.name === 'string' && values.name
        ? normalizeKey(values.name)
        : null,
    entityKey: (s) => normalizeKey(s.name),
  },
};
