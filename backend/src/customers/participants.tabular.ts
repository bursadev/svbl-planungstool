import { LANGUAGE_LABELS } from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import { enumOf, normalizeKey, ref, text } from '../common/tabular.js';
import { customerLookup } from './customers.tabular.js';
import type { ParticipantView } from './customers.service.js';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from './dto/participant.dto.js';
import { Participant } from './participant.entity.js';

/**
 * Natural key of a Teilnehmer/in: the e-mail when there is one, else first
 * name, last name and customer. There is no birth date to tell namesakes
 * apart, so the customer stands in for it.
 */
function participantKey(
  email: unknown,
  firstName: unknown,
  lastName: unknown,
  customerId: unknown,
): string | null {
  if (typeof email === 'string' && email.trim()) {
    return `mail:${normalizeKey(email)}`;
  }
  if (typeof firstName !== 'string' || typeof lastName !== 'string') {
    return null;
  }
  if (!firstName.trim() || !lastName.trim()) return null;
  const customer = typeof customerId === 'string' ? customerId : '';
  return `name:${normalizeKey(`${firstName} ${lastName}`)}|${customer}`;
}

/** CSV columns, import and bulk delete of `/participants`; the key is the e-mail, else name + Kunde. No archive. */
export const PARTICIPANTS_TABULAR: TabularSpec<Participant> = {
  entity: Participant,
  entityType: 'participant',
  noun: 'Teilnehmer/in',
  fileName: 'teilnehmende',
  label: (p) => `${p.firstName} ${p.lastName}`,
  columns: [
    text('Vorname', 'firstName', {
      required: true,
      examples: ['Anna', 'Luc'],
    }),
    text('Nachname', 'lastName', {
      required: true,
      examples: ['Muster', 'Bovet'],
    }),
    text('E-Mail', 'email', {
      nullable: true,
      examples: ['anna.muster@example.ch', ''],
    }),
    text('Telefon', 'phone', {
      nullable: true,
      examples: ['+41 79 123 45 67', ''],
    }),
    enumOf('Sprache', 'language', LANGUAGE_LABELS, {
      required: true,
      examples: ['Deutsch', 'Französisch'],
    }),
    ref('Kunde', 'customerId', 'customers', {
      nullable: true,
      get: (p: ParticipantView) => p.customer?.name,
      examples: ['Muster Bau AG', ''],
    }),
    text('Bemerkungen', 'notes', { nullable: true, examples: ['', ''] }),
  ],
  import: {
    createDto: CreateParticipantDto,
    updateDto: UpdateParticipantDto,
    keyHeaders: ['Vorname', 'Nachname', 'Kunde'],
    key: (values) =>
      participantKey(
        values.email,
        values.firstName,
        values.lastName,
        values.customerId,
      ),
    entityKey: (p) =>
      participantKey(p.email, p.firstName, p.lastName, p.customerId),
    lookups: { customers: customerLookup },
  },
};
