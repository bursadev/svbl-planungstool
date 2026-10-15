import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { asInstructor, asPlanner, asRole, createTestApp } from './create-app.js';

const asAdmin = asRole('admin');
/** A dedicated account the test may deactivate without affecting other specs. */
const asTarget = { ...asRole('sales'), 'x-test-user': 'test_e2e_target' };

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM "audit_entry" WHERE actor_user_id IN
         (SELECT id FROM "user" WHERE clerk_user_id = 'test_e2e_target')`,
    );
    await ds.query(
      `DELETE FROM "user" WHERE clerk_user_id = 'test_e2e_target'`,
    );
  }

  const api = () => request(app.getHttpServer());

  it('hides the list from non-planning roles', async () => {
    await api().get('/users').set(asInstructor).expect(403);
  });

  it('lists accounts for planners and admins', async () => {
    // Signing in as the target once creates its mirrored row.
    await api().get('/me').set(asTarget).expect(200);

    const list = await api().get('/users').set(asPlanner).expect(200);
    const target = list.body.find(
      (user: { email: string }) => user.email === 'test_e2e_target@test.svbl.ch',
    );
    expect(target).toMatchObject({
      role: 'sales',
      status: 'active',
      instructor: null,
      trainer: null,
    });
  });

  it('lets only admins change status and links', async () => {
    const list = await api().get('/users').set(asAdmin).expect(200);
    const target = list.body.find(
      (user: { email: string }) => user.email === 'test_e2e_target@test.svbl.ch',
    );

    await api()
      .patch(`/users/${target.id}`)
      .set(asPlanner)
      .send({ status: 'disabled' })
      .expect(403);

    await api()
      .patch(`/users/${target.id}`)
      .set(asAdmin)
      .send({ instructorId: '00000000-0000-0000-0000-000000000000' })
      .expect(400);

    const updated = await api()
      .patch(`/users/${target.id}`)
      .set(asAdmin)
      .send({ status: 'disabled' })
      .expect(200);
    expect(updated.body.status).toBe('disabled');
  });

  it('blocks a disabled account on its next request', async () => {
    const res = await api().get('/me').set(asTarget).expect(403);
    expect(res.body.message).toBe('Konto deaktiviert.');
  });
});
