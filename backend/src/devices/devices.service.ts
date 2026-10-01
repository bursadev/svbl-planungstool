import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { DeviceMobility } from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { DeviceMove } from './device-move.entity.js';
import { DeviceType } from './device-type.entity.js';
import { Device } from './device.entity.js';
import type {
  CreateDeviceDto,
  CreateDeviceMoveDto,
  CreateMaintenanceWindowDto,
  ListDevicesQuery,
  UpdateDeviceDto,
  UpdateMaintenanceWindowDto,
} from './dto/device.dto.js';
import { MaintenanceWindow } from './maintenance-window.entity.js';

type LocationRef = Pick<Location, 'id' | 'code' | 'name'>;

export interface DeviceRow {
  id: string;
  inventoryNumber: string;
  deviceType: Pick<DeviceType, 'id' | 'code' | 'name' | 'category'>;
  homeLocation: LocationRef;
  /** Home location, or the destination of the last move on or before today. */
  currentLocation: LocationRef;
  mobility: Device['mobility'];
  status: Device['status'];
  rentalFrom: string | null;
  rentalUntil: string | null;
  rentalVendor: string | null;
  lastMove: { toLocation: LocationRef; effectiveOn: string } | null;
}

export interface DeviceDetail extends DeviceRow {
  notes: string | null;
  moves: DeviceMove[];
  maintenanceWindows: MaintenanceWindow[];
  createdAt: Date;
  updatedAt: Date;
}

