import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { asInstructor, asPlanner, asRole, createTestApp } from './create-app.js';

const asAdmin = asRole('admin');
const KEY = 'e2e.test-setting';

describe('Settings (e2e)', () => {
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
    await ds.query(`DELETE FROM "setting" WHERE key LIKE 'e2e.%'`);
  }

  const api = () => request(app.getHttpServer());

  it('hides settings from non-planning roles and writes from non-admins', async () => {
    await api().get('/settings').set(asInstructor).expect(403);
    await api()
      .put(`/settings/${KEY}`)
      .set(asPlanner)
      .send({ value: 1 })
      .expect(403);
  });

  it('upserts, lists and deletes a setting', async () => {
    await api()
      .put('/settings/NOT a key')
      .set(asAdmin)
      .send({ value: 1 })
      .expect(400);
    await api().put(`/settings/${KEY}`).set(asAdmin).send({}).expect(400);

    const created = await api()
      .put(`/settings/${KEY}`)
      .set(asAdmin)
      .send({ value: { warnDays: 60 } })
      .expect(200);
    expect(created.body).toMatchObject({
      key: KEY,
      value: { warnDays: 60 },
      updatedBy: 'Test admin',
    });

    const updated = await api()
      .put(`/settings/${KEY}`)
      .set(asAdmin)
      .send({ value: { warnDays: 30 } })
      .expect(200);
    expect(updated.body.value).toEqual({ warnDays: 30 });

    const list = await api().get('/settings').set(asPlanner).expect(200);
    expect(list.body.map((s: { key: string }) => s.key)).toContain(KEY);

    await api().delete(`/settings/${KEY}`).set(asAdmin).expect(204);
    const after = await api().get('/settings').set(asAdmin).expect(200);
    expect(after.body.map((s: { key: string }) => s.key)).not.toContain(KEY);
  });
});
