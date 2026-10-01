import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto.js';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto.js';
import { LocationsService } from './locations.service.js';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.locations.list(q?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.locations.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: AuthUser) {
    return this.locations.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.locations.remove(id, user);
  }

  @Get(':id/rooms')
  listRooms(@Param('id', uuidPipe) id: string) {
    return this.locations.listRooms(id);
  }

  @Post(':id/rooms')
  @Roles(...WRITE_ROLES)
  createRoom(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.createRoom(id, dto, user);
  }
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly locations: LocationsService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.updateRoom(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.locations.removeRoom(id, user);
  }
}
