import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark a route handler/controller as not requiring a Clerk bearer token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
