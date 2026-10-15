import { ConflictException, HttpException } from '@nestjs/common';

/** 23001 restrict_violation (ON DELETE RESTRICT), 23503 foreign_key_violation (NO ACTION). */
const FOREIGN_KEY_VIOLATIONS = new Set(['23001', '23503']);
const UNIQUE_VIOLATION = '23505';

type PgError = { code?: string; detail?: string; constraint?: string };

/**
 * Turns the PostgreSQL errors a write can legitimately hit into HTTP errors
 * with a German message. Returns null for anything else, so the caller can
 * rethrow. Matches on TypeORM's QueryFailedError by shape (`driverError.code`)
 * rather than `instanceof`, because the ESM and CJS builds of TypeORM are two
 * different classes under vitest.
 */
export function mapDatabaseError(err: unknown): HttpException | null {
  const pg = (err as { driverError?: PgError } | null)?.driverError;
  if (!pg?.code) return null;
  if (FOREIGN_KEY_VIOLATIONS.has(pg.code)) {
    return new ConflictException(
      'Der Eintrag wird noch verwendet und kann nicht gelöscht werden.',
    );
  }
  if (pg.code === UNIQUE_VIOLATION) {
    // detail: `Key (code)=(RUP) already exists.` or `Key (location_id, name)=(…) already exists.`
    const columns = /Key \(([^)]+)\)=/.exec(pg.detail ?? '')?.[1];
    const field = columns
      ?.split(',')
      .map((c) => c.trim())
      .pop();
    return new ConflictException(
      field
        ? `${columnLabel(field)} ist bereits vergeben.`
        : 'Der Eintrag existiert bereits.',
    );
  }
  return null;
}

function columnLabel(column: string): string {
  const labels: Record<string, string> = {
    code: 'Code',
    name: 'Name',
    email: 'E-Mail-Adresse',
    inventory_number: 'Inventarnummer',
    short_name: 'Kurzname',
    ahv_number: 'AHV-Nummer',
    key: 'Schlüssel',
    sequence: 'Die Reihenfolge',
    course_type_id: 'Der Kurstyp',
    start_year: 'Das Startjahr',
    cohort_id: 'Der Jahrgang',
    location_id: 'Der Standort',
    weekday: 'Der Wochentag',
    instructor_id: 'Der Ausbilder',
    trainer_id: 'Der Berufsbildner',
  };
  return labels[column] ?? 'Der Wert';
}
