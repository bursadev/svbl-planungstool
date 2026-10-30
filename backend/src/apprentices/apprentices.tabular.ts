import {
  APPRENTICE_STATUS_LABELS,
  GENDER_LABELS,
  LANGUAGE_LABELS,
  TRACK_LABELS,
} from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import { date, enumOf, readOnly, text } from '../common/tabular.js';
import { Apprentice } from './apprentice.entity.js';

/**
 * CSV export of `/apprentices`. Export only: the school export is the source
 * of truth (Requirements §7), so there is no import and no bulk action. The
 * AHV number is left out on purpose (sensitive).
 */
export const APPRENTICES_TABULAR: TabularSpec<Apprentice> = {
  entity: Apprentice,
  entityType: 'apprentice',
  noun: 'Lernende/n',
  fileName: 'lernende',
  label: (a) => `${a.lastName}, ${a.firstName}`,
  columns: [
    text('Externe ID', 'externalId'),
    text('Nachname', 'lastName'),
    text('Vorname', 'firstName'),
    date('Geburtsdatum', 'birthDate'),
    enumOf('Geschlecht', 'gender', GENDER_LABELS),
    text('E-Mail', 'email'),
    text('Telefon', 'phone'),
    text('Adresse', 'addressLine'),
    text('PLZ', 'postalCode'),
    text('Ort', 'city'),
    enumOf('Sprache', 'language', LANGUAGE_LABELS),
    enumOf('Lehrgang', 'track', TRACK_LABELS),
    readOnly('Jahrgang', (a: Apprentice) => a.cohort?.label),
    readOnly('Berufsschule', (a: Apprentice) => a.vocationalSchool?.shortName),
    readOnly('Klasse', (a: Apprentice) => a.schoolClass?.code),
    readOnly('Lehrbetrieb', (a: Apprentice) => a.trainingCompany?.name),
    date('Lehrbeginn', 'apprenticeshipStart'),
    date('Lehrende', 'apprenticeshipEnd'),
    enumOf('Status', 'status', APPRENTICE_STATUS_LABELS),
  ],
};
