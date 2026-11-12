import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Kunden and Teilnehmende leave the model: the tool plans üK, adult courses only
 * block instructors and rooms. Enrollments are apprentices only from here on.
 */
export class DropCustomers1794520914621 implements MigrationInterface {
  name = 'DropCustomers1794520914621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "enrollment" WHERE "participant_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_94e2397e21928f8285f1e45306b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_4508b68ab173756e69bd795614a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "CHK_8def0896c6ffa1d745236448e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "UQ_efd7578a92f399f7379a3c437e5"`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "customer_id"`);
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP COLUMN "participant_id"`,
    );
    await queryRunner.query(`DROP TABLE "participant"`);
    await queryRunner.query(`DROP TABLE "customer"`);
    await queryRunner.query(
      `ALTER TABLE "enrollment" ALTER COLUMN "apprentice_id" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollment" ALTER COLUMN "apprentice_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "address_line" text, "postal_code" text, "city" text, "contact_name" text, "contact_email" text, "contact_phone" text, "external_ref_abacus" text, "external_ref_odaorg" text, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "participant" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "customer_id" uuid, "first_name" text NOT NULL, "last_name" text NOT NULL, "email" text, "phone" text, "language" "public"."language" NOT NULL, "notes" text, CONSTRAINT "PK_64da4237f502041781ca15d4c41" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" ADD CONSTRAINT "FK_74f25d114b8d459b61a9698784b" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD "participant_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "location" ADD "customer_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "UQ_efd7578a92f399f7379a3c437e5" UNIQUE ("course_id", "participant_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "CHK_8def0896c6ffa1d745236448e3" CHECK ((num_nonnulls(apprentice_id, participant_id) = 1))`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_4508b68ab173756e69bd795614a" FOREIGN KEY ("participant_id") REFERENCES "participant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_94e2397e21928f8285f1e45306b" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
