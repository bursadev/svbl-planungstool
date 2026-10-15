import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Language } from '../../database/enums.js';

export class CreateParticipantDto {
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

  @IsEnum(Language)
  language: Language;

  /** The company that sent the participant; null for private participants. */
  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateParticipantDto extends PartialType(CreateParticipantDto) {}
