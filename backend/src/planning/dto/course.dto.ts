import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';
import { IsDateOnly } from '../../common/validators.js';
import { CourseKind, CourseStatus, Language } from '../../database/enums.js';

export const STAFFING_FILTERS = ['unstaffed', 'staffed'] as const;
export type StaffingFilter = (typeof STAFFING_FILTERS)[number];

/** Filters of GET /courses (Durchführungen); all optional. Without `from` the list starts today. */
export class ListCoursesQuery extends ListPageQuery {
  @IsOptional()
  @IsDateOnly()
  from?: string;

  @IsOptional()
  @IsDateOnly()
  to?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  courseTypeId?: string;

  @IsOptional()
  @IsEnum(CourseKind)
  kind?: CourseKind;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  /** `unstaffed`: no assignment proposed or confirmed; `staffed`: at least one. */
  @IsOptional()
  @IsIn(STAFFING_FILTERS)
  staffing?: StaffingFilter;

  @IsOptional()
  @IsUUID()
  planningRunId?: string;

  /** Words matched against course type code and name, location name and the OdAOrg reference. */
  @IsOptional()
  @IsString()
  q?: string;
}
