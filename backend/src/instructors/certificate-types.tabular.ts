import type { TabularSpec } from '../common/tabular-spec.js';
import { bool, int, normalizeKey, text } from '../common/tabular.js';
import { CertificateType } from './certificate-type.entity.js';
import {
  CreateCertificateTypeDto,
  UpdateCertificateTypeDto,
} from './dto/certificate-type.dto.js';

/**
 * CSV columns, import and bulk actions of `/certificate-types`; the key is the
 * code. The maintenance course types are edited in the dialog only.
 */
export const CERTIFICATE_TYPES_TABULAR: TabularSpec<CertificateType> = {
  entity: CertificateType,
  entityType: 'certificate_type',
  noun: 'Zertifikatstyp',
  fileName: 'zertifikatstypen',
  label: (c) => c.name ?? c.code,
  columns: [
    text('Code', 'code', { required: true, examples: ['SUVA-S', 'IPAF'] }),
    text('Name', 'name', {
      required: true,
      examples: ['SUVA Stapler', 'IPAF Hubarbeitsbühne'],
    }),
    text('Aussteller', 'issuer', {
      nullable: true,
      examples: ['SUVA', 'IPAF'],
    }),
    int('Gültigkeit (Jahre)', 'validityYears', {
      nullable: true,
      examples: ['', '5'],
    }),
    int('Warnfrist (Tage)', 'warningLeadDays', { examples: ['60', '90'] }),
    int('Mindestanzahl pro Jahr', 'maintenanceMinPerYear', {
      nullable: true,
      examples: ['', '2'],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (c) => !c.active,
  },
  import: {
    createDto: CreateCertificateTypeDto,
    updateDto: UpdateCertificateTypeDto,
    keyHeaders: ['Code'],
    key: (values) =>
      typeof values.code === 'string' && values.code
        ? normalizeKey(values.code)
        : null,
    entityKey: (c) => normalizeKey(c.code),
  },
};
