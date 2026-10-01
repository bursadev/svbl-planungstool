import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../database/enums.js';

export const ROLES_KEY = 'roles';

/** Who may change master data and plans. */
export const WRITE_ROLES: UserRole[] = [UserRole.Planner, UserRole.Admin];

/**
 * Restricts a route to the given roles. Routes without it are open to every
 * signed-in role (reads); writes declare `@Roles(UserRole.Planner, UserRole.Admin)`.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
