import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { parseCsv } from '../src/common/csv.js';
import { asInstructor, asPlanner, createTestApp } from './create-app.js';

const byText = (a: string, b: string) => a.localeCompare(b);

/** CSV template, export, import, bulk actions, archive filter, search and paging of /customers and /participants. */
describe('Customers and participants CSV and bulk (e2e)', () => {
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
      `DELETE FROM "participant" WHERE last_name LIKE 'E2E-LBK-%'
         OR customer_id IN (SELECT id FROM "customer" WHERE name LIKE 'E2E-LBK-%')`,
    );
    await ds.query(`DELETE FROM "customer" WHERE name LIKE 'E2E-LBK-%'`);
  }

  const api = () => request(app.getHttpServer());
  const importCsv = (path: string, body: string, dryRun: boolean) =>
    api()
      .post(`${path}/import?dryRun=${dryRun}`)
      .set(asPlanner)
      .send({ csv: body });

  describe('customers', () => {
    const header =
      'Name;Adresse;PLZ;Ort;Kontakt;Kontakt E-Mail;Kontakt Telefon;Abacus-Nr.;OdAOrg-Ref.;Aktiv';
    const csv = (...lines: string[]) => [header, ...lines].join('\r\n');

    it('serves the template with header and two example rows', async () => {
      const res = await api()
        .get('/customers/import-template.csv')
        .set(asInstructor)
        .expect(200);
      expect(res.headers['content-disposition']).toContain(
        'kunden-vorlage.csv',
      );
      const rows = parseCsv(res.text);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual(header.split(';'));
    });

    it('reports errors per line and column and writes nothing', async () => {
      const res = await importCsv(
        '/customers',
        csv(
          'E2E-LBK-Kunde A;;;;;;;;;ja',
          'E2E-LBK-Kunde B;;;;;keine-mail;;;;',
          'e2e-lbk-kunde  a;;;;;;;;;',
        ),
        false,
      ).expect(200);
      expect(res.body.written).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          {
            line: 3,
            column: 'Kontakt E-Mail',
            message: 'Ungültige E-Mail-Adresse.',
          },
          {
            line: 4,
            column: 'Name',
            message: 'Doppelt in der Datei (Zeile 2).',
          },
        ]),
      );
      const count = await ds.query(
        `SELECT count(*)::int AS n FROM customer WHERE name LIKE 'E2E-LBK-%'`,
      );
      expect(count[0].n).toBe(0);
    });

    it('imports, re-imports its export unchanged and updates by name', async () => {
      const body = csv(
        'E2E-LBK-Kunde Älpli;Bahnhofstrasse 1;8000;Zürich;Peter Muster;;;;;ja',
        'E2E-LBK-Kunde Beta;;1003;Lausanne;;;;;4711;ja',
      );
      const dry = await importCsv('/customers', body, true).expect(200);
      expect(dry.body).toMatchObject({
        dryRun: true,
        written: false,
        created: 2,
        errors: [],
      });
      const real = await importCsv('/customers', body, false).expect(200);
      expect(real.body).toMatchObject({ written: true, created: 2 });

      const exported = await api()
        .get('/customers/export.csv?q=E2E-LBK')
        .set(asPlanner)
        .expect(200);
      expect(exported.headers['content-disposition']).toMatch(
        /kunden-\d{4}-\d{2}-\d{2}\.csv/,
      );
      expect(parseCsv(exported.text)[0]).toEqual(
        expect.arrayContaining(['Teilnehmende', 'Standorte']),
      );
      const again = await importCsv('/customers', exported.text, false).expect(
        200,
      );
      expect(again.body).toMatchObject({
        created: 0,
        updated: 0,
        unchanged: 2,
        errors: [],
      });

      const update = await importCsv(
        '/customers',
        'Name;Abacus-Nr.;Ort\r\nE2E-LBK-Kunde Beta;20001;',
        false,
      ).expect(200);
      expect(update.body).toMatchObject({
        updated: 1,
        created: 0,
        written: true,
        errors: [],
      });
      const [row] = await ds.query(
        `SELECT external_ref_abacus, external_ref_odaorg, city FROM customer WHERE name = 'E2E-LBK-Kunde Beta'`,
      );
      expect(row).toEqual({
        external_ref_abacus: '20001',
        external_ref_odaorg: '4711',
        city: null,
      });
    });

    it('searches ignoring accents and pages with X-Total-Count', async () => {
      const res = await api()
        .get('/customers?q=alpli%20zurich')
        .set(asPlanner)
        .expect(200);
      expect(res.body.map((c: { name: string }) => c.name)).toEqual([
        'E2E-LBK-Kunde Älpli',
      ]);
      const paged = await api()
        .get('/customers?q=E2E-LBK%20kunde&page=2&pageSize=1&sort=name')
        .set(asPlanner)
        .expect(200);
      expect(paged.headers['x-total-count']).toBe('2');
      expect(paged.body).toHaveLength(1);
    });

    it('archives and restores in bulk and filters by archive scope', async () => {
      const rows: { id: string }[] = await ds.query(
        `SELECT id FROM customer WHERE name LIKE 'E2E-LBK-%' ORDER BY name`,
      );
      const ids = rows.map((r) => r.id);
      await api()
        .post('/customers/bulk')
        .set(asInstructor)
        .send({ action: 'archive', ids })
        .expect(403);
      const archived = await api()
        .post('/customers/bulk')
        .set(asPlanner)
        .send({ action: 'archive', ids })
        .expect(200);
      expect(archived.body.failed).toEqual([]);
      expect([...(archived.body.succeeded as string[])].sort(byText)).toEqual(
        [...ids].sort(byText),
      );
      const active = await api()
        .get('/customers?q=E2E-LBK&archive=active')
        .set(asPlanner)
        .expect(200);
      expect(active.body).toHaveLength(0);
      const onlyArchived = await api()
        .get('/customers?q=E2E-LBK&archive=archived')
        .set(asPlanner)
        .expect(200);
      expect(onlyArchived.body).toHaveLength(2);
      await api()
        .post('/customers/bulk')
        .set(asPlanner)
        .send({ action: 'restore', ids })
        .expect(200);
      const after = await api()
        .get('/customers?q=E2E-LBK&archive=active')
        .set(asPlanner)
        .expect(200);
      expect(after.body).toHaveLength(2);
    });
  });

  describe('participants', () => {
    const header = 'Vorname;Nachname;E-Mail;Telefon;Sprache;Kunde;Bemerkungen';
    const csv = (...lines: string[]) => [header, ...lines].join('\r\n');

    it('serves the template', async () => {
      const res = await api()
        .get('/participants/import-template.csv')
        .set(asInstructor)
        .expect(200);
      expect(res.headers['content-disposition']).toContain(
        'teilnehmende-vorlage.csv',
      );
      expect(parseCsv(res.text)[0]).toEqual(header.split(';'));
    });

    it('reports unknown customers and languages and writes nothing', async () => {
      const res = await importCsv(
        '/participants',
        csv('Anna;E2E-LBK-Muster;;;Klingonisch;E2E-LBK-Unbekannt;'),
        false,
      ).expect(200);
      expect(res.body.written).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          {
            line: 2,
            column: 'Sprache',
            message: expect.stringContaining('Unbekannter Wert'),
          },
          {
            line: 2,
            column: 'Kunde',
            message: '«E2E-LBK-Unbekannt» nicht gefunden.',
          },
        ]),
      );
    });

    it('imports with the customer by name, re-imports its export unchanged and updates by e-mail or name + Kunde', async () => {
      const body = csv(
        'Anna;E2E-LBK-Müller;anna@e2e-lbk.ch;;Deutsch;E2E-LBK-Kunde Älpli;',
        'Luc;E2E-LBK-Bovet;;;Französisch;E2E-LBK-Kunde Beta;',
        'Luc;E2E-LBK-Bovet;;;Französisch;;privat',
      );
      const real = await importCsv('/participants', body, false).expect(200);
      expect(real.body).toMatchObject({
        written: true,
        created: 3,
        errors: [],
      });

      const exported = await api()
        .get('/participants/export.csv?q=E2E-LBK')
        .set(asPlanner)
        .expect(200);
      expect(exported.headers['content-disposition']).toMatch(
        /teilnehmende-\d{4}-\d{2}-\d{2}\.csv/,
      );
      const again = await importCsv(
        '/participants',
        exported.text,
        false,
      ).expect(200);
      expect(again.body).toMatchObject({
        created: 0,
        updated: 0,
        unchanged: 3,
        errors: [],
      });

      const update = await importCsv(
        '/participants',
        csv(
          'Annina;E2E-LBK-Müller;ANNA@e2e-lbk.ch;;Deutsch;E2E-LBK-Kunde Älpli;',
          'Luc;E2E-LBK-Bovet;;079 000 00 00;Französisch;;privat',
        ),
        false,
      ).expect(200);
      expect(update.body).toMatchObject({ updated: 2, created: 0, errors: [] });
      const rows = await ds.query(
        `SELECT first_name, phone FROM participant WHERE last_name LIKE 'E2E-LBK-%' ORDER BY first_name, phone`,
      );
      expect(rows).toEqual([
        { first_name: 'Annina', phone: null },
        { first_name: 'Luc', phone: '079 000 00 00' },
        { first_name: 'Luc', phone: null },
      ]);
    });

    it('searches, filters by customer and pages with X-Total-Count', async () => {
      const [customer] = await ds.query(
        `SELECT id FROM customer WHERE name = 'E2E-LBK-Kunde Beta'`,
      );
      const byCustomer = await api()
        .get(`/participants?q=E2E-LBK&customerId=${customer.id}`)
        .set(asPlanner)
        .expect(200);
      expect(byCustomer.body).toHaveLength(1);
      expect(byCustomer.body[0].customer).toMatchObject({
        name: 'E2E-LBK-Kunde Beta',
      });

      const accent = await api()
        .get('/participants?q=mueller%20annina')
        .set(asPlanner)
        .expect(200);
      expect(accent.body).toHaveLength(0);
      const plain = await api()
        .get('/participants?q=muller%20annina')
        .set(asPlanner)
        .expect(200);
      expect(plain.body).toHaveLength(1);

      const paged = await api()
        .get('/participants?q=E2E-LBK&page=2&pageSize=2&sort=name')
        .set(asPlanner)
        .expect(200);
      expect(paged.headers['x-total-count']).toBe('3');
      expect(paged.body.map((p: { lastName: string }) => p.lastName)).toEqual([
        'E2E-LBK-Müller',
      ]);
    });

    it('cannot archive, deletes in bulk, and a customer with participants is not deleted', async () => {
      const rows: { id: string }[] = await ds.query(
        `SELECT id FROM participant WHERE last_name = 'E2E-LBK-Bovet' AND customer_id IS NULL`,
      );
      await api()
        .post('/participants/bulk')
        .set(asPlanner)
        .send({ action: 'archive', ids: rows.map((r) => r.id) })
        .expect(400);
      const deleted = await api()
        .post('/participants/bulk')
        .set(asPlanner)
        .send({ action: 'delete', ids: rows.map((r) => r.id) })
        .expect(200);
      expect(deleted.body).toEqual({
        succeeded: rows.map((r) => r.id),
        failed: [],
      });

      const customers: { id: string; name: string }[] = await ds.query(
        `SELECT id, name FROM customer WHERE name LIKE 'E2E-LBK-%' ORDER BY name`,
      );
      const res = await api()
        .post('/customers/bulk')
        .set(asPlanner)
        .send({ action: 'delete', ids: customers.map((c) => c.id) })
        .expect(200);
      expect(res.body.succeeded).toEqual([]);
      expect(res.body.failed).toEqual(
        expect.arrayContaining(
          customers.map((c) => ({
            id: c.id,
            label: c.name,
            message: 'Wird noch von Teilnehmenden verwendet.',
          })),
        ),
      );
      expect(res.body.failed).toHaveLength(2);
    });
  });
});
