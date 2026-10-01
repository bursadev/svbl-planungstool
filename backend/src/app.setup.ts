import type { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { buildValidationPipe } from './common/validation.js';

/** Pipes and filters shared by main.ts and the e2e tests, so both behave alike. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(buildValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
}
