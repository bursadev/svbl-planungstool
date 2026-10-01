import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";

/** `GET /me`: the signed-in user as the backend sees them. */
export type Me = {
  userId: string;
  role: string;
  email?: string;
  displayName?: string;
};

/**
 * Loads the current user. Defaults to the browser client; Server Components pass
 * `serverApiFetch` from `@/lib/api/server`.
 */
export function getMe(fetcher: ApiFetcher = apiFetch): Promise<Me> {
  return fetcher<Me>("/me");
}
