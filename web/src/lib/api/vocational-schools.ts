import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";
import type { Language, Track } from "../format";

/** One school day of a class in one school year. */
export type SchoolClassDay = {
  id: string;
  /** Year in which the school year starts (August): 2026 for 2026/27. */
  schoolYearStart: number;
  /** ISO weekday, 1 = Montag … 7 = Sonntag. */
  weekday: number;
  evening: boolean;
};

export type SchoolClass = {
  id: string;
  code: string;
  track: Track;
  startYear: number;
  active: boolean;
  /** Sorted by school year, then weekday. */
  days: SchoolClassDay[];
  /** Active apprentices in this class. */
  apprenticeCount: number;
};

/** `GET /vocational-schools` and `GET /vocational-schools/:id`; both include the classes. */
export type VocationalSchool = {
  id: string;
  name: string;
  shortName: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  canton: string | null;
  /** Language of instruction; becomes the default course language of its apprentices. */
  language: Language;
  /** The ÜK-Standort the school's apprentices are planned at. */
  nearestLocation: { id: string; code: string; name: string };
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  /** Sorted by start year (newest first), then code. */
  classes: SchoolClass[];
  /** Active apprentices at this school. */
  apprenticeCount: number;
};

export type CreateVocationalSchool = {
  name: string;
  shortName: string;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  canton?: string | null;
  language: Language;
  nearestLocationId: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  active?: boolean;
};

export type UpdateVocationalSchool = Partial<CreateVocationalSchool>;

export type CreateSchoolClass = {
  code: string;
  track: Track;
  /** 2000–2100. */
  startYear: number;
  active?: boolean;
};

export type UpdateSchoolClass = Partial<CreateSchoolClass>;

/** `PUT /school-classes/:id/days`: replaces the days of one school year, other years stay. */
export type ReplaceSchoolClassDays = {
  schoolYearStart: number;
  days: { weekday: number; evening?: boolean }[];
};

/**
 * Berufsschulen sorted by name, each with its classes. Defaults to the browser client;
 * Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listVocationalSchools(fetcher: ApiFetcher = apiFetch): Promise<VocationalSchool[]> {
  return fetcher<VocationalSchool[]>("/vocational-schools");
}

/** One Berufsschule with its classes; throws `ApiError` 404 when it does not exist. */
export function getVocationalSchool(id: string, fetcher: ApiFetcher = apiFetch): Promise<VocationalSchool> {
  return fetcher<VocationalSchool>(`/vocational-schools/${encodeURIComponent(id)}`);
}

export function createVocationalSchool(
  dto: CreateVocationalSchool,
  fetcher: ApiFetcher = apiFetch,
): Promise<VocationalSchool> {
  return fetcher<VocationalSchool>("/vocational-schools", { method: "POST", body: dto });
}

export function updateVocationalSchool(
  id: string,
  dto: UpdateVocationalSchool,
  fetcher: ApiFetcher = apiFetch,
): Promise<VocationalSchool> {
  return fetcher<VocationalSchool>(`/vocational-schools/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while classes or apprentices still reference the school. */
export function deleteVocationalSchool(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/vocational-schools/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** 409 when the code already exists at that school. */
export function createSchoolClass(
  schoolId: string,
  dto: CreateSchoolClass,
  fetcher: ApiFetcher = apiFetch,
): Promise<SchoolClass> {
  return fetcher<SchoolClass>(`/vocational-schools/${encodeURIComponent(schoolId)}/classes`, {
    method: "POST",
    body: dto,
  });
}

export function updateSchoolClass(
  id: string,
  dto: UpdateSchoolClass,
  fetcher: ApiFetcher = apiFetch,
): Promise<SchoolClass> {
  return fetcher<SchoolClass>(`/school-classes/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while apprentices still reference the class. */
export function deleteSchoolClass(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/school-classes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Replaces the school days of one school year; returns the class with all its days. */
export function replaceSchoolClassDays(
  id: string,
  dto: ReplaceSchoolClassDays,
  fetcher: ApiFetcher = apiFetch,
): Promise<SchoolClass> {
  return fetcher<SchoolClass>(`/school-classes/${encodeURIComponent(id)}/days`, { method: "PUT", body: dto });
}
