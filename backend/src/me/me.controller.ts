import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() userId: string) {
    return { userId };
  }
}
