import { MigrationInterface, QueryRunner } from 'typeorm';

export class StammdatenArchive1793361056670 implements MigrationInterface {
  name = 'StammdatenArchive1793361056670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Accent-insensitive list search («zurich» finds «Zürich»).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    await queryRunner.query(
      `ALTER TABLE "training_company" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_type" ADD "active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificate_type" DROP COLUMN "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_company" DROP COLUMN "active"`,
    );
  }
}
