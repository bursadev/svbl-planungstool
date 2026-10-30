import { LANGUAGE_LABELS, LOCATION_KIND_LABELS } from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import {
  bool,
  enumOf,
  int,
  normalizeKey,
  readOnly,
  text,
} from '../common/tabular.js';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto.js';
import { Location } from './location.entity.js';

/** CSV columns, import and bulk actions of `/locations`; the key is the code. */
export const LOCATIONS_TABULAR: TabularSpec<Location> = {
  entity: Location,
  entityType: 'location',
  noun: 'Standort',
  fileName: 'standorte',
  label: (l) => l.name ?? l.code,
  columns: [
    text('Code', 'code', { required: true, examples: ['RUP', 'MAR'] }),
    text('Name', 'name', { required: true, examples: ['Rupperswil', 'Marly'] }),
    enumOf('Art', 'kind', LOCATION_KIND_LABELS, {
      required: true,
      examples: ['Ausbildungszentrum', 'Ausbildungszentrum'],
    }),
    text('Adresse', 'addressLine', {
      nullable: true,
      examples: ['Industriestrasse 12', 'Route de la Gruyère 1'],
    }),
    text('PLZ', 'postalCode', { nullable: true, examples: ['5102', '1723'] }),
    text('Ort', 'city', { nullable: true, examples: ['Rupperswil', 'Marly'] }),
    text('Kanton', 'canton', { nullable: true, examples: ['AG', 'FR'] }),
    enumOf('Sprachregion', 'languageRegion', LANGUAGE_LABELS, {
      required: true,
      examples: ['Deutsch', 'Französisch'],
    }),
    bool('ÜK-Standort', 'hostsUk', { examples: ['ja', 'ja'] }),
    int('Parallele Kurse', 'parallelCourseCapacity', { examples: ['3', '2'] }),
    text('Kontakt', 'contactName', {
      nullable: true,
      examples: ['Sandra Meier', 'Luc Bovet'],
    }),
    text('Kontakt E-Mail', 'contactEmail', {
      nullable: true,
      examples: ['sandra.meier@svbl.ch', 'luc.bovet@svbl.ch'],
    }),
    text('Kontakt Telefon', 'contactPhone', {
      nullable: true,
      examples: ['+41 62 123 45 00', '+41 26 123 45 00'],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
    readOnly('Räume', (l: Location) => l.rooms?.length ?? 0),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (l) => !l.active,
  },
  import: {
    createDto: CreateLocationDto,
    updateDto: UpdateLocationDto,
    keyHeaders: ['Code'],
    key: (values) =>
      typeof values.code === 'string' && values.code
        ? normalizeKey(values.code)
        : null,
    entityKey: (l) => normalizeKey(l.code),
  },
};
