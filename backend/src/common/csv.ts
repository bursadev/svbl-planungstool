/**
 * CSV reading and writing for the Stammdaten import and export. Writes what
 * Swiss Excel opens with a double click (UTF-8 with BOM, `;`), reads that and
 * the usual variants (`,` or tab, with or without BOM, CRLF or LF).
 */

const BOM = '﻿';
const SEPARATORS = [';', ',', '\t'] as const;

export type CsvSeparator = (typeof SEPARATORS)[number];

/** Picks the separator that occurs most often outside quotes in the first line. */
export function detectSeparator(text: string): CsvSeparator {
  const counts = new Map<CsvSeparator, number>(SEPARATORS.map((s) => [s, 0]));
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === '\n' || ch === '\r')) break;
    else if (!quoted && counts.has(ch as CsvSeparator)) {
      counts.set(ch as CsvSeparator, counts.get(ch as CsvSeparator)! + 1);
    }
  }
  let best: CsvSeparator = ';';
  for (const s of SEPARATORS) {
    if (counts.get(s)! > counts.get(best)!) best = s;
  }
  return best;
}

/**
 * Parses RFC 4180 CSV into rows of cells. Quoted cells may contain the
 * separator, line breaks and doubled quotes. Rows that are entirely empty
 * (blank lines, Excel's trailing `;;;`) are dropped.
 */
export function parseCsv(input: string, separator?: CsvSeparator): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input;
  const sep = separator ?? detectSeparator(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let i = 0;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else {
        cell += ch;
      }
      i += 1;
      continue;
    }
    if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === sep) {
      endCell();
    } else if (ch === '\r') {
      endRow();
      if (text[i + 1] === '\n') i += 1;
    } else if (ch === '\n') {
      endRow();
    } else {
      cell += ch;
    }
    i += 1;
  }
  if (cell !== '' || row.length > 0) endRow();
  return rows;
}

function quote(value: string, sep: string): string {
  return /["\r\n]/.test(value) || value.includes(sep) || /^\s|\s$/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

/** Serializes rows with BOM, `;` and CRLF line ends; cells are quoted only when needed. */
export function toCsv(rows: string[][], separator: CsvSeparator = ';'): string {
  return (
    BOM +
    rows
      .map((row) => row.map((cell) => quote(cell, separator)).join(separator))
      .join('\r\n') +
    '\r\n'
  );
}
