import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceMove } from './device-move.entity.js';
import { DeviceReservation } from './device-reservation.entity.js';
import { DeviceTypeQualification } from './device-type-qualification.entity.js';
import { DeviceType } from './device-type.entity.js';
import { Device } from './device.entity.js';
import { MaintenanceWindow } from './maintenance-window.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceType,
      DeviceTypeQualification,
      Device,
      DeviceMove,
      MaintenanceWindow,
      DeviceReservation,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DevicesModule {}
