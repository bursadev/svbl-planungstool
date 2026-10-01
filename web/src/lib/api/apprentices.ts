import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import type { Language, Track } from "../format";

export type ApprenticeStatus = "active" | "finished" | "dropped";
export type Gender = "m" | "f" | "other";

/** One row of `GET /apprentices`. */
export type ApprenticeRow = {
  id: string;
  firstName: string;
  lastName: string;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  track: Track;
  language: Language;
  status: ApprenticeStatus;
  cohort: { id: string; label: string };
  vocationalSchool: { id: string; shortName: string; name: string };
  schoolClass: { id: string; code: string } | null;
  trainingCompany: { id: string; name: string } | null;
};

/** `GET /apprentices/:id`: the row plus the Stammdaten from the school export. */
export type Apprentice = ApprenticeRow & {
  /** Only planners and admins see it; `null` for every other role. */
  ahvNumber: string | null;
  externalId: string | null;
  gender: Gender | null;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  nativeLanguage: string | null;
  professionCode: string | null;
  /** `YYYY-MM-DD`. */
  apprenticeshipStart: string | null;
  /** `YYYY-MM-DD`. */
  apprenticeshipEnd: string | null;
  hasBm1: boolean;
  trainer: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  importBatchId: string | null;
  /** ISO timestamp of the import that created or last updated the record. */
  importedAt: string | null;
};

export type ApprenticeFilters = {
  /** Matches first or last name. */
  q?: string;
  vocationalSchoolId?: string;
  cohortId?: string;
  track?: Track;
};

/**
 * Lernende sorted by last name, then first name. Defaults to the browser client; Server
 * Components pass `serverApiFetch` from `@/lib/api/server`. Read-only: the school export is the source.
 */
export function listApprentices(
  filters: ApprenticeFilters = {},
  fetcher: ApiFetcher = apiFetch,
): Promise<ApprenticeRow[]> {
  return fetcher<ApprenticeRow[]>(withQuery("/apprentices", filters));
}

/** One Lernende/r with all Stammdaten; throws `ApiError` 404 when the id does not exist. */
export function getApprentice(id: string, fetcher: ApiFetcher = apiFetch): Promise<Apprentice> {
  return fetcher<Apprentice>(`/apprentices/${encodeURIComponent(id)}`);
}

/** Jahrgang as the Lernende filters need it; the Bildungsplan slice owns the full shape. */
export type CohortOption = {
  id: string;
  label: string;
  track: Track;
  startYear: number;
};

/** `GET /cohorts`, newest start year first. */
export function listCohortOptions(fetcher: ApiFetcher = apiFetch): Promise<CohortOption[]> {
  return fetcher<CohortOption[]>("/cohorts");
}
