import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IsDateOnly } from '../../common/validators.js';

export class CreateInstructorCertificateDto {
  @IsUUID()
  certificateTypeId: string;

  @IsDateOnly()
  issuedOn: string;

  /** Omitted: computed from the type's validity years; null: does not expire. */
  @IsOptional()
  @IsDateOnly()
  validUntil?: string | null;

  @IsOptional()
  @IsString()
  documentUrl?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateInstructorCertificateDto extends PartialType(
  CreateInstructorCertificateDto,
) {}
