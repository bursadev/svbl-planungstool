import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators.js';
import { DeviceMobility, DeviceStatus } from '../../database/enums.js';

export class CreateDeviceDto {
  @IsUUID()
  deviceTypeId: string;

  @IsString()
  @IsNotEmpty()
  inventoryNumber: string;

  @IsUUID()
  homeLocationId: string;

  @IsOptional()
  @IsEnum(DeviceMobility)
  mobility?: DeviceMobility;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsDateOnly()
  rentalFrom?: string | null;

  @IsOptional()
  @IsDateOnly()
  rentalUntil?: string | null;

  @IsOptional()
  @IsString()
  rentalVendor?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}

/** Filters of GET /devices; all optional. */
export class ListDevicesQuery {
  @IsOptional()
  @IsUUID()
  deviceTypeId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsEnum(DeviceMobility)
  mobility?: DeviceMobility;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}

export class CreateDeviceMoveDto {
  @IsUUID()
  toLocationId: string;

  @IsDateOnly()
  effectiveOn: string;

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class CreateMaintenanceWindowDto {
  @IsDateOnly()
  startsOn: string;

  @IsDateOnly()
  endsOn: string;

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class UpdateMaintenanceWindowDto extends PartialType(
  CreateMaintenanceWindowDto,
) {}
