import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators.js';
import { Language, Track } from '../../database/enums.js';

export class CreateVocationalSchoolDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  shortName: string;

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

  /** Language of instruction; becomes the default course language of its apprentices. */
  @IsEnum(Language)
  language: Language;

  @IsUUID()
  nearestLocationId: string;

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
}

export class UpdateVocationalSchoolDto extends PartialType(
  CreateVocationalSchoolDto,
) {}

export class CreateSchoolClassDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(Track)
  track: Track;

  @IsInt()
  @Min(2000)
  @Max(2100)
  startYear: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSchoolClassDto extends PartialType(CreateSchoolClassDto) {}

export class SchoolClassDayDto {
  @IsInt()
  @Min(1)
  @Max(7)
  weekday: number;

  @IsOptional()
  @IsBoolean()
  evening?: boolean;
}

/** Replaces the school days of a class for one school year. */
export class ReplaceSchoolClassDaysDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  schoolYearStart: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolClassDayDto)
  days: SchoolClassDayDto[];
}

export class CreateSchoolHolidayDto {
  @IsDateOnly()
  startsOn: string;

  @IsDateOnly()
  endsOn: string;

  @IsOptional()
  @IsString()
  name?: string | null;
}

export class UpdateSchoolHolidayDto extends PartialType(
  CreateSchoolHolidayDto,
) {}
