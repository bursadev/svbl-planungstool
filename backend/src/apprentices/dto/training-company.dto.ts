import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';

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

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTrainingCompanyDto extends PartialType(
  CreateTrainingCompanyDto,
) {}

/** Filters of GET /training-companies (and its CSV export); all optional. */
export class ListTrainingCompaniesQuery extends ListPageQuery {
  /** Words matched against name, city, postal code, e-mail and external ref. */
  @IsOptional()
  @IsString()
  q?: string;
}

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
