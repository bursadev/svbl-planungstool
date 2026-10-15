import { IsInt, IsUUID, Max, Min } from 'class-validator';

/** Sets the travel time of a pair; stored in both directions. */
export class UpsertLocationDistanceDto {
  @IsUUID()
  fromLocationId: string;

  @IsUUID()
  toLocationId: string;

  /** Capped at a day so a typo cannot overflow the smallint column. */
  @IsInt()
  @Min(0)
  @Max(1440)
  travelMinutes: number;
}
