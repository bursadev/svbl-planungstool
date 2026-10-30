import {
  DEVICE_MOBILITY_LABELS,
  DEVICE_STATUS_LABELS,
} from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import { date, enumOf, normalizeKey, ref, text } from '../common/tabular.js';
import { DeviceStatus } from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { DeviceType } from './device-type.entity.js';
import { Device } from './device.entity.js';
import type { DeviceRow } from './devices.service.js';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto.js';

/**
 * CSV columns, import and bulk actions of `/devices`; the key is the
 * inventory number. Gerätetyp and Heimstandort are written and read as codes.
 * Archiving retires a device; restoring makes it available again.
 */
export const DEVICES_TABULAR: TabularSpec<Device> = {
  entity: Device,
  entityType: 'device',
  noun: 'Gerät',
  fileName: 'geraete',
  label: (d) => d.inventoryNumber,
  columns: [
    text('Inventarnummer', 'inventoryNumber', {
      required: true,
      examples: ['ST-001', 'HB-014'],
    }),
    ref('Gerätetyp', 'deviceTypeId', 'deviceTypes', {
      required: true,
      get: (d: DeviceRow) => d.deviceType?.code,
      examples: ['STAPLER-E', 'HEBEBUEHNE-S'],
    }),
    ref('Heimstandort', 'homeLocationId', 'locations', {
      required: true,
      get: (d: DeviceRow) => d.homeLocation?.code,
      examples: ['RUP', 'MAR'],
    }),
    enumOf('Mobilität', 'mobility', DEVICE_MOBILITY_LABELS, {
      examples: ['fest', 'Miete'],
    }),
    enumOf('Status', 'status', DEVICE_STATUS_LABELS, {
      examples: ['verfügbar', 'verfügbar'],
    }),
    date('Mietbeginn', 'rentalFrom', {
      nullable: true,
      examples: ['', '01.03.2027'],
    }),
    date('Mietende', 'rentalUntil', {
      nullable: true,
      examples: ['', '30.06.2027'],
    }),
    text('Anbieter', 'rentalVendor', {
      nullable: true,
      examples: ['', 'Hebetec AG'],
    }),
    text('Notizen', 'notes', {
      nullable: true,
      examples: ['', 'Nur für ÜK 3'],
    }),
  ],
  archive: {
    archived: { status: DeviceStatus.Retired },
    restored: { status: DeviceStatus.Available },
    isArchived: (d) => d.status === DeviceStatus.Retired,
  },
  import: {
    createDto: CreateDeviceDto,
    updateDto: UpdateDeviceDto,
    keyHeaders: ['Inventarnummer'],
    key: (values) =>
      typeof values.inventoryNumber === 'string' && values.inventoryNumber
        ? normalizeKey(values.inventoryNumber)
        : null,
    entityKey: (d) => normalizeKey(d.inventoryNumber),
    lookups: {
      deviceTypes: async (manager) => {
        const types = await manager.find(DeviceType, {
          select: { id: true, code: true },
        });
        return new Map(types.map((t) => [normalizeKey(t.code), t.id]));
      },
      locations: async (manager) => {
        const locations = await manager.find(Location, {
          select: { id: true, code: true },
        });
        return new Map(locations.map((l) => [normalizeKey(l.code), l.id]));
      },
    },
    // Same check as the service's create and update; the database would
    // otherwise reject the row with a check violation.
    validateRow: ({ rentalFrom, rentalUntil }) =>
      typeof rentalFrom === 'string' &&
      typeof rentalUntil === 'string' &&
      rentalFrom > rentalUntil
        ? [
            {
              column: 'Mietende',
              message: 'Das Mietende liegt vor dem Mietbeginn.',
            },
          ]
        : [],
  },
};
