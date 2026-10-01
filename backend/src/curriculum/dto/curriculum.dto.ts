import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators.js';
import { Track } from '../../database/enums.js';

export class CreateCurriculumModuleDto {
  @IsEnum(Track)
  track: Track;

  @IsUUID()
  courseTypeId: string;

  @IsInt()
  @Min(1)
  @Max(6)
  semester: number;

  @IsInt()
  @Min(1)
  sequence: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  prerequisiteModuleIds?: string[];
}

export class UpdateCurriculumModuleDto extends PartialType(
  CreateCurriculumModuleDto,
) {}

export class CreateCohortDto {
  @IsEnum(Track)
  track: Track;

  @IsInt()
  @Min(2000)
  @Max(2100)
  startYear: number;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  expectedEndYear?: number | null;
}

export class UpdateCohortDto extends PartialType(CreateCohortDto) {}

export class CreateTimeWindowDto {
  @IsUUID()
  curriculumModuleId: string;

  @IsUUID()
  cohortId: string;

  @IsDateOnly()
  startsOn: string;

  @IsDateOnly()
  endsOn: string;

  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class UpdateTimeWindowDto extends PartialType(CreateTimeWindowDto) {}

export class ListTimeWindowsQuery {
  @IsOptional()
  @IsUUID()
  cohortId?: string;
}

export class ListModulesQuery {
  @IsOptional()
  @IsEnum(Track)
  track?: Track;
}
