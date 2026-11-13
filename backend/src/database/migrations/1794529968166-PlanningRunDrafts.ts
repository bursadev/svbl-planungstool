import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlanningRunDrafts1794529968166 implements MigrationInterface {
  name = 'PlanningRunDrafts1794529968166';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "demand_apprentice" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "demand_id" uuid NOT NULL, "apprentice_id" uuid NOT NULL, CONSTRAINT "PK_3577278a9b5cb3cf6cd6c2d84ed" PRIMARY KEY ("demand_id", "apprentice_id"))`,
    );
    await queryRunner.query(`ALTER TABLE "planning_run" ADD "readiness" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "planning_run" ADD "demand_summary" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD "blocked_weekdays" smallint array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD "existing_free_seats" smallint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD "planning_run_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7652b5ad0cc8c1cc086fb02c54" ON "enrollment"  ("planning_run_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "demand_apprentice" ADD CONSTRAINT "FK_8f1de546f37c50a8bdb58fc4c19" FOREIGN KEY ("demand_id") REFERENCES "demand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand_apprentice" ADD CONSTRAINT "FK_003c8745ef70ba89b2154006835" FOREIGN KEY ("apprentice_id") REFERENCES "apprentice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_7652b5ad0cc8c1cc086fb02c543" FOREIGN KEY ("planning_run_id") REFERENCES "planning_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_7652b5ad0cc8c1cc086fb02c543"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand_apprentice" DROP CONSTRAINT "FK_003c8745ef70ba89b2154006835"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand_apprentice" DROP CONSTRAINT "FK_8f1de546f37c50a8bdb58fc4c19"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7652b5ad0cc8c1cc086fb02c54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP COLUMN "planning_run_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP COLUMN "existing_free_seats"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP COLUMN "blocked_weekdays"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_run" DROP COLUMN "demand_summary"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_run" DROP COLUMN "readiness"`,
    );
    await queryRunner.query(`DROP TABLE "demand_apprentice"`);
  }
}
