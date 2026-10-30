import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

/** CSV template, export, import, bulk actions, archive filter and search of the Kataloge. */
describe('Catalogs CSV and bulk (e2e)', () => {
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
    // Qualifications go with their device type (ON DELETE CASCADE).
    await ds.query(`DELETE FROM "device_type" WHERE code LIKE 'E2E-KAT-%'`);
    await ds.query(
      `DELETE FROM "certificate_type" WHERE code LIKE 'E2E-KAT-%'`,
    );
    await ds.query(`DELETE FROM "skill" WHERE name LIKE 'E2E-KAT %'`);
  }

  const api = () => request(app.getHttpServer());
  const importCsv = (path: string, body: string, dryRun: boolean) =>
    api()
      .post(`${path}/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });

  describe('skills', () => {
    it('serves the template', async () => {
      const res = await api()
        .get('/skills/import-template.csv')
        .set(asInstructor)
        .expect(200);
      expect(res.headers['content-disposition']).toContain(
        'skills-vorlage.csv',
      );
      const rows = parseCsv(res.text);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual(['Name', 'Kategorie', 'Beschreibung', 'Aktiv']);
    });

    it('imports by name, re-imports its export unchanged and searches ignoring accents', async () => {
      const body = [
        'Name;Kategorie;Beschreibung;Aktiv',
        'E2E-KAT Kran;Geräte;Darf Kran;ja',
        'E2E-KAT Hebebühne;Geräte;;ja',
      ].join('\r\n');
      const real = await importCsv('/skills', body, false).expect(200);
      expect(real.body).toMatchObject({
        written: true,
        created: 2,
        errors: [],
      });

      const exported = await api()
        .get('/skills/export.csv?q=E2E-KAT')
        .set(asPlanner)
        .expect(200);
      expect(exported.headers['content-disposition']).toMatch(
        /skills-\d{4}-\d{2}-\d{2}\.csv/,
      );
      const again = await importCsv('/skills', exported.text, false).expect(
        200,
      );
      expect(again.body).toMatchObject({
        created: 0,
        updated: 0,
        unchanged: 2,
        errors: [],
      });

      // An empty nullable cell clears; columns that are not in the file stay.
      const update = await importCsv(
        '/skills',
        'Name;Kategorie\r\nE2E-KAT Kran;',
        false,
      ).expect(200);
      expect(update.body).toMatchObject({ updated: 1, written: true });
      const [row] = await ds.query(
        `SELECT category, description FROM skill WHERE name = 'E2E-KAT Kran'`,
      );
      expect(row).toEqual({ category: null, description: 'Darf Kran' });

      const found = await api()
        .get('/skills?q=e2e-kat%20hebebuhne')
        .set(asPlanner)
        .expect(200);
      expect(found.body.map((s: { name: string }) => s.name)).toEqual([
        'E2E-KAT Hebebühne',
      ]);
      expect(found.headers['x-total-count']).toBe('1');
    });

    it('archives and restores in bulk and filters by archive scope', async () => {
      const rows: { id: string }[] = await ds.query(
        `SELECT id FROM skill WHERE name LIKE 'E2E-KAT %' ORDER BY name`,
      );
      const ids = rows.map((r) => r.id);
      await api()
        .post('/skills/bulk')
        .set(asInstructor)
        .send({ action: 'archive', ids })
        .expect(403);
      const res = await api()
        .post('/skills/bulk')
        .set(asPlanner)
        .send({ action: 'archive', ids })
        .expect(200);
      expect(res.body.failed).toEqual([]);
      expect(res.body.succeeded).toEqual(expect.arrayContaining(ids));
      expect(res.body.succeeded).toHaveLength(ids.length);

      const active = await api()
        .get('/skills?q=E2E-KAT&archive=active')
        .set(asPlanner)
        .expect(200);
      expect(active.body).toHaveLength(0);
      const all = await api()
        .get('/skills?q=E2E-KAT')
        .set(asPlanner)
        .expect(200);
      expect(all.body).toHaveLength(2);

      await api()
        .post('/skills/bulk')
        .set(asPlanner)
        .send({ action: 'restore', ids })
        .expect(200);
      const restored = await api()
        .get('/skills?q=E2E-KAT&archive=archived')
        .set(asPlanner)
        .expect(200);
      expect(restored.body).toHaveLength(0);
    });
  });

  describe('certificate types', () => {
    const header =
      'Code;Name;Aussteller;Gültigkeit (Jahre);Warnfrist (Tage);Mindestanzahl pro Jahr;Aktiv';

    it('reports errors per line and column and writes nothing', async () => {
      const res = await importCsv(
        '/certificate-types',
        [header, 'E2E-KAT-A;Alpha;;99;60;;ja', 'E2E-KAT-B;;;;viele;;'].join(
          '\r\n',
        ),
        false,
      ).expect(200);
      expect(res.body.written).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          {
            line: 2,
            column: 'Gültigkeit (Jahre)',
            message: expect.any(String),
          },
          {
            line: 3,
            column: 'Warnfrist (Tage)',
            message: 'Ganze Zahl erwartet.',
          },
        ]),
      );
      const count = await ds.query(
        `SELECT count(*)::int AS n FROM certificate_type WHERE code LIKE 'E2E-KAT-%'`,
      );
      expect(count[0].n).toBe(0);
    });

    it('imports by code, re-imports its export unchanged and archives', async () => {
      const body = [
        header,
        'E2E-KAT-A;Älpli Zertifikat;SUVA;5;60;2;ja',
        'E2E-KAT-B;Beta;;;90;;ja',
      ].join('\r\n');
      const real = await importCsv('/certificate-types', body, false).expect(
        200,
      );
      expect(real.body).toMatchObject({
        written: true,
        created: 2,
        errors: [],
      });

      const exported = await api()
        .get('/certificate-types/export.csv?q=E2E-KAT')
        .set(asPlanner)
        .expect(200);
      expect(parseCsv(exported.text)[0]).toEqual(header.split(';'));
      const again = await importCsv(
        '/certificate-types',
        exported.text,
        false,
      ).expect(200);
      expect(again.body).toMatchObject({
        created: 0,
        updated: 0,
        unchanged: 2,
        errors: [],
      });

      const found = await api()
        .get('/certificate-types?q=alpli')
        .set(asPlanner)
        .expect(200);
      expect(found.body.map((c: { code: string }) => c.code)).toEqual([
        'E2E-KAT-A',
      ]);
      expect(found.body[0]).toMatchObject({
        active: true,
        maintenanceCourseTypes: [],
      });

      const [b] = await ds.query(
        `SELECT id FROM certificate_type WHERE code = 'E2E-KAT-B'`,
      );
      await api()
        .post('/certificate-types/bulk')
        .set(asPlanner)
        .send({ action: 'archive', ids: [b.id] })
        .expect(200);
      const active = await api()
        .get('/certificate-types?q=E2E-KAT&archive=active')
        .set(asPlanner)
        .expect(200);
      expect(active.body.map((c: { code: string }) => c.code)).toEqual([
        'E2E-KAT-A',
      ]);

      // The dialog restores through PATCH.
      const patched = await api()
        .patch(`/certificate-types/${b.id}`)
        .set(asPlanner)
        .send({ active: true })
        .expect(200);
      expect(patched.body.active).toBe(true);
    });
  });

  describe('device types', () => {
    const header = 'Code;Name;Kategorie;Aktiv;Zertifikatstypen;Skills';

    it('resolves qualifications by code and name and reports unknown ones', async () => {
      const bad = await importCsv(
        '/device-types',
        [header, 'E2E-KAT-DT1;Stapler;Stapler;ja;E2E-KAT-NOPE;'].join('\r\n'),
        true,
      ).expect(200);
      expect(bad.body.errors).toEqual([
        {
          line: 2,
          column: 'Zertifikatstypen',
          message: '«E2E-KAT-NOPE» nicht gefunden.',
        },
      ]);

      const body = [
        header,
        'E2E-KAT-DT1;Stapler Test;Stapler;ja;E2E-KAT-A, e2e-kat-b;E2E-KAT Kran',
        'E2E-KAT-DT2;Kran Test;crane;ja;;',
      ].join('\r\n');
      const real = await importCsv('/device-types', body, false).expect(200);
      expect(real.body).toMatchObject({
        written: true,
        created: 2,
        errors: [],
      });

      const list = await api()
        .get('/device-types?q=E2E-KAT-DT1')
        .set(asPlanner)
        .expect(200);
      expect(list.body).toHaveLength(1);
      expect(
        list.body[0].qualifications.certificateTypes
          .map((c: { code: string }) => c.code)
          .sort(),
      ).toEqual(['E2E-KAT-A', 'E2E-KAT-B']);
      expect(
        list.body[0].qualifications.skills.map((s: { name: string }) => s.name),
      ).toEqual(['E2E-KAT Kran']);

      const exported = await api()
        .get('/device-types/export.csv?q=E2E-KAT')
        .set(asPlanner)
        .expect(200);
      const again = await importCsv(
        '/device-types',
        exported.text,
        false,
      ).expect(200);
      expect(again.body).toMatchObject({
        created: 0,
        updated: 0,
        unchanged: 2,
        errors: [],
      });

      // An empty cell clears that kind of qualification; a missing column keeps it.
      const update = await importCsv(
        '/device-types',
        'Code;Skills\r\nE2E-KAT-DT1;',
        false,
      ).expect(200);
      expect(update.body).toMatchObject({
        updated: 1,
        written: true,
        errors: [],
      });
      const after = await api()
        .get('/device-types?q=E2E-KAT-DT1')
        .set(asPlanner)
        .expect(200);
      expect(after.body[0].qualifications.skills).toEqual([]);
      expect(after.body[0].qualifications.certificateTypes).toHaveLength(2);
    });

    it('deletes in bulk and reports referenced catalog entries as failed', async () => {
      const certs: { id: string; code: string }[] = await ds.query(
        `SELECT id, code FROM certificate_type WHERE code LIKE 'E2E-KAT-%' ORDER BY code`,
      );
      const res = await api()
        .post('/certificate-types/bulk')
        .set(asPlanner)
        .send({ action: 'delete', ids: certs.map((c) => c.id) })
        .expect(200);
      expect(res.body.succeeded).toEqual([]);
      expect(res.body.failed).toHaveLength(2);
      expect(res.body.failed).toEqual(
        expect.arrayContaining([
          {
            id: certs[0].id,
            label: 'Älpli Zertifikat',
            message: 'Wird noch von Gerätetypen verwendet.',
          },
          {
            id: certs[1].id,
            label: 'Beta',
            message: 'Wird noch von Gerätetypen verwendet.',
          },
        ]),
      );

      const types: { id: string }[] = await ds.query(
        `SELECT id FROM device_type WHERE code LIKE 'E2E-KAT-%'`,
      );
      const deleted = await api()
        .post('/device-types/bulk')
        .set(asPlanner)
        .send({ action: 'delete', ids: types.map((t) => t.id) })
        .expect(200);
      expect(deleted.body.failed).toEqual([]);
      expect(deleted.body.succeeded).toHaveLength(2);

      // Without the device types nothing references the skills any more.
      const skills: { id: string }[] = await ds.query(
        `SELECT id FROM skill WHERE name LIKE 'E2E-KAT %'`,
      );
      const skillsDeleted = await api()
        .post('/skills/bulk')
        .set(asPlanner)
        .send({ action: 'delete', ids: skills.map((s) => s.id) })
        .expect(200);
      expect(skillsDeleted.body).toMatchObject({ failed: [] });
    });
  });
});
