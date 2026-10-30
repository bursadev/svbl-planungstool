import type { RowValues, TabularSpec } from '../common/tabular-spec.js';
import { bool, normalizeKey, readOnly, text } from '../common/tabular.js';
import {
  CreateTrainingCompanyDto,
  UpdateTrainingCompanyDto,
} from './dto/training-company.dto.js';
import type { TrainingCompanyRow } from './training-companies.service.js';
import { TrainingCompany } from './training-company.entity.js';

/**
 * Natural key of a Lehrbetrieb: the external (OdAOrg) ref when there is one,
 * else name plus postal code. Both sides of the import use it, so a file row
 * without ref matches a record without ref by name and PLZ.
 */
function companyKey(
  externalRef: unknown,
  name: unknown,
  postalCode: unknown,
): string | null {
  if (typeof externalRef === 'string' && externalRef.trim()) {
    return `ref:${normalizeKey(externalRef)}`;
  }
  if (typeof name !== 'string' || !name.trim()) return null;
  const plz =
    typeof postalCode === 'string' ? postalCode.replace(/\s+/g, '') : '';
  return `name:${normalizeKey(name)}|${plz.toLowerCase()}`;
}

/** CSV columns, import and bulk actions of `/training-companies`; the key is the external ref, else name + PLZ. */
export const TRAINING_COMPANIES_TABULAR: TabularSpec<TrainingCompany> = {
  entity: TrainingCompany,
  entityType: 'training_company',
  noun: 'Lehrbetrieb',
  fileName: 'lehrbetriebe',
  label: (c) => c.name,
  columns: [
    text('Name', 'name', {
      required: true,
      examples: ['Muster Gartenbau AG', 'Paysages Romands SA'],
    }),
    text('Adresse', 'addressLine', {
      nullable: true,
      examples: ['Industriestrasse 5', 'Route de Berne 12'],
    }),
    text('PLZ', 'postalCode', { nullable: true, examples: ['3000', '1700'] }),
    text('Ort', 'city', { nullable: true, examples: ['Bern', 'Fribourg'] }),
    text('E-Mail', 'email', {
      nullable: true,
      examples: ['info@muster-gartenbau.ch', 'contact@paysages-romands.ch'],
    }),
    text('Telefon', 'phone', {
      nullable: true,
      examples: ['+41 31 123 45 67', '+41 26 123 45 67'],
    }),
    text('Externe Ref.', 'externalRef', {
      nullable: true,
      examples: ['10001', ''],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
    readOnly('Lernende', (c: TrainingCompanyRow) => c.apprenticeCount),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (c) => !c.active,
  },
  import: {
    createDto: CreateTrainingCompanyDto,
    updateDto: UpdateTrainingCompanyDto,
    keyHeaders: ['Name'],
    key: (values: RowValues) =>
      companyKey(values.externalRef, values.name, values.postalCode),
    entityKey: (c) => companyKey(c.externalRef, c.name, c.postalCode),
  },
};
