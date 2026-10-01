import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

describe('Me (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app
      .get(DataSource)
      .getRepository(User)
      .delete({ clerkUserId: 'test_planner' });
    await app
      .get(DataSource)
      .getRepository(User)
      .delete({ clerkUserId: 'test_instructor' });
    await app.close();
  });

  it('answers 401 without a role header, shaped by the exception filter', async () => {
    const res = await request(app.getHttpServer()).get('/me').expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: 'Nicht angemeldet.' });
  });

  it('returns the signed-in user and mirrors it into the user table', async () => {
    const res = await request(app.getHttpServer())
      .get('/me')
      .set(asPlanner)
      .expect(200);
    expect(res.body).toEqual({
      userId: 'test_planner',
      role: 'planner',
      email: 'test_planner@test.svbl.ch',
      displayName: 'Test planner',
    });
    const row = await app
      .get(DataSource)
      .getRepository(User)
      .findOneBy({ clerkUserId: 'test_planner' });
    expect(row?.role).toBe('planner');
    expect(row?.lastLoginAt).toBeInstanceOf(Date);
  });

  it('answers 404 in German for unknown routes', async () => {
    const res = await request(app.getHttpServer())
      .get('/does-not-exist')
      .set(asInstructor)
      .expect(404);
    expect(res.body.message).toBe('Nicht gefunden.');
  });
});
