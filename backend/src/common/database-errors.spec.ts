import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { mapDatabaseError } from './database-errors.js';

function pgError(code: string, detail?: string): QueryFailedError {
  return new QueryFailedError(
    'INSERT …',
    [],
    Object.assign(new Error('pg'), { code, detail }),
  );
}

describe('mapDatabaseError', () => {
  it.each(['23001', '23503'])(
    'turns foreign-key violation %s into a 409 about the row being in use',
    (code) => {
      const err = mapDatabaseError(pgError(code));
      expect(err).toBeInstanceOf(ConflictException);
      expect(err?.message).toBe(
        'Der Eintrag wird noch verwendet und kann nicht gelöscht werden.',
      );
    },
  );

  it('matches by shape, not by class', () => {
    expect(
      mapDatabaseError({ driverError: { code: '23001' } })?.getStatus(),
    ).toBe(409);
  });

  it('names the column of a unique violation', () => {
    const err = mapDatabaseError(
      pgError('23505', 'Key (code)=(RUP) already exists.'),
    );
    expect(err?.message).toBe('Code ist bereits vergeben.');
  });

  it('uses the last column of a composite unique key', () => {
    const err = mapDatabaseError(
      pgError('23505', 'Key (location_id, name)=(…, Halle A) already exists.'),
    );
    expect(err?.message).toBe('Name ist bereits vergeben.');
  });

  it('returns null for anything else', () => {
    expect(mapDatabaseError(pgError('42P01'))).toBeNull();
    expect(mapDatabaseError(new Error('x'))).toBeNull();
  });
});
