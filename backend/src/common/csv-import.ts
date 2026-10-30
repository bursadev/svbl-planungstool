import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { DataSource, DeepPartial, ObjectLiteral } from 'typeorm';
import { AuditEntry } from '../system/audit-entry.entity.js';
import { snapshot } from '../system/audit.service.js';
import { parseCsv } from './csv.js';
import type {
  ImportSpec,
  RowValues,
  SavedRow,
  TabularSpec,
} from './tabular-spec.js';
import {
  CellError,
  normalizeKey,
  type CsvColumn,
  type Lookups,
} from './tabular.js';
import { toFieldErrors } from './validation.js';

export type ImportAction = 'create' | 'update' | 'unchanged';

/** What `POST /<resource>/import` answers, for the dry run and the real run alike. */
export interface ImportReport {
  dryRun: boolean;
  /** True when the rows were written (no errors and not a dry run). */
  written: boolean;
  total: number;
  created: number;
  updated: number;
  unchanged: number;
  /** Line 1 is the header; the first data row is line 2. */
  errors: { line: number; column: string | null; message: string }[];
  /** More errors than listed in `errors`. */
  moreErrors: number;
  rows: { line: number; action: ImportAction; label: string }[];
}

const MAX_ERRORS = 200;
const MAX_ROWS = 1000;
const CHUNK = 500;

interface PlannedRow<TEntity> {
  line: number;
  values: RowValues;
  existing: TEntity | undefined;
  action: ImportAction;
  label: string;
}

/**
 * Runs a CSV import for one Stammdaten resource. Every row is parsed and
 * validated against the resource's Create or Update DTO first; only a file
 * without a single error is written, in one transaction, with one audit
 * entry per created or changed row. Rows are matched to existing records by
 * the spec's natural key, so a re-imported export reports every row unchanged.
 */
export async function runCsvImport<
  TEntity extends ObjectLiteral & { id: string },
