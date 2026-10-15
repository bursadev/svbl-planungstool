import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/location.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Customer } from './customer.entity.js';
import {
  CustomersController,
  ParticipantsController,
} from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { Participant } from './participant.entity.js';

@Module({
  imports: [
    // Location is read-only here: the customer-site listing.
    TypeOrmModule.forFeature([Customer, Participant, Location]),
    SystemModule,
  ],
  controllers: [CustomersController, ParticipantsController],
  providers: [CustomersService],
  exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}