const today = (): string => new Date().toISOString().slice(0, 10);
const ref = (l: Location): LocationRef => ({
  id: l.id,
  code: l.code,
  name: l.name,
});

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    @InjectRepository(DeviceMove)
    private readonly moves: Repository<DeviceMove>,
    @InjectRepository(MaintenanceWindow)
    private readonly windows: Repository<MaintenanceWindow>,
    @InjectRepository(DeviceType)
    private readonly types: Repository<DeviceType>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListDevicesQuery): Promise<DeviceRow[]> {
    // TypeORM rejects undefined values in `where`, so only set given filters.
    const where: FindOptionsWhere<Device> = {};
    if (query.deviceTypeId) where.deviceTypeId = query.deviceTypeId;
    if (query.locationId) where.homeLocationId = query.locationId;
    if (query.mobility) where.mobility = query.mobility;
    if (query.status) where.status = query.status;
    const devices = await this.devices.find({
      where,
      relations: {
        deviceType: true,
        homeLocation: true,
        moves: { toLocation: true },
      },
      order: { inventoryNumber: 'ASC', moves: { effectiveOn: 'ASC' } },
    });
    return devices.map((d) => this.toRow(d));
  }

  async get(id: string): Promise<DeviceDetail> {
    return this.toDetail(await this.load(id));
  }

  async create(dto: CreateDeviceDto, actor: AuthUser): Promise<DeviceDetail> {
    await this.assertRefs(dto.deviceTypeId, dto.homeLocationId);
    assertRental(dto.rentalFrom, dto.rentalUntil);
    const device = this.devices.create(dto);
    await this.devices.save(device);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: device.id,
      action: 'create',
      after: snapshot(device),
      summary: `hat Gerät «${device.inventoryNumber}» angelegt`,
    });
    return this.get(device.id);
  }

  async update(
    id: string,
    dto: UpdateDeviceDto,
    actor: AuthUser,
  ): Promise<DeviceDetail> {
    const device = await this.load(id);
    await this.assertRefs(dto.deviceTypeId, dto.homeLocationId);
    const before = snapshot(device);
    this.devices.merge(device, dto);
    assertRental(device.rentalFrom, device.rentalUntil);
    await this.devices.save(device);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(device),
      summary: `hat Gerät «${device.inventoryNumber}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const device = await this.load(id);
    await this.devices.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: id,
      action: 'delete',
      before: snapshot(device),
      summary: `hat Gerät «${device.inventoryNumber}» gelöscht`,
    });
  }

  // --- Moves --------------------------------------------------------------

  async addMove(
    deviceId: string,
    dto: CreateDeviceMoveDto,
    actor: AuthUser,
  ): Promise<DeviceDetail> {
    const device = await this.load(deviceId);
    if (device.mobility === DeviceMobility.Fixed) {
      throw new ConflictException(
        'Das Gerät ist fest installiert und kann nicht verschoben werden.',
      );
    }
    const to = await this.locations.findOneBy({ id: dto.toLocationId });
    if (!to) throw new BadRequestException('Unbekannter Standort.');
    const from = this.locationOn(device, dto.effectiveOn);
    if (from.id === to.id) {
      throw new BadRequestException(
        'Das Gerät steht an diesem Datum bereits an diesem Standort.',
      );
    }
    const move = this.moves.create({
      deviceId,
      fromLocationId: from.id,
      toLocationId: to.id,
      effectiveOn: dto.effectiveOn,
      note: dto.note ?? null,
    });
    await this.moves.save(move);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: deviceId,
      action: 'move',
      after: snapshot(move),
      summary: `hat Gerät «${device.inventoryNumber}» per ${dto.effectiveOn} von ${from.name} nach ${to.name} verschoben`,
    });
    return this.get(deviceId);
  }

  async removeMove(id: string, actor: AuthUser): Promise<void> {
    const move = await this.moves.findOne({
      where: { id },
      relations: { device: true },
    });
    if (!move) throw new NotFoundException('Verschiebung nicht gefunden.');
    await this.moves.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: move.deviceId,
      action: 'delete_move',
      before: snapshot(move),
      summary: `hat die Verschiebung von Gerät «${move.device.inventoryNumber}» per ${move.effectiveOn} gelöscht`,
    });
  }

  // --- Maintenance windows ------------------------------------------------

  async addMaintenanceWindow(
    deviceId: string,
    dto: CreateMaintenanceWindowDto,
    actor: AuthUser,
  ): Promise<MaintenanceWindow> {
    const device = await this.load(deviceId);
    assertPeriod(dto.startsOn, dto.endsOn);
    const window = this.windows.create({
      deviceId,
      startsOn: dto.startsOn,
      endsOn: dto.endsOn,
      note: dto.note ?? null,
    });
    await this.windows.save(window);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: deviceId,
      action: 'maintenance',
      after: snapshot(window),
      summary: `hat Wartung ${dto.startsOn} bis ${dto.endsOn} für Gerät «${device.inventoryNumber}» erfasst`,
    });
    return window;
  }

  async updateMaintenanceWindow(
    id: string,
    dto: UpdateMaintenanceWindowDto,
    actor: AuthUser,
  ): Promise<MaintenanceWindow> {
    const window = await this.windows.findOneBy({ id });
    if (!window) throw new NotFoundException('Wartungsfenster nicht gefunden.');
    const before = snapshot(window);
    this.windows.merge(window, dto);
    assertPeriod(window.startsOn, window.endsOn);
    await this.windows.save(window);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: window.deviceId,
      action: 'update_maintenance',
      before,
      after: snapshot(window),
      summary: `hat Wartung ${window.startsOn} bis ${window.endsOn} geändert`,
    });
    return window;
  }

  async removeMaintenanceWindow(id: string, actor: AuthUser): Promise<void> {
    const window = await this.windows.findOneBy({ id });
    if (!window) throw new NotFoundException('Wartungsfenster nicht gefunden.');
    await this.windows.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device',
      entityId: window.deviceId,
      action: 'delete_maintenance',
      before: snapshot(window),
      summary: `hat Wartung ${window.startsOn} bis ${window.endsOn} gelöscht`,
    });
  }

  // --- Helpers ------------------------------------------------------------

  private async load(id: string): Promise<Device> {
    const device = await this.devices.findOne({
      where: { id },
      relations: {
        deviceType: true,
        homeLocation: true,
        moves: { fromLocation: true, toLocation: true },
      },
      order: { moves: { effectiveOn: 'ASC' } },
    });
    if (!device) throw new NotFoundException('Gerät nicht gefunden.');
    return device;
  }

  private async assertRefs(
    deviceTypeId?: string,
    homeLocationId?: string,
  ): Promise<void> {
    if (deviceTypeId && !(await this.types.existsBy({ id: deviceTypeId }))) {
      throw new BadRequestException('Unbekannter Gerätetyp.');
    }
    if (
      homeLocationId &&
      !(await this.locations.existsBy({ id: homeLocationId }))
    ) {
      throw new BadRequestException('Unbekannter Standort.');
    }
  }

  /** Where the device is on a date: home, then the last move on or before it. Moves must be loaded. */
  private locationOn(device: Device, date: string): Location {
    const moves = (device.moves ?? [])
      .filter((m) => m.effectiveOn <= date)
      .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn));
    const last = moves[moves.length - 1];
    return last ? last.toLocation : device.homeLocation;
  }

  private toRow(d: Device): DeviceRow {
    const moves = [...(d.moves ?? [])].sort((a, b) =>
      a.effectiveOn.localeCompare(b.effectiveOn),
    );
    const last = moves[moves.length - 1];
    return {
      id: d.id,
      inventoryNumber: d.inventoryNumber,
      deviceType: {
        id: d.deviceType.id,
        code: d.deviceType.code,
        name: d.deviceType.name,
        category: d.deviceType.category,
      },
      homeLocation: ref(d.homeLocation),
      currentLocation: ref(this.locationOn(d, today())),
      mobility: d.mobility,
      status: d.status,
      rentalFrom: d.rentalFrom,
      rentalUntil: d.rentalUntil,
      rentalVendor: d.rentalVendor,
      lastMove: last
        ? { toLocation: ref(last.toLocation), effectiveOn: last.effectiveOn }
        : null,
    };
  }

  private async toDetail(d: Device): Promise<DeviceDetail> {
    const maintenanceWindows = await this.windows.find({
      where: { deviceId: d.id },
      order: { startsOn: 'DESC' },
    });
    return {
      ...this.toRow(d),
      notes: d.notes,
      moves: [...(d.moves ?? [])].sort((a, b) =>
        b.effectiveOn.localeCompare(a.effectiveOn),
      ),
      maintenanceWindows,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}

function assertPeriod(startsOn: string, endsOn: string): void {
  if (startsOn > endsOn) {
    throw new BadRequestException('Das Enddatum liegt vor dem Startdatum.');
  }
}

function assertRental(from?: string | null, until?: string | null): void {
  if (from && until && from > until) {
    throw new BadRequestException('Das Mietende liegt vor dem Mietbeginn.');
  }
}
