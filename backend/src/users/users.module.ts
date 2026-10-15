import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from '../apprentices/trainer.entity.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { SystemModule } from '../system/system.module.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    // Instructor and Trainer are read-only here: link validation.
    TypeOrmModule.forFeature([User, Instructor, Trainer]),
    SystemModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
