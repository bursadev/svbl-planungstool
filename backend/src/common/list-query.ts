import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { Response } from 'express';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/** Which rows a list shows with regard to archiving; absent means all (existing callers, dropdowns). */
export enum ArchiveScope {
  Active = 'active',
  Archived = 'archived',
  All = 'all',
}

/**
 * Query parameters every paged Stammdaten list accepts on top of its own
 * filters. Without `page` the list returns every row (dropdowns, export).
 */
export class ListPageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize?: number;

  /** One of the list's sortable keys; unknown keys fall back to the default order. */
  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  dir?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(ArchiveScope)
  archive?: ArchiveScope;
}

/** Body of `POST /<resource>/import`. */
export class CsvImportDto {
  @IsString()
  @MaxLength(10_000_000)
  csv: string;
}

/** `?dryRun=false` writes; anything else (default) only checks. */
export function isDryRun(value: string | undefined): boolean {
  return value !== 'false';
}

/**
 * Search where every word has to match at least one of the expressions,
 * ignoring case and accents: «zurich bahnhof» finds «Bahnhofstrasse, Zürich».
 * Expressions are query-builder paths (`l.name`) or SQL over them.
 */
export function applySearch<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  expressions: string[],
  q: string | undefined,
): void {
  const words = (q ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 8);
  words.forEach((word, i) => {
    const param = `search${i}`;
    const any = expressions
      // `CAST(… AS text)` rather than `::text`: TypeORM only rewrites `alias.property`
      // to the column name when a space, comma or parenthesis follows it.
      .map(
        (e) =>
          `unaccent(coalesce(CAST(${e} AS text), '')) ILIKE unaccent(:${param})`,
      )
      .join(' OR ');
    qb.andWhere(`(${any})`, {
      [param]: `%${word.replace(/[\\%_]/g, '\\$&')}%`,
    });
  });
}

/** Restricts to active or archived rows; `active` is the SQL condition for «not archived». */
export function applyArchive<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  scope: ArchiveScope | undefined,
  active: string,
): void {
  if (scope === ArchiveScope.Active) qb.andWhere(`(${active})`);
  else if (scope === ArchiveScope.Archived) qb.andWhere(`NOT (${active})`);
}

/**
 * Orders by the requested sortable key (or the default) and applies the page.
 * `sortable` maps the public sort keys to query-builder paths; ties are
 * broken by `tieBreaker` so pages are stable.
 */
export async function pageOf<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: ListPageQuery,
  sortable: Record<string, string>,
  defaultSort: string,
  tieBreaker: string,
): Promise<Page<T>> {
  const key = query.sort && sortable[query.sort] ? query.sort : defaultSort;
  const dir = query.dir === 'desc' ? 'DESC' : 'ASC';
  const path = sortable[key];
  if (isTextColumn(qb, path)) {
    // The database collation is byte order (C.UTF-8), which puts «Ä» after «Z»;
    // sort text with the Swiss German ICU collation instead.
    qb.addSelect(`${path} COLLATE "de-CH-x-icu"`, 'list_sort');
    qb.orderBy('list_sort', dir, 'NULLS LAST');
  } else {
    qb.orderBy(path, dir, 'NULLS LAST');
  }
  qb.addOrderBy(tieBreaker, 'ASC');
  if (query.page) {
    const size = query.pageSize ?? 50;
    qb.skip((query.page - 1) * size).take(size);
  }
  const [items, total] = await qb.getManyAndCount();
  return { items, total };
}

/** Whether `alias.property` names a text column of an entity joined into the query. */
function isTextColumn<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  path: string,
): boolean {
  const match = /^(\w+)\.(\w+)$/.exec(path);
  if (!match) return false;
  const alias = qb.expressionMap.aliases.find((a) => a.name === match[1]);
  if (!alias?.hasMetadata) return false;
  const column = alias.metadata.findColumnWithPropertyPath(match[2]);
  return (
    !!column &&
    ['text', 'varchar', 'character varying', String].includes(
      column.type as never,
    )
  );
}

export interface Page<T> {
  items: T[];
  total: number;
}

/** Sets `X-Total-Count` and returns the items; the body stays a plain array. */
export function sendPage<T>(res: Response, page: Page<T>): T[] {
  res.setHeader('X-Total-Count', String(page.total));
  return page.items;
}
