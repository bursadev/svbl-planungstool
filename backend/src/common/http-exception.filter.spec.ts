import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { ValidationException } from './validation.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('returns field errors for validation failures', () => {
    const body = filter.toBody(
      new ValidationException([{ field: 'name', message: 'Pflichtfeld.' }]),
    );
    expect(body).toEqual({
      statusCode: 400,
      message: 'Eingabe ungültig.',
      errors: [{ field: 'name', message: 'Pflichtfeld.' }],
    });
  });

  it('replaces Nest default messages with German ones', () => {
    expect(filter.toBody(new NotFoundException())).toEqual({
      statusCode: 404,
      message: 'Nicht gefunden.',
    });
  });

  it('keeps a custom message', () => {
    expect(
      filter.toBody(new ForbiddenException('Keine Berechtigung.')),
    ).toEqual({
      statusCode: 403,
      message: 'Keine Berechtigung.',
    });
  });

  it('maps database errors a write can hit', () => {
    const err = new QueryFailedError(
      'DELETE …',
      [],
      Object.assign(new Error('pg'), { code: '23503' }),
    );
    expect(filter.toBody(err).statusCode).toBe(409);
  });

  it('hides unexpected errors behind a generic 500', () => {
    vi.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    expect(filter.toBody(new Error('boom'))).toEqual({
      statusCode: 500,
      message: 'Unerwarteter Fehler.',
    });
  });
});
