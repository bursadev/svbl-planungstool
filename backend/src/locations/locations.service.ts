import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import type { UpsertLocationDistanceDto } from './dto/location-distance.dto.js';
import type {
  CreateLocationDto,
  UpdateLocationDto,
} from './dto/location.dto.js';
import type { CreateRoomDto, UpdateRoomDto } from './dto/room.dto.js';
import { LocationDistance } from './location-distance.entity.js';
import { Location } from './location.entity.js';
import { Room } from './room.entity.js';

export interface LocationDistanceView {
  fromLocation: Pick<Location, 'id' | 'code' | 'name'>;
  toLocation: Pick<Location, 'id' | 'code' | 'name'>;
  travelMinutes: number;
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(LocationDistance)
    private readonly distances: Repository<LocationDistance>,
    private readonly audit: AuditService,
  ) {}

  /** All locations with their rooms; `q` matches code, name or city. */
  list(q?: string): Promise<Location[]> {
    const where = q
      ? [
          { name: ILike(`%${q}%`) },
          { code: ILike(`%${q}%`) },
          { city: ILike(`%${q}%`) },
        ]
      : undefined;
    return this.locations.find({
      where,
      relations: { rooms: true },
      order: { name: 'ASC', rooms: { name: 'ASC' } },
    });
  }

  async get(id: string): Promise<Location> {
    const location = await this.locations.findOne({
      where: { id },
      relations: { rooms: true },
      order: { rooms: { name: 'ASC' } },
    });
    if (!location) throw new NotFoundException('Standort nicht gefunden.');
    return location;
  }

  async create(dto: CreateLocationDto, actor: AuthUser): Promise<Location> {
    const location = await this.locations.save(this.locations.create(dto));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'location',
      entityId: location.id,
      action: 'create',
      after: snapshot(location),
      summary: `hat Standort «${location.name}» angelegt`,
    });
    return this.get(location.id);
  }

  async update(
    id: string,
    dto: UpdateLocationDto,
    actor: AuthUser,
  ): Promise<Location> {
    const location = await this.get(id);
    const before = snapshot(location);
    this.locations.merge(location, dto);
    await this.locations.save(location);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'location',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(location),
      summary: `hat Standort «${location.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const location = await this.get(id);
    await this.locations.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'location',
      entityId: id,
      action: 'delete',
      before: snapshot(location),
      summary: `hat Standort «${location.name}» gelöscht`,
    });
  }

  async listRooms(locationId: string): Promise<Room[]> {
    await this.get(locationId);
    return this.rooms.find({ where: { locationId }, order: { name: 'ASC' } });
  }

  async createRoom(
    locationId: string,
    dto: CreateRoomDto,
    actor: AuthUser,
  ): Promise<Room> {
    const location = await this.get(locationId);
    const room = this.rooms.create(dto);
    room.locationId = locationId;
    await this.rooms.save(room);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'room',
      entityId: room.id,
      action: 'create',
      after: snapshot(room),
      summary: `hat Raum «${room.name}» in ${location.name} angelegt`,
    });
    return room;
  }

  async updateRoom(
    id: string,
    dto: UpdateRoomDto,
    actor: AuthUser,
  ): Promise<Room> {
    const room = await this.getRoom(id);
    const before = snapshot(room);
    this.rooms.merge(room, dto);
    await this.rooms.save(room);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'room',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(room),
      summary: `hat Raum «${room.name}» geändert`,
    });
    return room;
  }

  async removeRoom(id: string, actor: AuthUser): Promise<void> {
    const room = await this.getRoom(id);
    await this.rooms.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'room',
      entityId: id,
      action: 'delete',
      before: snapshot(room),
      summary: `hat Raum «${room.name}» gelöscht`,
    });
  }

  private async getRoom(id: string): Promise<Room> {
    const room = await this.rooms.findOneBy({ id });
    if (!room) throw new NotFoundException('Raum nicht gefunden.');
    return room;
  }

  // --- Distances ------------------------------------------------------------

  /** Every stored pair, both directions, ordered by the location names. */
  async listDistances(): Promise<LocationDistanceView[]> {
    const distances = await this.distances.find({
      relations: { fromLocation: true, toLocation: true },
    });
    return distances
      .map(toDistanceView)
      .sort(
        (a, b) =>
          a.fromLocation.name.localeCompare(b.fromLocation.name) ||
          a.toLocation.name.localeCompare(b.toLocation.name),
      );
  }

  /** Upserts the pair in both directions: travel times are kept symmetric. */
  async setDistance(
    dto: UpsertLocationDistanceDto,
    actor: AuthUser,
  ): Promise<LocationDistanceView> {
    const { fromLocationId, toLocationId, travelMinutes } = dto;
    if (fromLocationId === toLocationId) {
      throw new BadRequestException('Start und Ziel müssen verschieden sein.');
    }
    const locations = await this.locations.findBy({
      id: In([fromLocationId, toLocationId]),
    });
    if (locations.length !== 2) {
      throw new BadRequestException('Unbekannter Standort.');
    }
    await this.distances.upsert(
      [
        { fromLocationId, toLocationId, travelMinutes },
        {
          fromLocationId: toLocationId,
          toLocationId: fromLocationId,
          travelMinutes,
        },
      ],
      { conflictPaths: ['fromLocationId', 'toLocationId'] },
    );
    const names = new Map(locations.map((l) => [l.id, l.name]));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'location_distance',
      entityId: fromLocationId,
      action: 'set',
      after: { fromLocationId, toLocationId, travelMinutes },
      summary: `hat die Reisezeit ${names.get(fromLocationId)} – ${names.get(toLocationId)} auf ${travelMinutes} Minuten gesetzt`,
    });
    const stored = await this.distances.findOneOrFail({
      where: { fromLocationId, toLocationId },
      relations: { fromLocation: true, toLocation: true },
    });
    return toDistanceView(stored);
  }

  /** Removes the pair in both directions. */
  async removeDistance(
    fromLocationId: string,
    toLocationId: string,
    actor: AuthUser,
  ): Promise<void> {
    const existing = await this.distances.findOne({
      where: { fromLocationId, toLocationId },
      relations: { fromLocation: true, toLocation: true },
    });
    if (!existing) throw new NotFoundException('Reisezeit nicht gefunden.');
    await this.distances.delete({ fromLocationId, toLocationId });
    await this.distances.delete({
      fromLocationId: toLocationId,
      toLocationId: fromLocationId,
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'location_distance',
      entityId: fromLocationId,
      action: 'delete',
      before: {
        fromLocationId,
        toLocationId,
        travelMinutes: existing.travelMinutes,
      },
      summary: `hat die Reisezeit ${existing.fromLocation.name} – ${existing.toLocation.name} gelöscht`,
    });
  }
}

function toDistanceView(distance: LocationDistance): LocationDistanceView {
  return {
    fromLocation: {
      id: distance.fromLocation.id,
      code: distance.fromLocation.code,
      name: distance.fromLocation.name,
    },
    toLocation: {
      id: distance.toLocation.id,
      code: distance.toLocation.code,
      name: distance.toLocation.name,
    },
    travelMinutes: distance.travelMinutes,
  };
}
