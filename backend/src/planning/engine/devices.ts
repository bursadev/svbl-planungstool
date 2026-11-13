import { DeviceMobility, DeviceStatus } from '../../database/enums.js';
import type { EngineContext } from './check.js';
import type { IsoDate, SnapshotDevice } from './types.js';

/**
 * Where a device is on a date: its home location, moved by the last move
 * with `effectiveOn <= date`; a rental device exists only inside its rental
 * period; a retired device is nowhere.
 */
export function deviceLocationOn(
  device: SnapshotDevice,
  date: IsoDate,
): string | null {
  if (device.status === DeviceStatus.Retired) return null;
  if (
    device.mobility === DeviceMobility.Rental &&
    ((device.rentalFrom !== null && date < device.rentalFrom) ||
      (device.rentalUntil !== null && date > device.rentalUntil))
  ) {
    return null;
  }
  let location = device.homeLocationId;
  for (const move of [...device.moves].sort((a, b) =>
    a.effectiveOn.localeCompare(b.effectiveOn),
  )) {
    if (move.effectiveOn <= date) location = move.toLocationId;
  }
  return location;
}

export interface DeviceCheckItem {
  deviceTypeId: string;
  name: string;
  needed: number;
  total: number;
  maintenance: number;
  reserved: number;
  free: number;
  ok: boolean;
}

function inMaintenance(device: SnapshotDevice, date: IsoDate): boolean {
  return (
    device.status === DeviceStatus.Maintenance ||
    device.maintenance.some((m) => m.startsOn <= date && date <= m.endsOn)
  );
}

/**
 * Per required device type: stock at the location minus maintenance minus
 * the ledger's reservations, on the worst of the course days.
 */
export function deviceCheck(
  course: { courseTypeId: string; locationId: string; dates: IsoDate[] },
  ctx: EngineContext,
): DeviceCheckItem[] {
  const type = ctx.snapshot.courseTypes.get(course.courseTypeId);
  if (!type) return [];
  const devices = [...ctx.snapshot.devices.values()];
  return type.requiredDevices.map(({ deviceTypeId, quantity }) => {
    const name =
      ctx.snapshot.deviceTypes.get(deviceTypeId)?.name ?? deviceTypeId;
    let worst: DeviceCheckItem | null = null;
    for (const date of course.dates) {
      const here = devices.filter(
        (d) =>
          d.deviceTypeId === deviceTypeId &&
          deviceLocationOn(d, date) === course.locationId,
      );
      const maintenance = here.filter((d) => inMaintenance(d, date)).length;
      const reserved = ctx.ledger.deviceUse(
        course.locationId,
        deviceTypeId,
        date,
      );
      const free = here.length - maintenance - reserved;
      const item: DeviceCheckItem = {
        deviceTypeId,
        name,
        needed: quantity,
        total: here.length,
        maintenance,
        reserved,
        free,
        ok: free >= quantity,
      };
      if (worst === null || item.free < worst.free) worst = item;
    }
    return (
      worst ?? {
        deviceTypeId,
        name,
        needed: quantity,
        total: 0,
        maintenance: 0,
        reserved: 0,
        free: 0,
        ok: false,
      }
    );
  });
}
