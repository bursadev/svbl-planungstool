import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { SystemModule } from '../system/system.module.js';
import { DeviceMove } from './device-move.entity.js';
import { DeviceReservation } from './device-reservation.entity.js';
import { DeviceTypeQualification } from './device-type-qualification.entity.js';
import { DeviceType } from './device-type.entity.js';
import { DeviceTypesController } from './device-types.controller.js';
import { DeviceTypesService } from './device-types.service.js';
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
      // Read-only here: qualifications point at certificate types and skills.
      CertificateType,
      Skill,
    ]),
    SystemModule,
  ],
  controllers: [DeviceTypesController],
  providers: [DeviceTypesService],
  exports: [TypeOrmModule, DeviceTypesService],
})
export class DevicesModule {}
