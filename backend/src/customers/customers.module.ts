import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity.js';
import { Participant } from './participant.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Participant])],
  exports: [TypeOrmModule],
})
export class CustomersModule {}
