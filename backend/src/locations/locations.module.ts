import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationDistance } from './location-distance.entity.js';
import { Location } from './location.entity.js';
import { Room } from './room.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Room, LocationDistance])],
  exports: [TypeOrmModule],
})
export class LocationsModule {}
