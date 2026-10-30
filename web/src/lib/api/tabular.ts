import { getAuthToken } from "./auth-token";
import { apiFetch } from "./client";
import { API_BASE_URL, ApiError, type ApiFetcher } from "./request";

/**
 * Shared pieces of the Stammdaten lists: paged reads, CSV template / export / import and bulk
 * actions. Every resource exposes the same routes under its base path (e.g. `/locations`).
 */

/** Which rows a list shows with regard to archiving; the API returns all rows without it. */
export type ArchiveScope = "active" | "archived" | "all";

/** Paging, sorting and archive scope every paged list accepts on top of its own filters. */
export type ListPageParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: "asc" | "desc";
  archive?: ArchiveScope;
};

export type Page<T> = { items: T[]; total: number };

/** Reads a list together with its `X-Total-Count`; without `page` the total is the row count. */
export async function fetchPage<T>(path: string, fetcher: ApiFetcher): Promise<Page<T>> {
  let total: number | null = null;
  const items = await fetcher<T[]>(path, {
    onResponse: (res) => {
      const header = res.headers.get("X-Total-Count");
      total = header === null ? null : Number(header);
    },
  });
  return { items, total: total ?? items.length };
}

export type ImportAction = "create" | "update" | "unchanged";

/** Answer of `POST /<resource>/import`, for the dry run and the real run alike. */
export type ImportReport = {
  dryRun: boolean;
  written: boolean;
  total: number;
  created: number;
  updated: number;
  unchanged: number;
  /** Line 1 is the header row, the first data row is line 2. */
  errors: { line: number; column: string | null; message: string }[];
  moreErrors: number;
  rows: { line: number; action: ImportAction; label: string }[];
};

export type BulkAction = "archive" | "restore" | "delete";

export type BulkResult = {
  succeeded: string[];
  failed: { id: string; label: string; message: string }[];
};

/** Checks (`dryRun`) or writes a CSV file; the backend writes nothing while any row has an error. */
export function importCsv(
  basePath: string,
  csv: string,
  dryRun: boolean,
  fetcher: ApiFetcher = apiFetch,
): Promise<ImportReport> {
  return fetcher<ImportReport>(`${basePath}/import?dryRun=${dryRun}`, { method: "POST", body: { csv } });
}

export function bulkAction(
  basePath: string,
  action: BulkAction,
  ids: string[],
  fetcher: ApiFetcher = apiFetch,
): Promise<BulkResult> {
  return fetcher<BulkResult>(`${basePath}/bulk`, { method: "POST", body: { action, ids } });
}

/**
 * Downloads a CSV from the API in the browser: the request needs the bearer token, so a plain link
 * would not do. The file name comes from the response's `Content-Disposition`.
 */
export async function downloadCsv(path: string): Promise<void> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, data?.message ?? res.statusText);
  }
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "export.csv";
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Reads an uploaded CSV as text. Excel's «CSV UTF-8» is UTF-8; its plain «CSV» on Swiss Windows
 * is Windows-1252, which would garble umlauts if read as UTF-8, so that is the fallback.
 */
export async function readCsvFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
