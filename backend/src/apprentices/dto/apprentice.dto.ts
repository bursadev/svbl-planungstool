import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Track } from '../../database/enums.js';

/** Filters of GET /apprentices; all optional. */
export class ListApprenticesQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  vocationalSchoolId?: string;

  @IsOptional()
  @IsUUID()
  cohortId?: string;

  @IsOptional()
  @IsEnum(Track)
  track?: Track;
}
