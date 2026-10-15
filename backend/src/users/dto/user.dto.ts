import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserStatus } from '../../database/enums.js';

/**
 * What an admin may change: the role mirrors Clerk and is read-only here;
 * `instructorId` / `trainerId` link the account to its master-data person
 * (null unlinks).
 */
export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsUUID()
  instructorId?: string | null;

  @IsOptional()
  @IsUUID()
  trainerId?: string | null;
}
