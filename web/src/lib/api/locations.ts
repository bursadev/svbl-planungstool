import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import type { Language } from "../format";

export type LocationKind = "training_centre" | "customer_site";
export type RoomKind = "theory" | "practice_hall" | "outdoor";

export type Room = {
  id: string;
  locationId: string;
  name: string;
  kind: RoomKind;
  capacity: number | null;
  active: boolean;
};

/** `GET /locations` and `GET /locations/:id`; both include the rooms sorted by name. */
export type Location = {
  id: string;
  code: string;
  name: string;
  kind: LocationKind;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  canton: string | null;
  languageRegion: Language;
  hostsUk: boolean;
  parallelCourseCapacity: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  customerId: string | null;
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
};

export type CreateLocation = {
  code: string;
  name: string;
  kind: LocationKind;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  canton?: string | null;
  languageRegion: Language;
  hostsUk?: boolean;
  parallelCourseCapacity?: number;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  active?: boolean;
  customerId?: string | null;
};

export type UpdateLocation = Partial<CreateLocation>;

export type CreateRoom = {
  name: string;
  kind: RoomKind;
  capacity?: number | null;
  active?: boolean;
};

export type UpdateRoom = Partial<CreateRoom>;

/**
 * Standorte sorted by name; `q` matches code, name or city. Defaults to the browser client;
 * Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listLocations(q?: string, fetcher: ApiFetcher = apiFetch): Promise<Location[]> {
  return fetcher<Location[]>(withQuery("/locations", { q }));
}

/** One Standort with its rooms; throws `ApiError` 404 when it does not exist. */
export function getLocation(id: string, fetcher: ApiFetcher = apiFetch): Promise<Location> {
  return fetcher<Location>(`/locations/${encodeURIComponent(id)}`);
}

export function createLocation(dto: CreateLocation, fetcher: ApiFetcher = apiFetch): Promise<Location> {
  return fetcher<Location>("/locations", { method: "POST", body: dto });
}

export function updateLocation(
  id: string,
  dto: UpdateLocation,
  fetcher: ApiFetcher = apiFetch,
): Promise<Location> {
  return fetcher<Location>(`/locations/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; the backend answers 409 with a message while the Standort is still referenced. */
export function deleteLocation(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/locations/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createRoom(locationId: string, dto: CreateRoom, fetcher: ApiFetcher = apiFetch): Promise<Room> {
  return fetcher<Room>(`/locations/${encodeURIComponent(locationId)}/rooms`, { method: "POST", body: dto });
}

export function updateRoom(id: string, dto: UpdateRoom, fetcher: ApiFetcher = apiFetch): Promise<Room> {
  return fetcher<Room>(`/rooms/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

export function deleteRoom(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/rooms/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Travel time between two Standorte; stored in both directions (symmetric). */
export type LocationDistance = {
  fromLocation: { id: string; code: string; name: string };
  toLocation: { id: string; code: string; name: string };
  travelMinutes: number;
};

export type UpsertLocationDistance = {
  fromLocationId: string;
  toLocationId: string;
  travelMinutes: number;
};

/** Every stored pair, both directions, ordered by the location names. */
export function listLocationDistances(fetcher: ApiFetcher = apiFetch): Promise<LocationDistance[]> {
  return fetcher<LocationDistance[]>("/location-distances");
}

/** Creates or overwrites the pair in both directions. */
export function setLocationDistance(
  dto: UpsertLocationDistance,
  fetcher: ApiFetcher = apiFetch,
): Promise<LocationDistance> {
  return fetcher<LocationDistance>("/location-distances", { method: "PUT", body: dto });
}

/** Removes the pair in both directions. */
export function deleteLocationDistance(
  fromLocationId: string,
  toLocationId: string,
  fetcher: ApiFetcher = apiFetch,
): Promise<void> {
  return fetcher<void>(
    `/location-distances/${encodeURIComponent(fromLocationId)}/${encodeURIComponent(toLocationId)}`,
    { method: "DELETE" },
  );
}
