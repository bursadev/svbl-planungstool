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
import { ListPageQuery } from '../../common/list-query.js';
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

/**
 * A CSV import row: the device type plus its qualifications (certificate
 * types by code, skills by name, resolved to ids). Absent lists keep the
 * current qualifications; null clears them.
 */
export class ImportDeviceTypeDto extends CreateDeviceTypeDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  certificateTypeIds?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  skillIds?: string[] | null;
}

export class ImportDeviceTypeUpdateDto extends PartialType(
  ImportDeviceTypeDto,
) {}

/** Filters of GET /device-types (and its CSV export); all optional. */
export class ListDeviceTypesQuery extends ListPageQuery {
  /** Words matched against code and name. */
  @IsOptional()
  @IsString()
  q?: string;
}
