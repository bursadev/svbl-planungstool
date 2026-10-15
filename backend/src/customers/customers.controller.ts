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
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from './dto/participant.dto.js';
import { ListParticipantsQuery } from './dto/participant-query.dto.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.customers.list(q?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.customers.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customers.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customers.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.customers.remove(id, user);
  }
}

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Query() query: ListParticipantsQuery) {
    return this.customers.listParticipants(
      query.q?.trim() || undefined,
      query.customerId,
    );
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateParticipantDto, @CurrentUser() user: AuthUser) {
    return this.customers.createParticipant(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateParticipantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customers.updateParticipant(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.customers.removeParticipant(id, user);
  }
}
