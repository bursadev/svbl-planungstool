import { apiFetch } from "./client";
import type { DeviceCategory } from "./device-types";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";

export type DeviceMobility = "fixed" | "mobile" | "rental";
export type DeviceStatus = "available" | "maintenance" | "retired";

export type LocationRef = { id: string; code: string; name: string };

/** One row of `GET /devices`. */
export type DeviceRow = {
  id: string;
  inventoryNumber: string;
  deviceType: { id: string; code: string; name: string; category: DeviceCategory };
  homeLocation: LocationRef;
  /** Home location, or the destination of the last move on or before today. */
  currentLocation: LocationRef;
  mobility: DeviceMobility;
  status: DeviceStatus;
  /** Dates as `YYYY-MM-DD`. */
  rentalFrom: string | null;
  rentalUntil: string | null;
  rentalVendor: string | null;
  notes: string | null;
  /** The move with the latest `effectiveOn`, including future ones. */
  lastMove?: { toLocation: LocationRef; effectiveOn: string } | null;
};

/** One Verschiebung; `GET /devices/:id` lists them newest first. */
export type DeviceMove = {
  id: string;
  deviceId: string;
  fromLocationId: string;
  toLocationId: string;
  effectiveOn: string;
  note: string | null;
  fromLocation: LocationRef;
  toLocation: LocationRef;
};

/** One Wartungsfenster; `GET /devices/:id` lists them newest first. */
export type MaintenanceWindow = {
  id: string;
  deviceId: string;
  startsOn: string;
  endsOn: string;
  note: string | null;
};

/** `GET /devices/:id`: the row plus notes, moves and maintenance windows. */
export type DeviceDetail = DeviceRow & {
  moves: DeviceMove[];
  maintenanceWindows: MaintenanceWindow[];
};

/**
 * Filters of `GET /devices` and its CSV export. `q` matches inventory number, type, home location,
 * vendor and notes; `archive` hides (`active`) or shows only (`archived`) retired devices.
 */
export type DeviceFilters = ListPageParams & {
  q?: string;
  deviceTypeId?: string;
  /** Devices whose home location this is. */
  locationId?: string;
  mobility?: DeviceMobility;
  status?: DeviceStatus;
};

export type CreateDevice = {
  deviceTypeId: string;
  inventoryNumber: string;
  homeLocationId: string;
  mobility?: DeviceMobility;
  status?: DeviceStatus;
  rentalFrom?: string | null;
  rentalUntil?: string | null;
  rentalVendor?: string | null;
  notes?: string | null;
};

export type UpdateDevice = Partial<CreateDevice>;

export type CreateDeviceMove = {
  toLocationId: string;
  effectiveOn: string;
  note?: string | null;
};

export type CreateMaintenanceWindow = {
  startsOn: string;
  endsOn: string;
  note?: string | null;
};

export type UpdateMaintenanceWindow = Partial<CreateMaintenanceWindow>;

export const DEVICES_PATH = "/devices";

/**
 * Geräte sorted by inventory number, all of them unless `page` is set. Defaults to the browser
 * client; Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listDevices(filters: DeviceFilters = {}, fetcher: ApiFetcher = apiFetch): Promise<DeviceRow[]> {
  return fetcher<DeviceRow[]>(withQuery(DEVICES_PATH, filters));
}

/** One page of Geräte with the total number of matches. */
export function listDevicesPage(filters: DeviceFilters, fetcher: ApiFetcher = apiFetch): Promise<Page<DeviceRow>> {
  return fetchPage<DeviceRow>(withQuery(DEVICES_PATH, filters), fetcher);
}

/** Devices whose home location is the given Standort. */
export function listDevicesAtLocation(locationId: string, fetcher: ApiFetcher = apiFetch): Promise<DeviceRow[]> {
  return listDevices({ locationId }, fetcher);
}

/** One Gerät with its moves and maintenance windows; throws `ApiError` 404 when it does not exist. */
export function getDevice(id: string, fetcher: ApiFetcher = apiFetch): Promise<DeviceDetail> {
  return fetcher<DeviceDetail>(`/devices/${encodeURIComponent(id)}`);
}

export function createDevice(dto: CreateDevice, fetcher: ApiFetcher = apiFetch): Promise<DeviceDetail> {
  return fetcher<DeviceDetail>("/devices", { method: "POST", body: dto });
}

export function updateDevice(id: string, dto: UpdateDevice, fetcher: ApiFetcher = apiFetch): Promise<DeviceDetail> {
  return fetcher<DeviceDetail>(`/devices/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; moves and maintenance windows go with the device. */
export function deleteDevice(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/devices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Records a Verschiebung; returns the updated detail. 409 for a fixed device, 400 when the device
 * is already at the destination on that date.
 */
export function addDeviceMove(
  deviceId: string,
  dto: CreateDeviceMove,
  fetcher: ApiFetcher = apiFetch,
): Promise<DeviceDetail> {
  return fetcher<DeviceDetail>(`/devices/${encodeURIComponent(deviceId)}/moves`, { method: "POST", body: dto });
}

export function deleteDeviceMove(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/device-moves/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function addMaintenanceWindow(
  deviceId: string,
  dto: CreateMaintenanceWindow,
  fetcher: ApiFetcher = apiFetch,
): Promise<MaintenanceWindow> {
  return fetcher<MaintenanceWindow>(`/devices/${encodeURIComponent(deviceId)}/maintenance-windows`, {
    method: "POST",
    body: dto,
  });
}

export function updateMaintenanceWindow(
  id: string,
  dto: UpdateMaintenanceWindow,
  fetcher: ApiFetcher = apiFetch,
): Promise<MaintenanceWindow> {
  return fetcher<MaintenanceWindow>(`/maintenance-windows/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

export function deleteMaintenanceWindow(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/maintenance-windows/${encodeURIComponent(id)}`, { method: "DELETE" });
}
