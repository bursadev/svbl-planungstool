import { detectSeparator, parseCsv, toCsv } from './csv.js';

describe('parseCsv', () => {
  it('reads semicolon CSV with BOM and CRLF', () => {
    expect(parseCsv('﻿Code;Name\r\nRUP;Rupperswil\r\n')).toEqual([
      ['Code', 'Name'],
      ['RUP', 'Rupperswil'],
    ]);
  });

  it('detects comma and tab separators from the header line', () => {
    expect(detectSeparator('a,b,c\n1;2')).toBe(',');
    expect(detectSeparator('a\tb\n')).toBe('\t');
    expect(detectSeparator('single')).toBe(';');
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles quotes, separators and line breaks inside cells', () => {
    expect(parseCsv('a;b\n"x;y";"he said ""hi""\nnext line"\n')).toEqual([
      ['a', 'b'],
      ['x;y', 'he said "hi"\nnext line'],
    ]);
  });

  it('keeps empty cells and drops blank rows', () => {
    expect(parseCsv('a;b;c\n1;;3\n\n;;\n4;5;\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
      ['4', '5', ''],
    ]);
  });

  it('reads a last row without a trailing newline', () => {
    expect(parseCsv('a\n1')).toEqual([['a'], ['1']]);
  });
});

describe('toCsv', () => {
  it('writes BOM, semicolons and CRLF and quotes only when needed', () => {
    expect(
      toCsv([
        ['Code', 'Name'],
        ['A;B', 'Say "x"'],
        ['plain', ' padded'],
      ]),
    ).toBe('﻿Code;Name\r\n"A;B";"Say ""x"""\r\nplain;" padded"\r\n');
  });

  it('round-trips through parseCsv', () => {
    const rows = [
      ['a', 'b'],
      ['multi\r\nline', 'x;y'],
      ['', 'ü'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
