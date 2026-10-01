import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import type { Track } from "../format";

export type CourseTypeRef = { id: string; code: string; name: string; durationDays: number };

/** `GET /curriculum-modules`: one ÜK-Modul of a Lehrgang, ordered by track, semester, sequence. */
export type CurriculumModule = {
  id: string;
  track: Track;
  /** 1–6 */
  semester: number;
  sequence: number;
  active: boolean;
  courseType: CourseTypeRef;
  /** Modules of the same track that must be attended first; `code` is the course type's code. */
  prerequisites: { id: string; code: string; name: string }[];
};

export type CreateCurriculumModule = {
  track: Track;
  courseTypeId: string;
  semester: number;
  sequence: number;
  active?: boolean;
  prerequisiteModuleIds?: string[];
};

/** `prerequisiteModuleIds` replaces the whole set when present. */
export type UpdateCurriculumModule = Partial<CreateCurriculumModule>;

/** `GET /cohorts`: Jahrgänge, newest first. */
export type Cohort = {
  id: string;
  track: Track;
  startYear: number;
  label: string;
  expectedEndYear: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCohort = {
  track: Track;
  /** 2000–2100 */
  startYear: number;
  label: string;
  expectedEndYear?: number | null;
};

export type UpdateCohort = Partial<CreateCohort>;

/** `GET /time-windows`: when a cohort attends a module, ordered by `startsOn`. */
export type TimeWindow = {
  id: string;
  curriculumModule: {
    id: string;
    semester: number;
    sequence: number;
    courseType: CourseTypeRef;
  };
  cohort: { id: string; label: string; track: Track; startYear: number };
  /** ISO date `YYYY-MM-DD`. */
  startsOn: string;
  endsOn: string;
  /** `null` means the window applies at every Standort. */
  location: { id: string; code: string; name: string } | null;
  note: string | null;
};

export type CreateTimeWindow = {
  curriculumModuleId: string;
  cohortId: string;
  startsOn: string;
  endsOn: string;
  locationId?: string | null;
  note?: string | null;
};

export type UpdateTimeWindow = Partial<CreateTimeWindow>;

// --- Modules --------------------------------------------------------------------------------

export function listCurriculumModules(track?: Track, fetcher: ApiFetcher = apiFetch): Promise<CurriculumModule[]> {
  return fetcher<CurriculumModule[]>(withQuery("/curriculum-modules", { track }));
}

export function createCurriculumModule(
  dto: CreateCurriculumModule,
  fetcher: ApiFetcher = apiFetch,
): Promise<CurriculumModule> {
  return fetcher<CurriculumModule>("/curriculum-modules", { method: "POST", body: dto });
}

export function updateCurriculumModule(
  id: string,
  dto: UpdateCurriculumModule,
  fetcher: ApiFetcher = apiFetch,
): Promise<CurriculumModule> {
  return fetcher<CurriculumModule>(`/curriculum-modules/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

export function deleteCurriculumModule(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/curriculum-modules/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Cohorts --------------------------------------------------------------------------------

export function listCohorts(fetcher: ApiFetcher = apiFetch): Promise<Cohort[]> {
  return fetcher<Cohort[]>("/cohorts");
}

export function createCohort(dto: CreateCohort, fetcher: ApiFetcher = apiFetch): Promise<Cohort> {
  return fetcher<Cohort>("/cohorts", { method: "POST", body: dto });
}

export function updateCohort(id: string, dto: UpdateCohort, fetcher: ApiFetcher = apiFetch): Promise<Cohort> {
  return fetcher<Cohort>(`/cohorts/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

export function deleteCohort(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/cohorts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Time windows ---------------------------------------------------------------------------

export function listTimeWindows(cohortId?: string, fetcher: ApiFetcher = apiFetch): Promise<TimeWindow[]> {
  return fetcher<TimeWindow[]>(withQuery("/time-windows", { cohortId }));
}

export function createTimeWindow(dto: CreateTimeWindow, fetcher: ApiFetcher = apiFetch): Promise<TimeWindow> {
  return fetcher<TimeWindow>("/time-windows", { method: "POST", body: dto });
}

export function updateTimeWindow(
  id: string,
  dto: UpdateTimeWindow,
  fetcher: ApiFetcher = apiFetch,
): Promise<TimeWindow> {
  return fetcher<TimeWindow>(`/time-windows/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

export function deleteTimeWindow(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/time-windows/${encodeURIComponent(id)}`, { method: "DELETE" });
}
