import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';

/** Filters of GET /participants (and its CSV export); all optional. Participants cannot be archived, so `archive` is ignored. */
export class ListParticipantsQuery extends ListPageQuery {
  /** Words matched against first name, last name, e-mail and the customer's name. */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
