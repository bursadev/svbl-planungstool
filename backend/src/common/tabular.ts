import { StreamableFile } from '@nestjs/common';
import { toCsv } from './csv.js';

/**
 * Column definitions shared by the CSV template, export and import of a
 * Stammdaten list. One column knows how to print a list row into a cell and
 * how to parse a cell back into the matching DTO field, so an export can be
 * imported again unchanged.
 */

/** A cell that cannot be parsed; the import report shows the message for that line and column. */
export class CellError extends Error {}

/** Lookup tables an import resolves references through: name → (normalized key → id). */
export type Lookups = Map<string, Map<string, string>>;

/** Lower-case, trimmed, inner whitespace collapsed: how keys and labels are matched. */
export function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-CH');
}

export interface CsvColumn {
  /** German header as written to the file; matched case- and space-insensitively on import. */
  header: string;
  /** DTO field the cell imports into; absent for export-only columns (e.g. «Räume»). */
  field?: string;
  /** The column has to be present in an import file and filled for new rows. */
  required?: boolean;
  /** An empty cell clears the value (null) when it updates an existing row. */
  nullable?: boolean;
  /** Values of the two example rows in the template. */
  examples?: [string, string];
  /** Cell text for one list row. */
  write(row: unknown): string;
  /** Parses a non-empty cell; throws `CellError`. Absent for export-only columns. */
  parse?(raw: string, lookups: Lookups): unknown;
}

type Getter = (row: never) => unknown;

interface ColumnOptions {
  /** Reads the value from a list row; defaults to `row[field]`. */
  get?: Getter;
  required?: boolean;
  nullable?: boolean;
  examples?: [string, string];
}

function base(
  header: string,
  field: string | undefined,
  options: ColumnOptions,
  format: (value: unknown) => string,
  parse?: (raw: string, lookups: Lookups) => unknown,
): CsvColumn {
  const get =
    (options.get as ((row: unknown) => unknown) | undefined) ??
    ((row: unknown) =>
      field ? (row as Record<string, unknown> | null)?.[field] : undefined);
  return {
    header,
    field,
    required: options.required,
    nullable: options.nullable,
    examples: options.examples,
    write: (row) => {
      const value = get(row);
      return value === null || value === undefined ? '' : format(value);
    },
    parse,
  };
}

const str = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

/** Free text, trimmed. */
export function text(
  header: string,
  field: string,
  options: ColumnOptions = {},
): CsvColumn {
  return base(header, field, options, str, (raw) => raw.trim());
}