>(
  ds: DataSource,
  spec: TabularSpec<TEntity>,
  csv: string,
  options: { dryRun: boolean; actorUserId: string | null },
): Promise<ImportReport> {
  const imp = spec.import;
  if (!imp) {
    throw new BadRequestException('Für diese Liste gibt es keinen Import.');
  }
  const report: ImportReport = {
    dryRun: options.dryRun,
    written: false,
    total: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    errors: [],
    moreErrors: 0,
    rows: [],
  };
  const addError = (line: number, column: string | null, message: string) => {
    if (report.errors.length < MAX_ERRORS)
      report.errors.push({ line, column, message });
    else report.moreErrors += 1;
  };

  const [header, ...data] = parseCsv(csv);
  if (!header) {
    addError(1, null, 'Die Datei ist leer.');
    return report;
  }

  // Header cell index → column; unknown headers (export-only columns, notes) are ignored.
  const importable = spec.columns.filter(
    (c) => c.field && c.parse !== undefined,
  );
  const byHeader = new Map(importable.map((c) => [normalizeKey(c.header), c]));
  const mapped: (CsvColumn | undefined)[] = header.map((h) =>
    byHeader.get(normalizeKey(h)),
  );
  const present = new Set(mapped.filter(Boolean));
  // Only a key column must be there: a file with a few columns updates just those
  // fields of existing rows; new rows then miss their required fields (checked per row).
  // With alternative keys (e-mail, else external ref) one of them is enough; a row the
  // spec cannot key gets «Schlüssel fehlt».
  const keyHeaders = new Set(imp.keyHeaders.map(normalizeKey));
  const keyColumns = importable.filter((c) =>
    keyHeaders.has(normalizeKey(c.header)),
  );
  if (keyColumns.length && !keyColumns.some((c) => present.has(c))) {
    addError(1, keyColumns.map((c) => c.header).join(' / '), 'Spalte fehlt.');
  }
  if (report.errors.length) return report;
  if (!data.length) {
    addError(2, null, 'Die Datei enthält keine Datenzeilen.');
    return report;
  }

  const lookups: Lookups = new Map();
  for (const [name, load] of Object.entries(imp.lookups ?? {})) {
    lookups.set(name, await load(ds.manager));
  }
  const existingRows = imp.loadExisting
    ? await imp.loadExisting(ds.manager)
    : await ds.manager.find(spec.entity);
  const existingByKey = new Map<string, TEntity>();
  for (const entity of existingRows) {
    const key = imp.entityKey(entity);
    if (key) existingByKey.set(key, entity);
  }

  const columnOfField = new Map(importable.map((c) => [c.field!, c]));
  const seen = new Map<string, number>();
  const planned: PlannedRow<TEntity>[] = [];
  report.total = data.length;

  data.forEach((cells, index) => {
    const line = index + 2;
    const values: RowValues = {};
    const empty: CsvColumn[] = [];
    let rowOk = true;
    mapped.forEach((column, i) => {
      if (!column) return;
      const raw = cells[i] ?? '';
      if (raw.trim() === '') {
        empty.push(column);
        return;
      }
      try {
        values[column.field!] = column.parse!(raw, lookups);
      } catch (err) {
        if (!(err instanceof CellError)) throw err;
        addError(line, column.header, err.message);
        rowOk = false;
      }
    });
    if (!rowOk) return;

    const key = imp.key(values);
    if (!key) {
      addError(line, imp.keyHeaders.join(' / '), 'Schlüssel fehlt.');
      return;
    }
    const firstLine = seen.get(key);
    if (firstLine) {
      addError(
        line,
        imp.keyHeaders.join(' / '),
        `Doppelt in der Datei (Zeile ${firstLine}).`,
      );
      return;
    }
    seen.set(key, line);

    const existing = existingByKey.get(key);
    if (existing) {
      for (const column of empty)
        if (column.nullable) values[column.field!] = null;
    } else {
      for (const column of importable) {
        if (!column.required) continue;
        if (!present.has(column))
          addError(line, column.header, 'Pflichtfeld (Spalte fehlt).');
        else if (empty.includes(column))
          addError(line, column.header, 'Pflichtfeld.');
      }
    }
    const dtoClass = existing ? imp.updateDto : imp.createDto;
    const errors = validateSync(plainToInstance(dtoClass, values) as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    for (const { field, message } of toFieldErrors(errors)) {
      const column = columnOfField.get(field.split('.')[0]);
      addError(line, column?.header ?? field, message);
      rowOk = false;
    }
    if (!rowOk || report.errors.some((e) => e.line === line)) return;
    if (imp.validateRow) {
      const merged = existing
        ? { ...(imp.currentValues?.(existing) ?? existing), ...values }
        : values;
      const rowErrors = imp.validateRow(merged, existing);
      for (const { column, message } of rowErrors)
        addError(line, column, message);
      if (rowErrors.length) return;
    }

    const action: ImportAction = !existing
      ? 'create'
      : isUnchanged(values, imp.currentValues?.(existing) ?? existing)
        ? 'unchanged'
        : 'update';
    const label = existing
      ? spec.label(existing)
      : spec.label({ ...values } as unknown as TEntity);
    planned.push({ line, values, existing, action, label });
  });

  for (const row of planned) {
    report[actionCount(row.action)] += 1;
    if (report.rows.length < MAX_ROWS) {
      report.rows.push({
        line: row.line,
        action: row.action,
        label: row.label,
      });
    }
  }
  if (report.errors.length || report.moreErrors || options.dryRun)
    return report;

  await writeRows(ds, spec, imp, planned, options.actorUserId);
  report.written = true;
  return report;
}

function actionCount(
  action: ImportAction,
): 'created' | 'updated' | 'unchanged' {
  return action === 'create'
    ? 'created'
    : action === 'update'
      ? 'updated'
      : 'unchanged';
}

async function writeRows<TEntity extends ObjectLiteral & { id: string }>(
  ds: DataSource,
  spec: TabularSpec<TEntity>,
  imp: ImportSpec<TEntity>,
  planned: PlannedRow<TEntity>[],
  actorUserId: string | null,
): Promise<void> {
  const virtual = new Set(imp.virtualFields ?? []);
  const columnsOf = (values: RowValues): DeepPartial<TEntity> => {
    const plain = Object.fromEntries(
      Object.entries(values).filter(([field]) => !virtual.has(field)),
    );
    return imp.toColumns
      ? imp.toColumns(plain)
      : (plain as DeepPartial<TEntity>);
  };

  await ds.transaction(async (manager) => {
    const repo = manager.getRepository(spec.entity);
    const saved: SavedRow<TEntity>[] = [];
    const audits: Partial<AuditEntry>[] = [];

    const creates = planned.filter((r) => r.action === 'create');
    for (let i = 0; i < creates.length; i += CHUNK) {
      const chunk = creates.slice(i, i + CHUNK);
      const entities = await repo.save(
        chunk.map((r) => repo.create(columnsOf(r.values))),
      );
      entities.forEach((entity, j) => {
        saved.push({ entity, values: chunk[j].values, created: true });
        audits.push({
          actorUserId,
          entityType: spec.entityType,
          entityId: entity.id,
          action: 'create',
          before: null,
          after: snapshot(entity),
          summary: `hat ${spec.noun} «${spec.label(entity)}» per CSV-Import angelegt`,
        });
      });
    }

    for (const row of planned.filter((r) => r.action === 'update')) {
      const entity = row.existing!;
      const before = snapshot(entity);
      const columns = columnsOf(row.values);
      if (Object.keys(columns).length) {
        await repo.update(entity.id, columns as never);
        repo.merge(entity, columns);
      }
      saved.push({ entity, values: row.values, created: false });
      audits.push({
        actorUserId,
        entityType: spec.entityType,
        entityId: entity.id,
        action: 'update',
        before,
        after: snapshot(entity),
        summary: `hat ${spec.noun} «${spec.label(entity)}» per CSV-Import geändert`,
      });
    }

    if (imp.afterSave && saved.length) await imp.afterSave(manager, saved);
    for (let i = 0; i < audits.length; i += CHUNK) {
      await manager.insert(AuditEntry, audits.slice(i, i + CHUNK) as never);
    }
  });
}

/** Compares parsed import values with an existing record; null, undefined and '' are the same, arrays ignore order. */
export function isUnchanged(values: RowValues, current: object): boolean {
  const cur = current as Record<string, unknown>;
  return Object.entries(values).every(([field, value]) =>
    sameValue(value, cur[field]),
  );
}

function sameValue(a: unknown, b: unknown): boolean {
  const blank = (v: unknown) => v === null || v === undefined || v === '';
  if (blank(a) || blank(b)) return blank(a) && blank(b);
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    const sa = a.map(String).sort();
    const sb = b.map(String).sort();
    return sa.every((v, i) => v === sb[i]);
  }
  if (typeof a === 'number' || typeof b === 'number')
    return Number(a) === Number(b);
  if (typeof a === 'boolean' || typeof b === 'boolean') return a === b;
  const text = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));
  return text(a) === text(b);
}
