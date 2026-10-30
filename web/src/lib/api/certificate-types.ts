import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";

/** Minimal Kurstyp for pickers; the full type lives in `lib/api/course-types.ts`. */
export type MaintenanceCourseType = { id: string; code: string; name: string };

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
  /** False once archived: hidden from the list by default and from pickers. */
  active: boolean;
  maintenanceCourseTypes: MaintenanceCourseType[];
};

export type CreateCertificateType = {
  code: string;
  name: string;
  issuer?: string | null;
  validityYears?: number | null;
  warningLeadDays?: number;
  maintenanceMinPerYear?: number | null;
  active?: boolean;
};

export type UpdateCertificateType = Partial<CreateCertificateType>;

export function listCertificateTypes(fetcher: ApiFetcher = apiFetch): Promise<CertificateType[]> {
  return fetcher<CertificateType[]>("/certificate-types");
}

/** Filters of `GET /certificate-types` and its CSV export; `q` matches code, name and issuer. */
export type CertificateTypeFilters = ListPageParams & { q?: string };

export const CERTIFICATE_TYPES_PATH = "/certificate-types";

/** Zertifikatstypen matching the filters with the total (all rows unless `page` is set). */
export function listCertificateTypesPage(
  filters: CertificateTypeFilters,
  fetcher: ApiFetcher = apiFetch,
): Promise<Page<CertificateType>> {
  return fetchPage<CertificateType>(withQuery(CERTIFICATE_TYPES_PATH, filters), fetcher);
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

