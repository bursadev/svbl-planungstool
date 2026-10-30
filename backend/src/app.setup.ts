import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { buildValidationPipe } from './common/validation.js';

/** Pipes and filters shared by main.ts and the e2e tests, so both behave alike. */
export function configureApp(app: INestApplication): void {
  // CSV imports send the whole file as JSON; the default limit is 100 kB.
  (app as NestExpressApplication).useBodyParser('json', { limit: '10mb' });
  app.useGlobalPipes(buildValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
}
