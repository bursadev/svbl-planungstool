import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EmploymentType,
  InstructorStatus,
  Language,
} from '../../database/enums.js';

export class InstructorPreferencesDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  preferredLocationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  avoidInstructorIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInstructorDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsUUID()
  homeLocationId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Language, { each: true })
  languages: Language[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weeklyHours?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overtimeCapHours?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costRate?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxTravelMinutes?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstructorPreferencesDto)
  preferences?: InstructorPreferencesDto | null;

  @IsOptional()
  @IsString()
  externalRef?: string | null;

  @IsOptional()
  @IsEnum(InstructorStatus)
  status?: InstructorStatus;
}

export class UpdateInstructorDto extends PartialType(CreateInstructorDto) {}

export class ReplaceSkillsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  skillIds: string[];
}

/** Filters of GET /instructors; all optional. */
export class ListInstructorsQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  skillId?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(InstructorStatus)
  status?: InstructorStatus;
}
