import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';

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

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCertificateTypeDto extends PartialType(
  CreateCertificateTypeDto,
) {}

export class ReplaceMaintenanceCourseTypesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  courseTypeIds: string[];
}

/** Filters of GET /certificate-types (and its CSV export); all optional. */
export class ListCertificateTypesQuery extends ListPageQuery {
  /** Words matched against code, name and issuer. */
  @IsOptional()
  @IsString()
  q?: string;
}
