import { MigrationInterface, QueryRunner } from 'typeorm';

export class DemandLanguage1794530353550 implements MigrationInterface {
  name = 'DemandLanguage1794530353550';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "demand" ADD "language" "public"."language" NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "demand" DROP COLUMN "language"`);
  }
}
