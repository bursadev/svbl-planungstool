import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** One field error as the UI shows it, unchanged. */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * German message per class-validator constraint. Decorators don't carry
 * their own messages; this map is the single place for the wording.
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  isNotEmpty: 'Pflichtfeld.',
  isDefined: 'Pflichtfeld.',
  isString: 'Ungültige Eingabe.',
  isEmail: 'Ungültige E-Mail-Adresse.',
  isEnum: 'Ungültiger Wert.',
  isUuid: 'Ungültige Referenz.',
  isDateString: 'Ungültiges Datum.',
  isDateOnly: 'Ungültiges Datum.',
  isInt: 'Ganze Zahl erwartet.',
  isNumber: 'Zahl erwartet.',
  isBoolean: 'Ja oder Nein erwartet.',
  isArray: 'Liste erwartet.',
  arrayNotEmpty: 'Mindestens ein Eintrag.',
  min: 'Wert ausserhalb des Bereichs.',
  max: 'Wert ausserhalb des Bereichs.',
  minLength: 'Zu kurz.',
  maxLength: 'Zu lang.',
  matches: 'Ungültiges Format.',
  whitelistValidation: 'Unbekanntes Feld.',
};
const DEFAULT_MESSAGE = 'Ungültige Eingabe.';

/** Flattens class-validator's error tree into field errors (`rooms.0.name`). */
export function toFieldErrors(
  errors: ValidationError[],
  prefix = '',
): FieldError[] {
  return errors.flatMap((err) => {
    const field = prefix ? `${prefix}.${err.property}` : err.property;
    const own = Object.keys(err.constraints ?? {}).map((key) => ({
      field,
      message: CONSTRAINT_MESSAGES[key] ?? DEFAULT_MESSAGE,
    }));
    const nested = err.children?.length
      ? toFieldErrors(err.children, field)
      : [];
    return [...own, ...nested];
  });
}

/** 400 with field errors; the exception filter shapes the response body. */
export class ValidationException extends BadRequestException {
  constructor(readonly errors: FieldError[]) {
    super('Eingabe ungültig.');
  }
}

/** The validation pipe every request body goes through; used by main.ts and the e2e tests. */
export function buildValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors) =>
      new ValidationException(toFieldErrors(errors)),
  });
}
