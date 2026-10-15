import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";
import type { Language } from "../format";
import type { UserRole } from "../roles";

export type UserStatus = "active" | "disabled";

/** One row of `GET /users` (planners and admins only), sorted by display name. */
export type UserRow = {
  id: string;
  email: string;
  displayName: string;
  /** Mirrored from Clerk, where roles are defined and assigned. */
  role: UserRole;
  locale: Language;
  status: UserStatus;
  /** ISO timestamp of the last sign-in; null before the first one. */
  lastLoginAt: string | null;
  instructor: { id: string; firstName: string; lastName: string } | null;
  trainer: { id: string; firstName: string; lastName: string } | null;
};

/** What an admin may change; the role lives in Clerk and is read-only here. */
export type UpdateUser = {
  status?: UserStatus;
  instructorId?: string | null;
  trainerId?: string | null;
};

/**
 * Benutzerkonten (the Clerk mirror) sorted by display name. Defaults to the browser client;
 * Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listUsers(fetcher: ApiFetcher = apiFetch): Promise<UserRow[]> {
  return fetcher<UserRow[]>("/users");
}

/** Admin only: status and the links to Ausbilder / Berufsbildner. */
export function updateUser(id: string, dto: UpdateUser, fetcher: ApiFetcher = apiFetch): Promise<UserRow> {
  return fetcher<UserRow>(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}
