import type { ArchiveScope, ListPageParams } from "./api/tabular";

/**
 * The URL parameters every Stammdaten list shares, in German like the filters:
 * `?seite=&proSeite=&sortierung=&richtung=&archiv=`. Server pages read them with
 * `readListParams` and pass the result to the API; the client components in
 * `components/data` write them.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZES = [25, 50, 100, 200] as const;
export const DEFAULT_PAGE_SIZE = 50;

/** Parameters that are not filters: changing them keeps «Filter zurücksetzen» hidden. */
export const NON_FILTER_PARAMS = ["seite", "proSeite", "sortierung", "richtung", "tab"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function first(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/** The API validates ids as UUIDs (400 otherwise); anything else is treated as «Alle». */
export function uuidParam(value: string | string[] | undefined): string | undefined {
  const v = first(value);
  return v && UUID.test(v) ? v : undefined;
}

/** Keeps only values the API accepts; anything else is treated as «Alle» rather than a 400. */
export function oneOf<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  const v = first(value);
  return allowed.includes(v as T) ? (v as T) : undefined;
}

/** `?archiv=archiviert|alle`; without it only active rows are listed. */
export function archiveScope(params: SearchParams): ArchiveScope {
  const value = first(params.archiv);
  return value === "archiviert" ? "archived" : value === "alle" ? "all" : "active";
}

/**
 * Paging, sorting and archive scope from the URL. `sortable` lists the API's sort keys; an
 * unknown `?sortierung=` falls back to the list's default order.
 */
export function readListParams(
  params: SearchParams,
  sortable: readonly string[],
): Required<Pick<ListPageParams, "page" | "pageSize" | "archive">> & Pick<ListPageParams, "sort" | "dir"> {
  const page = Math.max(1, Number.parseInt(first(params.seite) ?? "1", 10) || 1);
  const requested = Number.parseInt(first(params.proSeite) ?? "", 10);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(requested) ? requested : DEFAULT_PAGE_SIZE;
  const sort = oneOf(params.sortierung, sortable);
  const dir = first(params.richtung) === "ab" ? "desc" : "asc";
  return { page, pageSize, sort, dir: sort ? dir : undefined, archive: archiveScope(params) };
}

/** True when any filter parameter (search, selects, archive) is set. */
export function hasFilters(params: SearchParams): boolean {
  return Object.entries(params).some(([key, value]) => !NON_FILTER_PARAMS.includes(key) && first(value) !== undefined);
}
