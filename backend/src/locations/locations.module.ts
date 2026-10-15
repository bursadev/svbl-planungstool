import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemModule } from '../system/system.module.js';
import { LocationDistance } from './location-distance.entity.js';
import { Location } from './location.entity.js';
import {
  LocationDistancesController,
  LocationsController,
  RoomsController,
} from './locations.controller.js';
import { LocationsService } from './locations.service.js';
import { Room } from './room.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Room, LocationDistance]),
    SystemModule,
  ],
  controllers: [
    LocationsController,
    LocationDistancesController,
    RoomsController,
  ],
  providers: [LocationsService],
  exports: [TypeOrmModule, LocationsService],
})
export class LocationsModule {}
