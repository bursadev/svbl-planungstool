import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCertificateTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  issuer?: string | null;

  /** null = does not expire */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  validityYears?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  warningLeadDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maintenanceMinPerYear?: number | null;
}

export class UpdateCertificateTypeDto extends PartialType(
  CreateCertificateTypeDto,
) {}

export class ReplaceMaintenanceCourseTypesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  courseTypeIds: string[];
}
