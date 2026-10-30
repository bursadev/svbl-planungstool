import { isUnchanged } from './csv-import.js';
import { parseCsv } from './csv.js';
import {
  bool,
  CellError,
  date,
  enumList,
  enumOf,
  exportCsv,
  int,
  number,
  readOnly,
  ref,
  refList,
  templateCsv,
  text,
  type Lookups,
} from './tabular.js';

const none: Lookups = new Map();
const parse = (column: ReturnType<typeof text>, raw: string, lookups = none) =>
  column.parse!(raw, lookups);

describe('column parsers', () => {
  it('parses whole and decimal numbers, also with Swiss thousands separators', () => {
    expect(parse(int('N', 'n'), " 1'200 ")).toBe(1200);
    expect(() => parse(int('N', 'n'), '1.5')).toThrow(CellError);
    expect(parse(number('N', 'n'), '1,5')).toBe(1.5);
    expect(() => parse(number('N', 'n'), 'abc')).toThrow('Zahl erwartet.');
  });

  it('parses ja/nein and the usual variants', () => {
    const column = bool('B', 'b');
    expect(['ja', 'JA', 'x', '1', 'true'].map((v) => parse(column, v))).toEqual(
      [true, true, true, true, true],
    );
    expect(['nein', '0', 'false'].map((v) => parse(column, v))).toEqual([
      false,
      false,
      false,
    ]);
    expect(() => parse(column, 'vielleicht')).toThrow(
      '«ja» oder «nein» erwartet.',
    );
  });

  it('parses Swiss and ISO dates and rejects impossible ones', () => {
    const column = date('D', 'd');
    expect(parse(column, '1.2.2026')).toBe('2026-02-01');
    expect(parse(column, '2026-12-31')).toBe('2026-12-31');
    expect(() => parse(column, '31.02.2026')).toThrow('Ungültiges Datum.');
    expect(() => parse(column, '02/01/2026')).toThrow(CellError);
  });

  it('accepts enum labels and API values and names the allowed labels', () => {
    const labels = { de: 'Deutsch', fr: 'Französisch' };
    expect(parse(enumOf('S', 's', labels), ' deutsch ')).toBe('de');
    expect(parse(enumOf('S', 's', labels), 'fr')).toBe('fr');
    expect(() => parse(enumOf('S', 's', labels), 'Englisch')).toThrow(
      'Unbekannter Wert «Englisch». Erlaubt: Deutsch, Französisch.',
    );
    expect(parse(enumList('S', 's', labels), 'Deutsch, fr, deutsch')).toEqual([
      'de',
      'fr',
    ]);
  });

  it('resolves references by normalized code or name', () => {
    const lookups: Lookups = new Map([
      [
        'location',
        new Map([
          ['rup', 'id-1'],
          ['bern ost', 'id-2'],
        ]),
      ],
    ]);
    const one = ref('Standort', 'locationId', 'location', { get: () => null });
    const many = refList('Standorte', 'locationIds', 'location', {
      get: () => null,
    });
    expect(parse(one, ' RUP ', lookups)).toBe('id-1');
    expect(parse(many, 'rup | Bern  Ost', lookups)).toEqual(['id-1', 'id-2']);
    expect(() => parse(one, 'XYZ', lookups)).toThrow('«XYZ» nicht gefunden.');
  });
});

describe('templateCsv and exportCsv', () => {
  const columns = [
    text('Code', 'code', { examples: ['A', 'B'] }),
    bool('Aktiv', 'active', { examples: ['ja', 'nein'] }),
    date('Ab', 'startsOn'),
    readOnly('Räume', (row: { rooms: unknown[] }) => row.rooms.length),
  ];

  it('writes only importable columns into the template', () => {
    expect(parseCsv(templateCsv(columns))).toEqual([
      ['Code', 'Aktiv', 'Ab'],
      ['A', 'ja', ''],
      ['B', 'nein', ''],
    ]);
  });

  it('exports every column with Swiss formatting', () => {
    const csv = exportCsv(columns, [
      { code: 'X', active: false, startsOn: '2026-09-01', rooms: [1, 2] },
    ]);
    expect(parseCsv(csv)).toEqual([
      ['Code', 'Aktiv', 'Ab', 'Räume'],
      ['X', 'nein', '01.09.2026', '2'],
    ]);
  });
});

describe('isUnchanged', () => {
  it('treats blanks alike, numbers and numeric strings alike and ignores list order', () => {
    expect(
      isUnchanged(
        { a: null, b: 2, c: ['x', 'y'] },
        { a: '', b: '2.00', c: ['y', 'x'] },
      ),
    ).toBe(true);
    expect(isUnchanged({ a: 'x' }, { a: null })).toBe(false);
    expect(isUnchanged({ c: ['x'] }, { c: ['x', 'y'] })).toBe(false);
    expect(isUnchanged({ ok: false }, { ok: true })).toBe(false);
  });
});
