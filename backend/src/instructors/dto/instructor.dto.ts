import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';
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

/** Certificate state for today, as the detail page derives it from `validUntil` and the type's `warningLeadDays`. */
export const CERTIFICATE_STATUSES = ['valid', 'expiring', 'expired'] as const;
export type CertificateStatusFilter = (typeof CERTIFICATE_STATUSES)[number];

/** Filters of GET /instructors (and its CSV export); all optional. */
export class ListInstructorsQuery extends ListPageQuery {
  /** Words matched against name, e-mail, phone, external ref and home location name. */
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

  /** Kept for compatibility; the screen uses `archive` (inactive = archived). */
  @IsOptional()
  @IsEnum(InstructorStatus)
  status?: InstructorStatus;

  /** Has a certificate of this type (combined with `certificateStatus`: the same certificate). */
  @IsOptional()
  @IsUUID()
  certificateTypeId?: string;

  /** Has a certificate in this state today. */
  @IsOptional()
  @IsIn(CERTIFICATE_STATUSES)
  certificateStatus?: CertificateStatusFilter;
}

/**
 * One CSV import row: the create fields plus the skills (`Skills` column, by name), which
 * the import writes into `instructor_skill` after saving the row.
 */
export class ImportInstructorDto extends CreateInstructorDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  skillIds?: string[] | null;
}

export class UpdateImportInstructorDto extends PartialType(
  ImportInstructorDto,
) {}
