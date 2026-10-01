import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
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
