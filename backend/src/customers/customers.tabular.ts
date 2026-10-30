import type { EntityManager } from 'typeorm';
import type { TabularSpec } from '../common/tabular-spec.js';
import { bool, normalizeKey, readOnly, text } from '../common/tabular.js';
import { Customer } from './customer.entity.js';
import type { CustomerRow } from './customers.service.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';

/**
 * Customer name → id, for the «Kunde» column of the participant import. The
 * name is the customer's natural key (see `CUSTOMERS_TABULAR`).
 */
export async function customerLookup(
  manager: EntityManager,
): Promise<Map<string, string>> {
  const customers = await manager.find(Customer, {
    select: { id: true, name: true },
  });
  return new Map(customers.map((c) => [normalizeKey(c.name), c.id]));
}

/**
 * CSV columns, import and bulk actions of `/customers`. The key is the name:
 * it is unique in the data, while the Abacus and OdAOrg refs are mostly empty
 * and are exactly what a file may want to fill in.
 */
export const CUSTOMERS_TABULAR: TabularSpec<Customer> = {
  entity: Customer,
  entityType: 'customer',
  noun: 'Kunde',
  fileName: 'kunden',
  label: (c) => c.name,
  columns: [
    text('Name', 'name', {
      required: true,
      examples: ['Muster Bau AG', 'Transports Romands SA'],
    }),
    text('Adresse', 'addressLine', {
      nullable: true,
      examples: ['Bahnhofstrasse 1', 'Rue du Lac 4'],
    }),
    text('PLZ', 'postalCode', { nullable: true, examples: ['8000', '1003'] }),
    text('Ort', 'city', { nullable: true, examples: ['Zürich', 'Lausanne'] }),
    text('Kontakt', 'contactName', {
      nullable: true,
      examples: ['Peter Muster', 'Claire Dubois'],
    }),
    text('Kontakt E-Mail', 'contactEmail', {
      nullable: true,
      examples: ['peter.muster@musterbau.ch', 'c.dubois@transports-romands.ch'],
    }),
    text('Kontakt Telefon', 'contactPhone', {
      nullable: true,
      examples: ['+41 44 123 45 67', '+41 21 123 45 67'],
    }),
    text('Abacus-Nr.', 'externalRefAbacus', {
      nullable: true,
      examples: ['20001', ''],
    }),
    text('OdAOrg-Ref.', 'externalRefOdaorg', {
      nullable: true,
      examples: ['', '1888'],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
    readOnly('Teilnehmende', (c: CustomerRow) => c.participantCount),
    readOnly('Standorte', (c: CustomerRow) => c.siteCount),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (c) => !c.active,
  },
  import: {
    createDto: CreateCustomerDto,
    updateDto: UpdateCustomerDto,
    keyHeaders: ['Name'],
    key: (values) =>
      typeof values.name === 'string' && values.name
        ? normalizeKey(values.name)
        : null,
    entityKey: (c) => normalizeKey(c.name),
  },
};
