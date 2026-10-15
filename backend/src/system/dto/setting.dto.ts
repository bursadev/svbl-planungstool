import { IsDefined } from 'class-validator';

export class UpsertSettingDto {
  /** Any JSON value; stored as jsonb. */
  @IsDefined()
  value: unknown;
}
