import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ListPageQuery } from '../../common/list-query.js';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

/** Filters of GET /skills (and its CSV export); all optional. */
export class ListSkillsQuery extends ListPageQuery {
  /** Words matched against name, category and description. */
  @IsOptional()
  @IsString()
  q?: string;
}
