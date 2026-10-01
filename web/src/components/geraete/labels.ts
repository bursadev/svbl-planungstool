import type { StatusTone } from "@/components/data/status-dot";
import type { DeviceStatus } from "@/lib/api/devices";

/** Status dot colours: verfügbar green, in Wartung amber, ausgemustert grey. */
export const DEVICE_STATUS_TONES: Record<DeviceStatus, StatusTone> = {
  available: "ok",
  maintenance: "warn",
  retired: "muted",
};

/** The entries of `GET /device-types` and `GET /locations` the Geräte screens need for pickers and filters. */
export type PickerOption = { id: string; code: string; name: string; active: boolean };

export function toPickerOptions(rows: { id: string; code: string; name: string; active: boolean }[]): PickerOption[] {
  return rows.map(({ id, code, name, active }) => ({ id, code, name, active }));
}

/** Active options plus the one currently selected, so an inactive entry stays visible while assigned. */
export function selectableOptions(options: PickerOption[], currentId?: string | null): PickerOption[] {
  return options.filter((option) => option.active || option.id === currentId);
}
