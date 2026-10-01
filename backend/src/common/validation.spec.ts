import { toFieldErrors } from './validation.js';

describe('toFieldErrors', () => {
  it('maps constraints to German messages per field', () => {
    const errors = toFieldErrors([
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
        children: [],
      },
      {
        property: 'name',
        constraints: { isNotEmpty: '...', isString: '...' },
        children: [],
      },
    ]);
    expect(errors).toEqual([
      { field: 'email', message: 'Ungültige E-Mail-Adresse.' },
      { field: 'name', message: 'Pflichtfeld.' },
      { field: 'name', message: 'Ungültige Eingabe.' },
    ]);
  });

  it('flattens nested errors with a dotted path', () => {
    const errors = toFieldErrors([
      {
        property: 'devices',
        children: [
          {
            property: '0',
            children: [
              {
                property: 'quantity',
                constraints: { min: '...' },
                children: [],
              },
            ],
          },
        ],
      },
    ]);
    expect(errors).toEqual([
      { field: 'devices.0.quantity', message: 'Wert ausserhalb des Bereichs.' },
    ]);
  });

  it('falls back to a generic message for unknown constraints', () => {
    expect(
      toFieldErrors([
        {
          property: 'x',
          constraints: { somethingCustom: '...' },
          children: [],
        },
      ]),
    ).toEqual([{ field: 'x', message: 'Ungültige Eingabe.' }]);
  });
});
