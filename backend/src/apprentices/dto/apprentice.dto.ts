import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';
import { Language, Track } from '../../database/enums.js';

/**
 * Filters of GET /apprentices (and its CSV export); all optional. The archive
 * scope maps onto the status: active = `active`, archived = finished or dropped.
 */
export class ListApprenticesQuery extends ListPageQuery {
  /** Words matched against name, external id, e-mail, training company and class. */
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
  @IsUUID()
  trainingCompanyId?: string;

  @IsOptional()
  @IsEnum(Track)
  track?: Track;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
