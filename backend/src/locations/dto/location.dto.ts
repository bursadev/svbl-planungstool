import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';
import { Language, LocationKind } from '../../database/enums.js';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LocationKind)
  kind: LocationKind;

  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  canton?: string | null;

  @IsEnum(Language)
  languageRegion: Language;

  @IsOptional()
  @IsBoolean()
  hostsUk?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  parallelCourseCapacity?: number;

  @IsOptional()
  @IsString()
  contactName?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsUUID()
  customerId?: string | null;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}

/** Filters of GET /locations (and its CSV export); all optional. */
export class ListLocationsQuery extends ListPageQuery {
  /** Words matched against code, name, address, city, canton and contact. */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(LocationKind)
  kind?: LocationKind;

  @IsOptional()
  @IsEnum(Language)
  languageRegion?: Language;

  @IsOptional()
  @IsIn(['true', 'false'])
  hostsUk?: 'true' | 'false';

  @IsOptional()
  @IsString()
  canton?: string;
}
