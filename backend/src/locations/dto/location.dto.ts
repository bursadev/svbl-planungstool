import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
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
