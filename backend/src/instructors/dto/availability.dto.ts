import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsDateOnly } from '../../common/validators.js';
import { AvailabilityKind, AvailabilityStatus } from '../../database/enums.js';

export class CreateAvailabilityDto {
  @IsDateOnly()
  startsOn: string;

  @IsDateOnly()
  endsOn: string;

  @IsEnum(AvailabilityKind)
  kind: AvailabilityKind;

  /** Planners may set it directly; omitted: vacation → requested, else approved. */
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus;

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class UpdateAvailabilityDto extends PartialType(CreateAvailabilityDto) {}
