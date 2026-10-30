import { LANGUAGE_LABELS } from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import {
  bool,
  enumOf,
  normalizeKey,
  readOnly,
  ref,
  text,
} from '../common/tabular.js';
import { Location } from '../locations/location.entity.js';
import {
  CreateVocationalSchoolDto,
  UpdateVocationalSchoolDto,
} from './dto/school.dto.js';
import type { VocationalSchoolView } from './schools.service.js';
import { VocationalSchool } from './vocational-school.entity.js';

/**
 * CSV columns, import and bulk actions of `/vocational-schools`; the key is
 * the short name. The ÜK-Standort is written and read as the location code.
 * The import mapping of the school export is not a CSV column.
 */
export const SCHOOLS_TABULAR: TabularSpec<VocationalSchool> = {
  entity: VocationalSchool,
  entityType: 'vocational_school',
  noun: 'Berufsschule',
  fileName: 'berufsschulen',
  label: (s) => s.name ?? s.shortName,
  columns: [
    text('Name', 'name', {
      required: true,
      examples: ['Berufsfachschule Baden', 'École professionnelle Fribourg'],
    }),
    text('Kurzname', 'shortName', {
      required: true,
      examples: ['BBB', 'EPAI'],
    }),
    text('Adresse', 'addressLine', {
      nullable: true,
      examples: ['Wiesenstrasse 32', 'Route de Moncor 2'],
    }),
    text('PLZ', 'postalCode', { nullable: true, examples: ['5400', '1752'] }),
    text('Ort', 'city', {
      nullable: true,
      examples: ['Baden', 'Villars-sur-Glâne'],
    }),
    text('Kanton', 'canton', { nullable: true, examples: ['AG', 'FR'] }),
    enumOf('Sprache', 'language', LANGUAGE_LABELS, {
      required: true,
      examples: ['Deutsch', 'Französisch'],
    }),
    ref('ÜK-Standort', 'nearestLocationId', 'locations', {
      required: true,
      get: (s: VocationalSchoolView) => s.nearestLocation?.code,
      examples: ['RUP', 'MAR'],
    }),
    text('Kontakt', 'contactName', {
      nullable: true,
      examples: ['Martin Keller', 'Claire Dubois'],
    }),
    text('Kontakt E-Mail', 'contactEmail', {
      nullable: true,
      examples: ['martin.keller@bbbaden.ch', 'claire.dubois@epai.ch'],
    }),
    text('Kontakt Telefon', 'contactPhone', {
      nullable: true,
      examples: ['+41 56 222 00 00', '+41 26 305 00 00'],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
    readOnly('Klassen', (s: VocationalSchoolView) => s.classes?.length ?? 0),
    readOnly('Lernende', (s: VocationalSchoolView) => s.apprenticeCount ?? 0),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (s) => !s.active,
  },
  import: {
    createDto: CreateVocationalSchoolDto,
    updateDto: UpdateVocationalSchoolDto,
    keyHeaders: ['Kurzname'],
    key: (values) =>
      typeof values.shortName === 'string' && values.shortName
        ? normalizeKey(values.shortName)
        : null,
    entityKey: (s) => normalizeKey(s.shortName),
    lookups: {
      locations: async (manager) => {
        const locations = await manager.find(Location, {
          select: { id: true, code: true },
        });
        return new Map(locations.map((l) => [normalizeKey(l.code), l.id]));
      },
    },
  },
};
