import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DeviceCategory } from '../../database/enums.js';

export class CreateDeviceTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DeviceCategory)
  category: DeviceCategory;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateDeviceTypeDto extends PartialType(CreateDeviceTypeDto) {}

export class ReplaceQualificationsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  certificateTypeIds: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  skillIds: string[];
}
