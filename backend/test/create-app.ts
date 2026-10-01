import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard.js';
import { TestAuthGuard } from './test-auth.guard.js';

/** Boots the app for e2e tests with the header-based auth stub and the real pipes/filters. */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ClerkAuthGuard)
    .useClass(TestAuthGuard)
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

/** Headers for a request as the given role. */
export const asRole = (role: string): Record<string, string> => ({
  'x-test-role': role,
});
export const asPlanner = asRole('planner');
export const asInstructor = asRole('instructor');
