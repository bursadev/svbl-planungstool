import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";

/** Minimal Kurstyp for pickers; the full type lives in `lib/api/course-types.ts`. */
export type CourseTypeRef = { id: string; code: string; name: string };

/** `GET /certificate-types`: sorted by code, with the Kurstypen that count as Qualifikationspflege. */
export type CertificateType = {
  id: string;
  code: string;
  name: string;
  issuer: string | null;
  /** `null` = läuft nicht ab. */
  validityYears: number | null;
  warningLeadDays: number;
  /** Required maintenance courses per year; `null` = keine Pflege. */
  maintenanceMinPerYear: number | null;
  maintenanceCourseTypes: CourseTypeRef[];
};

export type CreateCertificateType = {
  code: string;
  name: string;
  issuer?: string | null;
  validityYears?: number | null;
  warningLeadDays?: number;
  maintenanceMinPerYear?: number | null;
};

export type UpdateCertificateType = Partial<CreateCertificateType>;

export function listCertificateTypes(fetcher: ApiFetcher = apiFetch): Promise<CertificateType[]> {
  return fetcher<CertificateType[]>("/certificate-types");
}

export function createCertificateType(
  dto: CreateCertificateType,
  fetcher: ApiFetcher = apiFetch,
): Promise<CertificateType> {
  return fetcher<CertificateType>("/certificate-types", { method: "POST", body: dto });
}

export function updateCertificateType(
  id: string,
  dto: UpdateCertificateType,
  fetcher: ApiFetcher = apiFetch,
): Promise<CertificateType> {
  return fetcher<CertificateType>(`/certificate-types/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; the backend answers 409 with a message while the Zertifikatstyp is still referenced. */
export function deleteCertificateType(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/certificate-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Replaces the Kurstypen that count as Qualifikationspflege for the Zertifikatstyp. */
export function replaceMaintenanceCourseTypes(
  id: string,
  courseTypeIds: string[],
  fetcher: ApiFetcher = apiFetch,
): Promise<CertificateType> {
  return fetcher<CertificateType>(`/certificate-types/${encodeURIComponent(id)}/maintenance-course-types`, {
    method: "PUT",
    body: { courseTypeIds },
  });
}

/** Kurstypen for the Pflichtkurse picker; only id, code and name are read from `GET /course-types`. */
export function listCourseTypeRefs(fetcher: ApiFetcher = apiFetch): Promise<CourseTypeRef[]> {
  return fetcher<CourseTypeRef[]>("/course-types");
}
