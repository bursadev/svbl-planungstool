import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';
import {
  CourseKind,
  Language,
  Track,
  WeekdayRule,
} from '../../database/enums.js';

export class CreateCourseTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CourseKind)
  kind: CourseKind;

  /** Null for anything that is not an ÜK. */
  @IsOptional()
  @IsEnum(Track)
  track?: Track | null;

  @IsInt()
  @Min(1)
  durationDays: number;

  @IsOptional()
  @IsBoolean()
  maySpanWeeks?: boolean;

  @IsOptional()
  @IsEnum(WeekdayRule)
  weekdayRule?: WeekdayRule;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Language, { each: true })
  languages: Language[];

  @IsOptional()
  @IsInt()
  @Min(1)
  minParticipants?: number | null;

  @IsInt()
  @Min(1)
  maxParticipants: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCourseTypeDto extends PartialType(CreateCourseTypeDto) {}

export class RequiredDeviceDto {
  @IsUUID()
  deviceTypeId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class ReplaceRequirementsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  skillIds: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  certificateTypeIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredDeviceDto)
  devices: RequiredDeviceDto[];
}

/**
 * One row of the CSV import: the course type plus its required skills and
 * certificate types (replaced when the column is in the file; the device
 * requirements stay as they are).
 */
export class ImportCourseTypeDto extends CreateCourseTypeDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  skillIds?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  certificateTypeIds?: string[] | null;
}

export class ImportUpdateCourseTypeDto extends PartialType(
  ImportCourseTypeDto,
) {}

/** Filters of GET /course-types (and its CSV export); all optional. */
export class ListCourseTypesQuery extends ListPageQuery {
  /** Words matched against code, name and description. */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(CourseKind)
  kind?: CourseKind;

  /** `none` for course types without a Lehrgang (not an ÜK). */
  @IsOptional()
  @IsIn([...Object.values(Track), 'none'])
  track?: Track | 'none';

  /** Course types offered in this language. */
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
