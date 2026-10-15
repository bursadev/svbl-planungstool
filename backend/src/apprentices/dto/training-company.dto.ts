import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTrainingCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  /** Reference in OdAOrg. */
  @IsOptional()
  @IsString()
  externalRef?: string | null;
}

export class UpdateTrainingCompanyDto extends PartialType(
  CreateTrainingCompanyDto,
) {}

export class CreateTrainerDto {
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
}

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {}
