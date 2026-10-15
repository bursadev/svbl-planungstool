import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Filters of GET /participants; all optional. */
export class ListParticipantsQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