/** Whole number. */
export function int(
  header: string,
  field: string,
  options: ColumnOptions = {},
): CsvColumn {
  return base(header, field, options, str, (raw) => {
    const value = raw.trim().replace(/['’]/g, '');
    if (!/^-?\d+$/.test(value)) throw new CellError('Ganze Zahl erwartet.');
    return Number(value);
  });
}

/** Decimal number; accepts `1.5` and `1,5`. */
export function number(
  header: string,
  field: string,
  options: ColumnOptions = {},
): CsvColumn {
  return base(header, field, options, str, (raw) => {
    const value = raw.trim().replace(/['’]/g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(value)) throw new CellError('Zahl erwartet.');
    return Number(value);
  });
}

const TRUE = new Set([
  'ja',
  'j',
  'yes',
  'y',
  'true',
  'wahr',
  '1',
  'x',
  'oui',
  'si',
  'sì',
]);
const FALSE = new Set(['nein', 'n', 'no', 'false', 'falsch', '0', 'non']);

/** `ja` / `nein` in the file; also accepts true/false, 1/0 and x. */
export function bool(
  header: string,
  field: string,
  options: ColumnOptions = {},
): CsvColumn {
  return base(
    header,
    field,
    options,
    (value) => (value ? 'ja' : 'nein'),
    (raw) => {
      const value = normalizeKey(raw);
      if (TRUE.has(value)) return true;
      if (FALSE.has(value)) return false;
      throw new CellError('«ja» oder «nein» erwartet.');
    },
  );
}

/** `YYYY-MM-DD` (what date columns store) from `31.12.2026`, `1.2.2026` or `2026-12-31`. */
export function parseDate(raw: string): string {
  const value = raw.trim();
  let y: number, m: number, d: number;
  const swiss = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (swiss) [d, m, y] = [Number(swiss[1]), Number(swiss[2]), Number(swiss[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else throw new CellError('Datum als TT.MM.JJJJ erwartet.');
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new CellError('Ungültiges Datum.');
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** `31.12.2026` for a `YYYY-MM-DD` value. */
export function formatDate(value: unknown): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(
    value instanceof Date ? value.toISOString() : str(value),
  );
  return match ? `${match[3]}.${match[2]}.${match[1]}` : str(value);
}

/** Calendar day, written Swiss style. */
export function date(
  header: string,
  field: string,
  options: ColumnOptions = {},
): CsvColumn {
  return base(header, field, options, formatDate, parseDate);
}

function enumParser(labels: Record<string, string>) {
  const byText = new Map<string, string>();
  for (const [value, label] of Object.entries(labels)) {
    byText.set(normalizeKey(value), value);
    byText.set(normalizeKey(label), value);
  }
  const allowed = Object.values(labels).join(', ');
  return (raw: string): string => {
    const value = byText.get(normalizeKey(raw));
    if (value === undefined) {
      throw new CellError(
        `Unbekannter Wert «${raw.trim()}». Erlaubt: ${allowed}.`,
      );
    }
    return value;
  };
}

/** Enum written with its German label; the API value is accepted too. */
export function enumOf(
  header: string,
  field: string,
  labels: Record<string, string>,
  options: ColumnOptions = {},
): CsvColumn {
  return base(
    header,
    field,
    options,
    (value) => labels[str(value)] ?? str(value),
    enumParser(labels),
  );
}

function splitList(raw: string): string[] {
  return raw
    .split(/[,|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Several enum values in one cell, comma-separated (e.g. languages «Deutsch, Französisch»). */
export function enumList(
  header: string,
  field: string,
  labels: Record<string, string>,
  options: ColumnOptions = {},
): CsvColumn {
  const parseOne = enumParser(labels);
  return base(
    header,
    field,
    options,
    (value) => (value as string[]).map((v) => labels[v] ?? v).join(', '),
    (raw) => [...new Set(splitList(raw).map(parseOne))],
  );
}

/** Several free-text values in one cell, comma-separated. */
export function textList(
  header: string,
  field: string,
  options: ColumnOptions = {},
): CsvColumn {
  return base(
    header,
    field,
    options,
    (value) => (value as string[]).join(', '),
    (raw) => [...new Set(splitList(raw))],
  );
}

function resolve(lookups: Lookups, lookup: string, raw: string): string {
  const id = lookups.get(lookup)?.get(normalizeKey(raw));
  if (!id) throw new CellError(`«${raw.trim()}» nicht gefunden.`);
  return id;
}

/**
 * Reference to another record by code or name. `get` reads the code from the
 * list row (e.g. `row.homeLocation.code`); on import the cell is resolved
 * through the lookup of that name into the id field.
 */
export function ref(
  header: string,
  field: string,
  lookup: string,
  options: ColumnOptions & { get: Getter },
): CsvColumn {
  return base(header, field, options, str, (raw, lookups) =>
    resolve(lookups, lookup, raw),
  );
}

/** Several references in one cell, comma-separated (e.g. skills by name). */
export function refList(
  header: string,
  field: string,
  lookup: string,
  options: ColumnOptions & { get: Getter },
): CsvColumn {
  return base(
    header,
    field,
    options,
    (value) => (value as string[]).join(', '),
    (raw, lookups) => [
      ...new Set(splitList(raw).map((item) => resolve(lookups, lookup, item))),
    ],
  );
}

/** A column that is only exported (computed values such as counts); ignored on import. */
export function readOnly(header: string, get: Getter): CsvColumn {
  return base(header, undefined, { get }, str);
}

/** Header plus the two example rows; only importable columns. */
export function templateCsv(columns: CsvColumn[]): string {
  const importable = columns.filter((c) => c.field);
  return toCsv([
    importable.map((c) => c.header),
    importable.map((c) => c.examples?.[0] ?? ''),
    importable.map((c) => c.examples?.[1] ?? ''),
  ]);
}

/** Header plus one line per row, all columns. */
export function exportCsv(columns: CsvColumn[], rows: unknown[]): string {
  return toCsv([
    columns.map((c) => c.header),
    ...rows.map((row) => columns.map((c) => c.write(row))),
  ]);
}

/** A CSV download named `<base>-<YYYY-MM-DD>.csv` (or `<base>-vorlage.csv`). */
export function csvFile(fileBase: string, csv: string): StreamableFile {
  return new StreamableFile(Buffer.from(csv, 'utf8'), {
    type: 'text/csv; charset=utf-8',
    disposition: `attachment; filename="${fileBase}.csv"`,
  });
}

/** `standorte-2026-10-30` for today's export. */
export function datedName(fileBase: string): string {
  return `${fileBase}-${new Date().toISOString().slice(0, 10)}`;
}
