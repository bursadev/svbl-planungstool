import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import type {
  CreateLocationDto,
  UpdateLocationDto,
} from './dto/location.dto.js';
import type { CreateRoomDto, UpdateRoomDto } from './dto/room.dto.js';
import { Location } from './location.entity.js';
import { Room } from './room.entity.js';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
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
}
