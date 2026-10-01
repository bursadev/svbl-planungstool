import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";

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
