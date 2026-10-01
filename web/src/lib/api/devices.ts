import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";

export type DeviceMobility = "fixed" | "mobile" | "rental";
export type DeviceStatus = "available" | "maintenance" | "retired";

export type LocationRef = { id: string; code: string; name: string };

/** One row of `GET /devices`; the Geräte slice adds the detail shape. */
export type DeviceRow = {
  id: string;
  inventoryNumber: string;
  deviceType: { id: string; code: string; name: string; category: string };
  homeLocation: LocationRef;
  /** Home location, or the destination of the last move on or before today. */
  currentLocation: LocationRef;
  mobility: DeviceMobility;
  status: DeviceStatus;
  rentalFrom: string | null;
  rentalUntil: string | null;
  rentalVendor: string | null;
  lastMove?: { toLocation: LocationRef; effectiveOn: string } | null;
};

export type DeviceFilters = {
  deviceTypeId?: string;
  /** Devices whose home location this is. */
  locationId?: string;
  mobility?: DeviceMobility;
  status?: DeviceStatus;
};

export function listDevices(filters: DeviceFilters = {}, fetcher: ApiFetcher = apiFetch): Promise<DeviceRow[]> {
  return fetcher<DeviceRow[]>(withQuery("/devices", filters));
}

/** Devices whose home location is the given Standort. */
export function listDevicesAtLocation(locationId: string, fetcher: ApiFetcher = apiFetch): Promise<DeviceRow[]> {
  return listDevices({ locationId }, fetcher);
}
