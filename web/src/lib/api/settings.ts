import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";

/** One application-wide configuration value, addressed by key. */
export type Setting = {
  key: string;
  value: unknown;
  /** ISO timestamp of the last change. */
  updatedAt: string;
  /** Display name of the user who last set it; null for seeded values. */
  updatedBy: string | null;
};

/**
 * All settings sorted by key (planners and admins only). Defaults to the browser client;
 * Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listSettings(fetcher: ApiFetcher = apiFetch): Promise<Setting[]> {
  return fetcher<Setting[]>("/settings");
}

/** Admin only: creates or replaces the value of one key. */
export function upsertSetting(key: string, value: unknown, fetcher: ApiFetcher = apiFetch): Promise<Setting> {
  return fetcher<Setting>(`/settings/${encodeURIComponent(key)}`, { method: "PUT", body: { value } });
}

/** Admin only; removing an unknown key is a no-op. */
export function deleteSetting(key: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
}
