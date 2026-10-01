import 'dotenv/config';
import { DataSource, QueryRunner } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/database.options.js';

/**
 * Proves that the entities, the migrations and the database agree, and that
 * the constraints the schema itself enforces actually fire. Runs against the
 * configured database (DATABASE_URL or DB_*), applies pending migrations, and
 * rolls every test insert back.
 */
describe('Schema', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = new DataSource(buildDataSourceOptions());
    await ds.initialize();
    await ds.runMigrations();
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('migrations match the entities (migration:generate would be empty)', async () => {
    const diff = await ds.driver.createSchemaBuilder().log();
    const pending = diff.upQueries.map((q) => q.query);
    expect(pending).toEqual([]);
  });

  describe('constraints', () => {
    let qr: QueryRunner;

    beforeEach(async () => {
      qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
    });

    afterEach(async () => {
      await qr.rollbackTransaction();
      await qr.release();
    });

    async function location(code: string): Promise<string> {
      const [row] = await qr.query(
        `INSERT INTO "location" (code, name, kind, language_region)
         VALUES ($1, $1, 'training_centre', 'de') RETURNING id`,
        [code],
      );
      return row.id;
    }

    async function instructor(locationId: string): Promise<string> {
      const [row] = await qr.query(
        `INSERT INTO "instructor" (first_name, last_name, employment_type, home_location_id, languages)
         VALUES ('Test', 'Instructor', 'employee', $1, '{de}') RETURNING id`,
        [locationId],
      );
      return row.id;
    }

    async function courseWithDay(
      locationId: string,
    ): Promise<{ courseId: string; courseDayId: string }> {
      const [type] = await qr.query(
        `INSERT INTO "course_type" (code, name, kind, duration_days, languages, max_participants)
         VALUES ('T-1', 'Test', 'adult', 1, '{de}', 8) RETURNING id`,
      );
      const [course] = await qr.query(
        `INSERT INTO "course" (course_type_id, location_id, language, capacity)
         VALUES ($1, $2, 'de', 8) RETURNING id`,
        [type.id, locationId],
      );
      const [day] = await qr.query(
        `INSERT INTO "course_day" (course_id, held_on, starts_at, ends_at, sequence)
         VALUES ($1, '2026-10-05', '08:00', '16:30', 1) RETURNING id`,
        [course.id],
      );
      return { courseId: course.id, courseDayId: day.id };
    }

    it('rejects an availability that ends before it starts', async () => {
      const loc = await location('T1');
      const ins = await instructor(loc);
      await expect(
        qr.query(
          `INSERT INTO "availability" (instructor_id, starts_on, ends_on, kind, status)
           VALUES ($1, '2026-10-10', '2026-10-01', 'vacation', 'requested')`,
          [ins],
        ),
      ).rejects.toThrow(/check constraint/i);
    });

    it('rejects a course day that ends before it starts', async () => {
      const loc = await location('T1');
      const { courseId } = await courseWithDay(loc);
      await expect(
        qr.query(
          `INSERT INTO "course_day" (course_id, held_on, starts_at, ends_at, sequence)
           VALUES ($1, '2026-10-06', '16:00', '08:00', 2)`,
          [courseId],
        ),
      ).rejects.toThrow(/check constraint/i);
    });

    it('allows one whole-course assignment per instructor and course', async () => {
      const loc = await location('T1');
      const ins = await instructor(loc);
      const { courseId } = await courseWithDay(loc);
      await qr.query(
        `INSERT INTO "assignment" (course_id, instructor_id) VALUES ($1, $2)`,
        [courseId, ins],
      );
      await expect(
        qr.query(
          `INSERT INTO "assignment" (course_id, instructor_id) VALUES ($1, $2)`,
          [courseId, ins],
        ),
      ).rejects.toThrow(/unique/i);
    });

    it('allows one reservation per device and date', async () => {
      const loc = await location('T1');
      const { courseDayId } = await courseWithDay(loc);
      const [type] = await qr.query(
        `INSERT INTO "device_type" (code, name, category) VALUES ('DT', 'Test', 'forklift') RETURNING id`,
      );
      const [dev] = await qr.query(
        `INSERT INTO "device" (device_type_id, inventory_number, home_location_id)
         VALUES ($1, 'INV-1', $2) RETURNING id`,
        [type.id, loc],
      );
      await qr.query(
        `INSERT INTO "device_reservation" (device_id, course_day_id, reserved_on)
         VALUES ($1, $2, '2026-10-05')`,
        [dev.id, courseDayId],
      );
      await expect(
        qr.query(
          `INSERT INTO "device_reservation" (device_id, course_day_id, reserved_on)
           VALUES ($1, $2, '2026-10-05')`,
          [dev.id, courseDayId],
        ),
      ).rejects.toThrow(/unique/i);
    });

    it('requires exactly one of apprentice or participant on an enrollment', async () => {
      const loc = await location('T1');
      const { courseId } = await courseWithDay(loc);
      await expect(
        qr.query(`INSERT INTO "enrollment" (course_id) VALUES ($1)`, [
          courseId,
        ]),
      ).rejects.toThrow(/check constraint/i);
    });

    it('keeps a device qualification to one of certificate or skill', async () => {
      const [type] = await qr.query(
        `INSERT INTO "device_type" (code, name, category) VALUES ('DT', 'Test', 'forklift') RETURNING id`,
      );
      await expect(
        qr.query(
          `INSERT INTO "device_type_qualification" (device_type_id) VALUES ($1)`,
          [type.id],
        ),
      ).rejects.toThrow(/check constraint/i);
    });

    it('limits curriculum modules to semesters 1 to 6', async () => {
      const [type] = await qr.query(
        `INSERT INTO "course_type" (code, name, kind, track, duration_days, languages, max_participants)
         VALUES ('UK-T', 'Test', 'uk', 'efz', 2, '{de}', 12) RETURNING id`,
      );
      await expect(
        qr.query(
          `INSERT INTO "curriculum_module" (track, course_type_id, semester, sequence)
           VALUES ('efz', $1, 7, 1)`,
          [type.id],
        ),
      ).rejects.toThrow(/check constraint/i);
    });
  });
});
