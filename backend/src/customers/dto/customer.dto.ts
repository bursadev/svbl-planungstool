import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';

export class CreateCustomerDto {
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
  @IsString()
  contactName?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  /** Reference in Abacus, the leading system for invoicing. */
  @IsOptional()
  @IsString()
  externalRefAbacus?: string | null;

  @IsOptional()
  @IsString()
  externalRefOdaorg?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

/** Filters of GET /customers (and its CSV export); all optional. */
export class ListCustomersQuery extends ListPageQuery {
  /** Words matched against name, address, city, contact and the external refs. */
  @IsOptional()
  @IsString()
  q?: string;
}
