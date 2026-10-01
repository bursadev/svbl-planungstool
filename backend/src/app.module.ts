import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApprenticesModule } from './apprentices/apprentices.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { CurriculumDomainModule } from './curriculum/curriculum.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { DatabaseModule } from './database/database.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { HealthModule } from './health/health.module.js';
import { InstructorsModule } from './instructors/instructors.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { MeModule } from './me/me.module.js';
import { PlanningModule } from './planning/planning.module.js';
import { SystemModule } from './system/system.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    DatabaseModule,
    HealthModule,
    MeModule,
    // Domain modules, one per cluster of the data model.
    UsersModule,
    LocationsModule,
    DevicesModule,
    InstructorsModule,
    CoursesModule,
    CurriculumDomainModule,
    ApprenticesModule,
    CustomersModule,
    PlanningModule,
    SystemModule,
  ],
})
export class AppModule {}
