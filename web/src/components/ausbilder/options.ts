import type { Location } from "@/lib/api/locations";

/** What the Ausbilder pickers need to know about a Standort. */
export type LocationOption = { id: string; code: string; name: string };

/** Keeps the client payload small: the dialogs only need id, code and name. */
export function toLocationOptions(locations: Location[]): LocationOption[] {
  return locations.map(({ id, code, name }) => ({ id, code, name }));
}
