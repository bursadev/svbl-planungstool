import type { DeviceMobility, DeviceStatus } from "./api/devices";
import type { LocationKind, RoomKind } from "./api/locations";

export { LANGUAGE_LABELS } from "./format";

export const LOCATION_KIND_LABELS: Record<LocationKind, string> = {
  training_centre: "Ausbildungszentrum",
  customer_site: "Kundenstandort",
};

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  theory: "Theorieraum",
  practice_hall: "Praxishalle",
  outdoor: "Aussenfläche",
};

export const DEVICE_MOBILITY_LABELS: Record<DeviceMobility, string> = {
  fixed: "fest",
  mobile: "mobil",
  rental: "Miete",
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  available: "verfügbar",
  maintenance: "in Wartung",
  retired: "ausgemustert",
};
