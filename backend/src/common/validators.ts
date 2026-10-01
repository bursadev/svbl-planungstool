import { ValidateBy, type ValidationOptions } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A calendar day as `YYYY-MM-DD` (what the `date` columns store). */
export function IsDateOnly(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDateOnly',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          DATE_ONLY.test(value) &&
          !Number.isNaN(Date.parse(value)),
      },
    },
    options,
  );
}
