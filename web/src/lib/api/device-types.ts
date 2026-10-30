import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";

export type DeviceCategory = "forklift" | "aerial_platform" | "crane" | "other";

/** `GET /device-types`: sorted by code, with the Zertifikatstypen and Skills that qualify for the type. */
export type DeviceType = {
  id: string;
  code: string;
  name: string;
  category: DeviceCategory;
  active: boolean;
  qualifications: {
    certificateTypes: { id: string; code: string; name: string }[];
    skills: { id: string; name: string }[];
  };
};

export type CreateDeviceType = {
  code: string;
  name: string;
  category: DeviceCategory;
  active?: boolean;
};

export type UpdateDeviceType = Partial<CreateDeviceType>;

export function listDeviceTypes(fetcher: ApiFetcher = apiFetch): Promise<DeviceType[]> {
  return fetcher<DeviceType[]>("/device-types");
}

/** Filters of `GET /device-types` and its CSV export; `q` matches code and name. */
export type DeviceTypeFilters = ListPageParams & { q?: string };

export const DEVICE_TYPES_PATH = "/device-types";

/** Gerätetypen matching the filters with the total (all rows unless `page` is set). */
export function listDeviceTypesPage(
  filters: DeviceTypeFilters,
  fetcher: ApiFetcher = apiFetch,
): Promise<Page<DeviceType>> {
  return fetchPage<DeviceType>(withQuery(DEVICE_TYPES_PATH, filters), fetcher);
}

export function createDeviceType(dto: CreateDeviceType, fetcher: ApiFetcher = apiFetch): Promise<DeviceType> {
  return fetcher<DeviceType>("/device-types", { method: "POST", body: dto });
}

export function updateDeviceType(
  id: string,
  dto: UpdateDeviceType,
  fetcher: ApiFetcher = apiFetch,
): Promise<DeviceType> {
  return fetcher<DeviceType>(`/device-types/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; the backend answers 409 with a message while the Gerätetyp is still referenced. */
export function deleteDeviceType(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/device-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Replaces the Zertifikatstypen and Skills that qualify for the Gerätetyp. */
export function replaceDeviceTypeQualifications(
  id: string,
  qualifications: { certificateTypeIds: string[]; skillIds: string[] },
  fetcher: ApiFetcher = apiFetch,
): Promise<DeviceType> {
  return fetcher<DeviceType>(`/device-types/${encodeURIComponent(id)}/qualifications`, {
    method: "PUT",
    body: qualifications,
  });
}
