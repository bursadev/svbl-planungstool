import type { ClassConstructor } from 'class-transformer';
import type {
  DeepPartial,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
} from 'typeorm';
import type { CsvColumn } from './tabular.js';

/** Field values of one import row, keyed by DTO field. */
export type RowValues = Record<string, unknown>;

/** One row the import wrote, handed to `afterSave` for link tables. */
export interface SavedRow<TEntity> {
  entity: TEntity;
  values: RowValues;
  created: boolean;
}

/**
 * Everything the generic CSV template / export / import and the bulk actions
 * need to know about one Stammdaten resource. Each module defines one spec
 * next to its service (`<resource>.tabular.ts`).
 */
export interface TabularSpec<TEntity extends ObjectLiteral & { id: string }> {
  entity: EntityTarget<TEntity>;
  /** `entity_type` of the audit entries, e.g. `location`. */
  entityType: string;
  /** For audit summaries: «hat Standort «Bern» archiviert». */
  noun: string;
  /** File name base: `standorte` → `standorte-2026-10-30.csv`, `standorte-vorlage.csv`. */
  fileName: string;
  columns: CsvColumn[];
  /** Display name of a record in messages and audit summaries. */
  label(entity: TEntity): string;
  /** Column values for archived and restored; omit when the resource cannot be archived. */
  archive?: {
    archived: DeepPartial<TEntity>;
    restored: DeepPartial<TEntity>;
    isArchived(entity: TEntity): boolean;
  };
  /** Omit when the resource is export-only (e.g. Lernende). */
  import?: ImportSpec<TEntity>;
}

export interface ImportSpec<TEntity extends ObjectLiteral & { id: string }> {
  /** Validates new rows (all required fields). */
  createDto: ClassConstructor<object>;
  /** Validates updates of existing rows (usually `PartialType(createDto)`). */
  updateDto: ClassConstructor<object>;
  /** Headers of the key columns, named in the error when a row has no key. */
  keyHeaders: string[];
  /** Natural key of a row's values, normalized; null when the key columns are empty. */
  key(values: RowValues): string | null;
  /** Natural key of an existing record, normalized the same way. */
  entityKey(entity: TEntity): string | null;
  /** Lookup tables for `ref` / `refList` columns: name → (normalized code or name → id). */
  lookups?: Record<
    string,
    (manager: EntityManager) => Promise<Map<string, string>>
  >;
  /** Existing records to match against; defaults to all rows of `entity`. */
  loadExisting?(manager: EntityManager): Promise<TEntity[]>;
  /** Current values in DTO shape for the «unchanged» check; defaults to the entity's own columns. */
  currentValues?(entity: TEntity): RowValues;
  /** Entity columns for DTO values; defaults to the values unchanged. Fields that are not columns (link tables) are dropped by `afterSave`'s caller. */
  toColumns?(values: RowValues): DeepPartial<TEntity>;
  /** DTO fields that are not entity columns (e.g. `skillIds`); kept out of insert/update and handled in `afterSave`. */
  virtualFields?: string[];
  /**
   * Checks across fields of one row that the DTO cannot express (e.g. end before start).
   * Gets the row's values merged over the existing record's current values; returns
   * errors keyed by column header (null for the whole row).
   */
  validateRow?(
    values: RowValues,
    existing: TEntity | undefined,
  ): { column: string | null; message: string }[];
  /** Writes link tables after the rows are saved, inside the same transaction. */
  afterSave?(manager: EntityManager, rows: SavedRow<TEntity>[]): Promise<void>;
}
