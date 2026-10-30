import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";
import type { Language, Track } from "../format";

export type CourseKind = "uk" | "adult" | "exam";
export type WeekdayRule = "weekdays" | "saturday";

export type RequiredSkill = { id: string; name: string };
export type RequiredCertificate = { id: string; code: string; name: string };
export type RequiredDevice = {
  deviceType: { id: string; code: string; name: string };
  quantity: number;
};

/** The ÜK-Modul slot a course type fills in the Bildungsplan, if any. */
export type CourseTypeModuleRef = {
  id: string;
  track: Track;
  semester: number;
  sequence: number;
};

/** `GET /course-types` and `GET /course-types/:id`: the type with its requirements and curriculum slot. */
export type CourseType = {
  id: string;
  code: string;
  name: string;
  kind: CourseKind;
  /** Only ÜK types belong to a Lehrgang. */
  track: Track | null;
  durationDays: number;
  maySpanWeeks: boolean;
  weekdayRule: WeekdayRule;
  languages: Language[];
  minParticipants: number | null;
  maxParticipants: number;
  description: string | null;
  published: boolean;
  active: boolean;
  requiredSkills: RequiredSkill[];
  requiredCertificates: RequiredCertificate[];
  requiredDevices: RequiredDevice[];
  curriculumModule: CourseTypeModuleRef | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCourseType = {
  code: string;
  name: string;
  kind: CourseKind;
  track?: Track | null;
  durationDays: number;
  maySpanWeeks?: boolean;
  weekdayRule?: WeekdayRule;
  languages: Language[];
  minParticipants?: number | null;
  maxParticipants: number;
  description?: string | null;
  published?: boolean;
  active?: boolean;
};

export type UpdateCourseType = Partial<CreateCourseType>;

/** `PUT /course-types/:id/requirements` replaces all three sets at once. */
export type ReplaceRequirements = {
  skillIds: string[];
  certificateTypeIds: string[];
  devices: { deviceTypeId: string; quantity: number }[];
};

/** Filters of `GET /course-types` and its CSV export; `q` matches code, name and description. */
export type CourseTypeFilters = ListPageParams & {
  q?: string;
  kind?: CourseKind;
  /** `none`: types without a Lehrgang. */
  track?: Track | "none";
  /** Types offered in this language. */
  language?: Language;
};

export const COURSE_TYPES_PATH = "/course-types";

/** The filters as API query parameters (also for «Gefilterte Ansicht exportieren»). */
export function courseTypeQuery(filters: CourseTypeFilters = {}): Record<string, string | number | undefined> {
  return { ...filters };
}

/**
 * All Kurstypen sorted by code, archived ones included. Server Components pass `serverApiFetch`
 * from `@/lib/api/server`.
 */
export function listCourseTypes(fetcher: ApiFetcher = apiFetch): Promise<CourseType[]> {
  return fetcher<CourseType[]>(COURSE_TYPES_PATH);
}

/** One page of Kurstypen with the total number of matches. */
export function listCourseTypesPage(
  filters: CourseTypeFilters,
  fetcher: ApiFetcher = apiFetch,
): Promise<Page<CourseType>> {
  return fetchPage<CourseType>(withQuery(COURSE_TYPES_PATH, courseTypeQuery(filters)), fetcher);
}

export function getCourseType(id: string, fetcher: ApiFetcher = apiFetch): Promise<CourseType> {
  return fetcher<CourseType>(`/course-types/${encodeURIComponent(id)}`);
}

export function createCourseType(dto: CreateCourseType, fetcher: ApiFetcher = apiFetch): Promise<CourseType> {
  return fetcher<CourseType>("/course-types", { method: "POST", body: dto });
}

export function updateCourseType(
  id: string,
  dto: UpdateCourseType,
  fetcher: ApiFetcher = apiFetch,
): Promise<CourseType> {
  return fetcher<CourseType>(`/course-types/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while courses or modules still reference the type. */
export function deleteCourseType(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/course-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function replaceCourseTypeRequirements(
  id: string,
  dto: ReplaceRequirements,
  fetcher: ApiFetcher = apiFetch,
): Promise<CourseType> {
  return fetcher<CourseType>(`/course-types/${encodeURIComponent(id)}/requirements`, {
    method: "PUT",
    body: dto,
  });
}
