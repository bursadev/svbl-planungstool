import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1790850698308 implements MigrationInterface {
  name = 'Init1790850698308';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."track" AS ENUM('efz', 'eba')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cohort" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "track" "public"."track" NOT NULL, "start_year" smallint NOT NULL, "label" text NOT NULL, "expected_end_year" smallint, CONSTRAINT "UQ_1e687e5775fdf362dddc2721614" UNIQUE ("track", "start_year"), CONSTRAINT "PK_4fb3cca38dc4b461110344e5f9b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "address_line" text, "postal_code" text, "city" text, "contact_name" text, "contact_email" text, "contact_phone" text, "external_ref_abacus" text, "external_ref_odaorg" text, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."room_kind" AS ENUM('theory', 'practice_hall', 'outdoor')`,
    );
    await queryRunner.query(
      `CREATE TABLE "room" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "location_id" uuid NOT NULL, "name" text NOT NULL, "kind" "public"."room_kind" NOT NULL, "capacity" smallint, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_1c366dc84989a4bfd9e0344655c" UNIQUE ("location_id", "name"), CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."location_kind" AS ENUM('training_centre', 'customer_site')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."language" AS ENUM('de', 'fr', 'it')`,
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" text NOT NULL, "name" text NOT NULL, "kind" "public"."location_kind" NOT NULL, "address_line" text, "postal_code" text, "city" text, "canton" text, "language_region" "public"."language" NOT NULL, "hosts_uk" boolean NOT NULL DEFAULT false, "parallel_course_capacity" smallint NOT NULL DEFAULT '1', "contact_name" text, "contact_email" text, "contact_phone" text, "active" boolean NOT NULL DEFAULT true, "customer_id" uuid, CONSTRAINT "UQ_50d67b2c22be390e74257516ab8" UNIQUE ("code"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vocational_school" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "short_name" text NOT NULL, "address_line" text, "postal_code" text, "city" text, "canton" text, "language" "public"."language" NOT NULL, "nearest_location_id" uuid NOT NULL, "contact_name" text, "contact_email" text, "contact_phone" text, "import_mapping" jsonb, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_18bc9a3a4e376b2afc107a05b93" UNIQUE ("short_name"), CONSTRAINT "PK_64e6085a2abb7cc00383149d2ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_company" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "address_line" text, "postal_code" text, "city" text, "email" text, "phone" text, "external_ref" text, CONSTRAINT "PK_b13539956c657ea2bc6dc227a8a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46b88c72a72b244bdbcaf265ec" ON "training_company"  ("name", "postal_code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "trainer" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "training_company_id" uuid NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "email" text, "phone" text, CONSTRAINT "PK_8dfa741df6d52a0da8ad93f0c7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce2cdec7da2cbe6593e00ac502" ON "trainer"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."availability_kind" AS ENUM('vacation', 'training', 'sick', 'blocked', 'available')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."availability_status" AS ENUM('requested', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."availability_source" AS ENUM('manual', 'request', 'import')`,
    );
    await queryRunner.query(
      `CREATE TABLE "availability" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "instructor_id" uuid NOT NULL, "starts_on" date NOT NULL, "ends_on" date NOT NULL, "kind" "public"."availability_kind" NOT NULL, "status" "public"."availability_status" NOT NULL, "source" "public"."availability_source" NOT NULL DEFAULT 'manual', "requested_by_user_id" uuid, "decided_by_user_id" uuid, "decided_at" TIMESTAMP WITH TIME ZONE, "note" text, CONSTRAINT "CHK_9149c207e2d3bebe65b38e4d1c" CHECK ("starts_on" <= "ends_on"), CONSTRAINT "PK_05a8158cf1112294b1c86e7f1d3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05fdcbbe8fe5ce0e02d25f4770" ON "availability"  ("instructor_id", "starts_on", "ends_on") `,
    );
    await queryRunner.query(
      `CREATE TABLE "certificate_type" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" text NOT NULL, "name" text NOT NULL, "issuer" text, "validity_years" smallint, "warning_lead_days" smallint NOT NULL DEFAULT '60', "maintenance_min_per_year" smallint, CONSTRAINT "UQ_288478e8973aba62a4183d4d2b8" UNIQUE ("code"), CONSTRAINT "PK_fb10346b2786aa1b347abc5698f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "instructor_certificate" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "instructor_id" uuid NOT NULL, "certificate_type_id" uuid NOT NULL, "issued_on" date NOT NULL, "valid_until" date, "document_url" text, "notes" text, CONSTRAINT "PK_9a2f65c9b85f64fd8ea1b178411" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ad3e35e391b531fe5efaeb229" ON "instructor_certificate"  ("instructor_id", "certificate_type_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "skill" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "category" text, "description" text, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_0f49a593960360f6f85b692aca8" UNIQUE ("name"), CONSTRAINT "PK_a0d33334424e64fb78dc3ce7196" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "instructor_skill" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "instructor_id" uuid NOT NULL, "skill_id" uuid NOT NULL, "level" smallint, "since" date, CONSTRAINT "PK_3f9910d03c721c59663aecac536" PRIMARY KEY ("instructor_id", "skill_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employment_type" AS ENUM('employee', 'freelancer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."instructor_status" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "instructor" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "first_name" text NOT NULL, "last_name" text NOT NULL, "email" text, "phone" text, "employment_type" "public"."employment_type" NOT NULL, "home_location_id" uuid NOT NULL, "languages" "public"."language" array NOT NULL, "weekly_hours" numeric(5,2), "overtime_cap_hours" numeric(6,2), "cost_rate" numeric(8,2), "max_travel_minutes" smallint, "preferences" jsonb, "external_ref" text, "status" "public"."instructor_status" NOT NULL DEFAULT 'active', CONSTRAINT "PK_ccc0348eefb581ca002c05ef2f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bef4de89232d942dabf9955131" ON "instructor"  ("last_name", "first_name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('planner', 'sales', 'management', 'instructor', 'trainer', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "clerk_user_id" text NOT NULL, "email" text NOT NULL, "display_name" text NOT NULL, "role" "public"."user_role" NOT NULL, "locale" "public"."language" NOT NULL DEFAULT 'de', "status" "public"."user_status" NOT NULL DEFAULT 'active', "last_login_at" TIMESTAMP WITH TIME ZONE, "instructor_id" uuid, "trainer_id" uuid, CONSTRAINT "UQ_873d74a8afd42c769d239675213" UNIQUE ("clerk_user_id"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_11c03fb8b962b9a304677f462f4" UNIQUE ("instructor_id"), CONSTRAINT "UQ_0f49a555b6e5fe09cad43ae52ac" UNIQUE ("trainer_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_source" AS ENUM('planning_excel', 'school_export', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_batch_status" AS ENUM('uploaded', 'previewed', 'applied', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "import_batch" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "source" "public"."import_source" NOT NULL, "vocational_school_id" uuid, "file_name" text, "mapping_version" text, "status" "public"."import_batch_status" NOT NULL DEFAULT 'uploaded', "imported_by_user_id" uuid, "applied_at" TIMESTAMP WITH TIME ZONE, "rows_read" integer NOT NULL DEFAULT '0', "rows_created" integer NOT NULL DEFAULT '0', "rows_updated" integer NOT NULL DEFAULT '0', "rows_rejected" integer NOT NULL DEFAULT '0', "log" jsonb, CONSTRAINT "PK_f408daa3bbc77ffc37eca041312" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_type_certificate" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "course_type_id" uuid NOT NULL, "certificate_type_id" uuid NOT NULL, CONSTRAINT "PK_67e0e0a29b7b319985131be9192" PRIMARY KEY ("course_type_id", "certificate_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_category" AS ENUM('forklift', 'aerial_platform', 'crane', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "device_type" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" text NOT NULL, "name" text NOT NULL, "category" "public"."device_category" NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_69f0f85ca3b7ee173bd055baa93" UNIQUE ("code"), CONSTRAINT "PK_f8d1c0daa8abde339c1056535a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_type_device" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "course_type_id" uuid NOT NULL, "device_type_id" uuid NOT NULL, "quantity" smallint NOT NULL, CONSTRAINT "CHK_76ae0723e9a0f9c75adcf80be9" CHECK ("quantity" > 0), CONSTRAINT "PK_8e2e5ebc6133a5ed833982f7d8f" PRIMARY KEY ("course_type_id", "device_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_type_skill" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "course_type_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_581068dfc0ccc74d461731e995c" PRIMARY KEY ("course_type_id", "skill_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_kind" AS ENUM('uk', 'adult', 'exam')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."weekday_rule" AS ENUM('weekdays', 'saturday')`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_type" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" text NOT NULL, "name" text NOT NULL, "kind" "public"."course_kind" NOT NULL, "track" "public"."track", "duration_days" smallint NOT NULL, "may_span_weeks" boolean NOT NULL DEFAULT false, "weekday_rule" "public"."weekday_rule" NOT NULL DEFAULT 'weekdays', "languages" "public"."language" array NOT NULL, "min_participants" smallint, "max_participants" smallint NOT NULL, "description" text, "published" boolean NOT NULL DEFAULT false, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_91bf1d929170451a36136840f26" UNIQUE ("code"), CONSTRAINT "CHK_022716168a1d6de97e70ac123a" CHECK ("max_participants" > 0), CONSTRAINT "CHK_d69a83201779e46546de5a6309" CHECK ("duration_days" > 0), CONSTRAINT "PK_ed75c33d531547ed8b0164d75b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_module" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "track" "public"."track" NOT NULL, "course_type_id" uuid NOT NULL, "semester" smallint NOT NULL, "sequence" smallint NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_13050758030a85afeb073ab1d99" UNIQUE ("course_type_id"), CONSTRAINT "UQ_51ad7a76b9736c1d3bb63df468e" UNIQUE ("track", "sequence"), CONSTRAINT "CHK_678f55471fbcf18066b13fbc39" CHECK ("semester" BETWEEN 1 AND 6), CONSTRAINT "PK_e64ef45d0cd7ae12212e6a36acb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "time_window" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "curriculum_module_id" uuid NOT NULL, "cohort_id" uuid NOT NULL, "starts_on" date NOT NULL, "ends_on" date NOT NULL, "location_id" uuid, "note" text, CONSTRAINT "CHK_d507b64930613a3122f887dbcb" CHECK ("starts_on" <= "ends_on"), CONSTRAINT "PK_09af65fadeceae4eefc8341ea88" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ed7867aac912f9031e5230fdb3" ON "time_window"  ("curriculum_module_id", "cohort_id") WHERE "location_id" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_613491639a8b977511ed87fae7" ON "time_window"  ("curriculum_module_id", "cohort_id", "location_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."planning_run_stage" AS ENUM('demand', 'courses', 'staffing', 'committed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."planning_run_status" AS ENUM('draft', 'committed', 'discarded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "planning_run" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "label" text NOT NULL, "period_starts_on" date NOT NULL, "period_ends_on" date NOT NULL, "stage" "public"."planning_run_stage" NOT NULL DEFAULT 'demand', "status" "public"."planning_run_status" NOT NULL DEFAULT 'draft', "created_by_user_id" uuid, "committed_at" TIMESTAMP WITH TIME ZONE, "note" text, CONSTRAINT "CHK_126962b71d1ce7a81db6bffb10" CHECK ("period_starts_on" <= "period_ends_on"), CONSTRAINT "PK_54ece4bf4a38b6fd7dddbd83884" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."demand_source" AS ENUM('school_import', 'sales_forecast', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."demand_status" AS ENUM('open', 'planned', 'dropped')`,
    );
    await queryRunner.query(
      `CREATE TABLE "demand" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "planning_run_id" uuid, "cohort_id" uuid, "curriculum_module_id" uuid, "course_type_id" uuid NOT NULL, "time_window_id" uuid, "location_id" uuid NOT NULL, "school_weekday" smallint, "participant_count" integer NOT NULL, "courses_needed" smallint NOT NULL, "source" "public"."demand_source" NOT NULL, "status" "public"."demand_status" NOT NULL DEFAULT 'open', "note" text, CONSTRAINT "CHK_65475d11acc376abc6dd71acb7" CHECK ("school_weekday" IS NULL OR "school_weekday" BETWEEN 1 AND 7), CONSTRAINT "CHK_581db7c7e5cbe95c25d2549983" CHECK ("courses_needed" >= 0), CONSTRAINT "CHK_42b0baf23b49ebf758eec8bc49" CHECK ("participant_count" >= 0), CONSTRAINT "PK_2e27cd7b3d79c50d197cb0b3924" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08b0835442af1af05fa549aab4" ON "demand"  ("location_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5aec829e2c3b93d6a532d303b7" ON "demand"  ("planning_run_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "course_day" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "course_id" uuid NOT NULL, "held_on" date NOT NULL, "starts_at" TIME NOT NULL, "ends_at" TIME NOT NULL, "sequence" smallint NOT NULL, "location_id" uuid, "room_id" uuid, CONSTRAINT "UQ_9d0ad65ce0907f8fa03e7fee6e8" UNIQUE ("course_id", "sequence"), CONSTRAINT "UQ_2e5c2a0d81ce558775e43b5ba01" UNIQUE ("course_id", "held_on"), CONSTRAINT "CHK_9c68bda7531fd472c5f27a6252" CHECK ("starts_at" < "ends_at"), CONSTRAINT "PK_392f947bd36205525e8eabb1fc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7504d834d280e236137a0f18b2" ON "course_day"  ("room_id", "held_on") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72cc960d902888e46817c05d3b" ON "course_day"  ("location_id", "held_on") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d3a631fc75226eb81bdfba5c12" ON "course_day"  ("held_on") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_role" AS ENUM('lead', 'assistant', 'backup')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_status" AS ENUM('proposed', 'confirmed', 'declined', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "assignment" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "course_id" uuid NOT NULL, "course_day_id" uuid, "instructor_id" uuid NOT NULL, "role" "public"."assignment_role" NOT NULL DEFAULT 'lead', "status" "public"."assignment_status" NOT NULL DEFAULT 'proposed', "check_result" jsonb, "score" smallint, "overtime_hours" numeric(5,2), "confirmed_by_user_id" uuid, "confirmed_at" TIMESTAMP WITH TIME ZONE, "note" text, CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff0d41f34ef2956d9282fb5cdf" ON "assignment"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4db7bd79230f5901986994297" ON "assignment"  ("instructor_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1590b3d1e935c8869f5cecc2f4" ON "assignment"  ("course_id", "instructor_id") WHERE "course_day_id" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5db1b6a938945187db8d8c033d" ON "assignment"  ("course_id", "instructor_id", "course_day_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_status" AS ENUM('demand', 'planned', 'open', 'confirmed', 'running', 'done', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "course" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "course_type_id" uuid NOT NULL, "location_id" uuid NOT NULL, "language" "public"."language" NOT NULL, "cohort_id" uuid, "time_window_id" uuid, "demand_id" uuid, "planning_run_id" uuid, "capacity" smallint NOT NULL, "status" "public"."course_status" NOT NULL DEFAULT 'planned', "published" boolean NOT NULL DEFAULT false, "planning_issue" text, "external_ref" text, "notes" text, "created_by_user_id" uuid, CONSTRAINT "CHK_fc72dccce07f0588ca61953501" CHECK ("capacity" > 0), CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2aba3ac5f304fb81f94cba1025" ON "course"  ("cohort_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_baccb82c6179dca139f6b8c768" ON "course"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_501b08c360abecf7836b1f5d7f" ON "course"  ("course_type_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3c0959b2c303cce601731fb19" ON "course"  ("location_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "participant" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "customer_id" uuid, "first_name" text NOT NULL, "last_name" text NOT NULL, "email" text, "phone" text, "language" "public"."language" NOT NULL, "notes" text, CONSTRAINT "PK_64da4237f502041781ca15d4c41" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'excused')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendance" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "enrollment_id" uuid NOT NULL, "course_day_id" uuid NOT NULL, "status" "public"."attendance_status" NOT NULL, CONSTRAINT "UQ_f9eee5bbd368c9e1783b01117a0" UNIQUE ("enrollment_id", "course_day_id"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."enrollment_status" AS ENUM('registered', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."enrollment_channel" AS ENUM('planner', 'trainer', 'import')`,
    );
    await queryRunner.query(
      `CREATE TABLE "enrollment" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "course_id" uuid NOT NULL, "apprentice_id" uuid, "participant_id" uuid, "status" "public"."enrollment_status" NOT NULL DEFAULT 'registered', "enrolled_via" "public"."enrollment_channel" NOT NULL DEFAULT 'planner', "enrolled_by_user_id" uuid, "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "follow_up_of_enrollment_id" uuid, "notes" text, CONSTRAINT "UQ_efd7578a92f399f7379a3c437e5" UNIQUE ("course_id", "participant_id"), CONSTRAINT "UQ_0bec7b10a3516041fc92f304b75" UNIQUE ("course_id", "apprentice_id"), CONSTRAINT "CHK_8def0896c6ffa1d745236448e3" CHECK (num_nonnulls("apprentice_id", "participant_id") = 1), CONSTRAINT "PK_7e200c699fa93865cdcdd025885" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd1ce01d1164c8bbdda052ced7" ON "enrollment"  ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d1e8932125f36332c12b8d356" ON "enrollment"  ("apprentice_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_class_day" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "school_class_id" uuid NOT NULL, "school_year_start" smallint NOT NULL, "weekday" smallint NOT NULL, "evening" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_b54afe4de23b36be809c635d8ba" UNIQUE ("school_class_id", "school_year_start", "weekday"), CONSTRAINT "CHK_3896ca8ecff2372212d5697262" CHECK ("weekday" BETWEEN 1 AND 7), CONSTRAINT "PK_f2f8a02258039627eb7bd70c615" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "school_class" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "vocational_school_id" uuid NOT NULL, "code" text NOT NULL, "track" "public"."track" NOT NULL, "start_year" smallint NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_0d5d9b2c5b7a69607f5789065a1" UNIQUE ("vocational_school_id", "code"), CONSTRAINT "PK_c2db13fe0f6e127a4aae70bfd35" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."gender" AS ENUM('m', 'f', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."apprentice_status" AS ENUM('active', 'finished', 'dropped')`,
    );
    await queryRunner.query(
      `CREATE TABLE "apprentice" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "ahv_number" text, "external_id" text, "first_name" text NOT NULL, "last_name" text NOT NULL, "birth_date" date NOT NULL, "gender" "public"."gender", "email" text, "phone" text, "address_line" text, "postal_code" text, "city" text, "native_language" text, "language" "public"."language" NOT NULL, "track" "public"."track" NOT NULL, "profession_code" text, "cohort_id" uuid NOT NULL, "vocational_school_id" uuid NOT NULL, "school_class_id" uuid, "training_company_id" uuid, "trainer_id" uuid, "apprenticeship_start" date, "apprenticeship_end" date, "has_bm1" boolean NOT NULL DEFAULT false, "status" "public"."apprentice_status" NOT NULL DEFAULT 'active', "import_batch_id" uuid, "imported_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_12889f090567d2bcd3df39c2bcd" UNIQUE ("ahv_number"), CONSTRAINT "PK_b27a0b1a290b9d3fa27c7251e10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26d8a16aa1ba30268cfeb11b37" ON "apprentice"  ("vocational_school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3bdc3e64c068d03a58971d388c" ON "apprentice"  ("school_class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_809702ca9e960af73b7266b16d" ON "apprentice"  ("cohort_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb66928f720885be4dd31be0e0" ON "apprentice"  ("last_name", "first_name", "birth_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_holiday" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "vocational_school_id" uuid NOT NULL, "starts_on" date NOT NULL, "ends_on" date NOT NULL, "name" text, CONSTRAINT "CHK_43ca98b3bcadab3abb32eb62c0" CHECK ("starts_on" <= "ends_on"), CONSTRAINT "PK_24ee188a3277b43501e941b92f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_module_prerequisite" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "module_id" uuid NOT NULL, "prerequisite_module_id" uuid NOT NULL, CONSTRAINT "CHK_caad7f162215ea5617ca790283" CHECK ("module_id" <> "prerequisite_module_id"), CONSTRAINT "PK_6526a663f61e441519592d62601" PRIMARY KEY ("module_id", "prerequisite_module_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_mobility" AS ENUM('fixed', 'mobile', 'rental')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_status" AS ENUM('available', 'maintenance', 'retired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "device" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "device_type_id" uuid NOT NULL, "inventory_number" text NOT NULL, "home_location_id" uuid NOT NULL, "mobility" "public"."device_mobility" NOT NULL DEFAULT 'fixed', "status" "public"."device_status" NOT NULL DEFAULT 'available', "rental_from" date, "rental_until" date, "rental_vendor" text, "notes" text, CONSTRAINT "UQ_24001ef862b82c6972fc279008d" UNIQUE ("inventory_number"), CONSTRAINT "CHK_1cf79f49f1fcfc7c7f692902ad" CHECK ("rental_from" IS NULL OR "rental_until" IS NULL OR "rental_from" <= "rental_until"), CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "device_move" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "device_id" uuid NOT NULL, "from_location_id" uuid NOT NULL, "to_location_id" uuid NOT NULL, "effective_on" date NOT NULL, "note" text, CONSTRAINT "PK_6be3a5ee7bea946de8250c49414" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dcbafb34d3cdd2e7ecfd4541cc" ON "device_move"  ("device_id", "effective_on") `,
    );
    await queryRunner.query(
      `CREATE TABLE "device_reservation" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "device_id" uuid NOT NULL, "course_day_id" uuid NOT NULL, "reserved_on" date NOT NULL, CONSTRAINT "UQ_c7e9b528f17b67de765718ba661" UNIQUE ("device_id", "reserved_on"), CONSTRAINT "UQ_230415e2bbd648cf0eb48edfcdc" UNIQUE ("device_id", "course_day_id"), CONSTRAINT "PK_e217e50b54aaf0ee869a445bebb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8cfa4b1a719b5362f63d087b1a" ON "device_reservation"  ("reserved_on") `,
    );
    await queryRunner.query(
      `CREATE TABLE "device_type_qualification" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "device_type_id" uuid NOT NULL, "certificate_type_id" uuid, "skill_id" uuid, CONSTRAINT "UQ_9b98ac9e6505fb3b5bedd84d23d" UNIQUE ("device_type_id", "skill_id"), CONSTRAINT "UQ_ea768a3735c0b9178b7317b77e0" UNIQUE ("device_type_id", "certificate_type_id"), CONSTRAINT "CHK_f6298f8b9afdc63f2147a91af0" CHECK (num_nonnulls("certificate_type_id", "skill_id") = 1), CONSTRAINT "PK_79df9e84647f250cb6db5406f0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_window" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "device_id" uuid NOT NULL, "starts_on" date NOT NULL, "ends_on" date NOT NULL, "note" text, CONSTRAINT "CHK_441a4a359090c72247279011cd" CHECK ("starts_on" <= "ends_on"), CONSTRAINT "PK_6a15b826ce736e584a0d0e0bdd4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e718784ebc8bd5011498904aa4" ON "maintenance_window"  ("device_id", "starts_on", "ends_on") `,
    );
    await queryRunner.query(
      `CREATE TABLE "certificate_type_maintenance_course_type" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "certificate_type_id" uuid NOT NULL, "course_type_id" uuid NOT NULL, CONSTRAINT "PK_f3a50e6f8276ecce5a2266a2d96" PRIMARY KEY ("certificate_type_id", "course_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "location_distance" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "from_location_id" uuid NOT NULL, "to_location_id" uuid NOT NULL, "travel_minutes" smallint NOT NULL, CONSTRAINT "UQ_03f46e935a95abfd53bc53a4f00" UNIQUE ("from_location_id", "to_location_id"), CONSTRAINT "CHK_9604b034b352b4731d2c098a8d" CHECK ("from_location_id" <> "to_location_id"), CONSTRAINT "PK_be867a7d315badf73f6e0e2e984" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_kind" AS ENUM('certificate_expiring', 'certificate_expired', 'resource_bottleneck', 'unstaffed_course', 'device_conflict', 'duplicate_apprentice', 'import_error', 'maintenance_rule')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_status" AS ENUM('open', 'acknowledged', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "kind" "public"."alert_kind" NOT NULL, "severity" "public"."alert_severity" NOT NULL, "subject_type" text NOT NULL, "subject_id" uuid NOT NULL, "message" text NOT NULL, "due_on" date, "status" "public"."alert_status" NOT NULL DEFAULT 'open', "acknowledged_by_user_id" uuid, "acknowledged_at" TIMESTAMP WITH TIME ZONE, "resolved_at" TIMESTAMP WITH TIME ZONE, "dedupe_key" text, CONSTRAINT "UQ_d65b3eabc486a795e6fe2e3f1ed" UNIQUE ("dedupe_key"), CONSTRAINT "PK_ad91cad659a3536465d564a4b2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7eda9866fb67c4afb86cd8bb33" ON "alert"  ("subject_type", "subject_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_418b0d27dc93b06b31026508c8" ON "alert"  ("status", "severity") `,
    );
    await queryRunner.query(
      `CREATE TABLE "assistant_conversation" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "messages" jsonb NOT NULL, "cited" jsonb, CONSTRAINT "PK_af11b828bf25b6ebf91e53d9e00" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_entry" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "actor_user_id" uuid, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "entity_type" text NOT NULL, "entity_id" uuid NOT NULL, "action" text NOT NULL, "before" jsonb, "after" jsonb, "summary" text NOT NULL, CONSTRAINT "PK_58a130a4b9da189f46ba2a01801" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8761a70355574c08e9fc33249b" ON "audit_entry"  ("entity_type", "entity_id", "occurred_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "setting" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" text NOT NULL, "value" jsonb NOT NULL, "updated_by_user_id" uuid, CONSTRAINT "UQ_1c4c95d773004250c157a744d6e" UNIQUE ("key"), CONSTRAINT "PK_fcb21187dc6094e24a48f677bed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."validation_issue_status" AS ENUM('open', 'merged', 'dismissed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "validation_issue" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT gen_random_uuid(), "import_batch_id" uuid, "rule" text NOT NULL, "score" numeric(4,3), "message" text NOT NULL, "subject_type" text NOT NULL, "subject_id" uuid NOT NULL, "related_subject_id" uuid, "status" "public"."validation_issue_status" NOT NULL DEFAULT 'open', "resolved_by_user_id" uuid, "resolved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_d67c741d7985480f2f8c622ef6c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46e0972d256250fc8c913d9af0" ON "validation_issue"  ("subject_type", "subject_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0177328bb339c6cddc7e525d0" ON "validation_issue"  ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD CONSTRAINT "FK_e07c1bc20e627d33226a2ca1954" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_94e2397e21928f8285f1e45306b" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vocational_school" ADD CONSTRAINT "FK_73030bcc94290922080b23ecbcb" FOREIGN KEY ("nearest_location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainer" ADD CONSTRAINT "FK_2e67e03c510922f36e5768096f6" FOREIGN KEY ("training_company_id") REFERENCES "training_company"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability" ADD CONSTRAINT "FK_64573343efa329d3a79f6cb7163" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability" ADD CONSTRAINT "FK_7aa8b75a9bfdcbe5b6684519305" FOREIGN KEY ("requested_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability" ADD CONSTRAINT "FK_4ee137d22e1b90e37c6750766c0" FOREIGN KEY ("decided_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_certificate" ADD CONSTRAINT "FK_f06aed797598efb498c3f804a65" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_certificate" ADD CONSTRAINT "FK_f55db56e09d7caadeb8d551939f" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_skill" ADD CONSTRAINT "FK_ab2ed7a63624682172c9dd5f8e4" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_skill" ADD CONSTRAINT "FK_1700b205286602298cd5012fd89" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor" ADD CONSTRAINT "FK_42f27062dd8a5c09a4fb7d86438" FOREIGN KEY ("home_location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_11c03fb8b962b9a304677f462f4" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_0f49a555b6e5fe09cad43ae52ac" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_batch" ADD CONSTRAINT "FK_f6b36f5b21032d851914570a840" FOREIGN KEY ("vocational_school_id") REFERENCES "vocational_school"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_batch" ADD CONSTRAINT "FK_d28f971205fcac7741c5ccfad1d" FOREIGN KEY ("imported_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_certificate" ADD CONSTRAINT "FK_a5f402f3a956a818fd77de2696a" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_certificate" ADD CONSTRAINT "FK_578bfc47e9db7b766e927485df3" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_device" ADD CONSTRAINT "FK_8d6bda083e1ddb36675ac5212ec" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_device" ADD CONSTRAINT "FK_aaf5559ec61b32c552c1720368b" FOREIGN KEY ("device_type_id") REFERENCES "device_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_skill" ADD CONSTRAINT "FK_84a3fa73031b774164598f9310e" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_skill" ADD CONSTRAINT "FK_c13701481492cf539344bd1d0fa" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_module" ADD CONSTRAINT "FK_13050758030a85afeb073ab1d99" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_window" ADD CONSTRAINT "FK_685405987295232162f20c881d9" FOREIGN KEY ("curriculum_module_id") REFERENCES "curriculum_module"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_window" ADD CONSTRAINT "FK_2fc4388c3d3ce548231aaf72f65" FOREIGN KEY ("cohort_id") REFERENCES "cohort"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_window" ADD CONSTRAINT "FK_4ddb8bf3ae915ecefaab9af77fd" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_run" ADD CONSTRAINT "FK_662c6ef8dfc481e980115af6ca6" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD CONSTRAINT "FK_5aec829e2c3b93d6a532d303b74" FOREIGN KEY ("planning_run_id") REFERENCES "planning_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD CONSTRAINT "FK_cfa207dca6268ec3ac5e0c6cb5d" FOREIGN KEY ("cohort_id") REFERENCES "cohort"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD CONSTRAINT "FK_dbfdb76e9abe4014d6879788e7b" FOREIGN KEY ("curriculum_module_id") REFERENCES "curriculum_module"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD CONSTRAINT "FK_678fbcd3ab6e6ff3bfd540a82ea" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD CONSTRAINT "FK_8afbd7480c2c64f0e881b399abb" FOREIGN KEY ("time_window_id") REFERENCES "time_window"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" ADD CONSTRAINT "FK_08b0835442af1af05fa549aab42" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_day" ADD CONSTRAINT "FK_2b4b8665d08ab453f744be82242" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_day" ADD CONSTRAINT "FK_c6db824031771a04a218cebf53a" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_day" ADD CONSTRAINT "FK_bc5bf220ea3076cad5d10158ac5" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_bed2432633bd87ade8deb1b4c19" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_2b0ed1e984156696847f1f299fc" FOREIGN KEY ("course_day_id") REFERENCES "course_day"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_f4db7bd79230f59019869942974" FOREIGN KEY ("instructor_id") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_dba5285a4c234571fa0d9b46e37" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_501b08c360abecf7836b1f5d7f3" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_e3c0959b2c303cce601731fb194" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_2aba3ac5f304fb81f94cba10251" FOREIGN KEY ("cohort_id") REFERENCES "cohort"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_416a37c25b7f21999e7ec7c40d5" FOREIGN KEY ("time_window_id") REFERENCES "time_window"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_4d9e99a41fec273817e6f48b2c0" FOREIGN KEY ("demand_id") REFERENCES "demand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_a6a8f912e89eec542085fa36870" FOREIGN KEY ("planning_run_id") REFERENCES "planning_run"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_9714e38e051106dd07d2d82fdd6" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" ADD CONSTRAINT "FK_74f25d114b8d459b61a9698784b" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_005fdbba9ac200693005f5ab21f" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_ebd2fd3f1282f9caabcd5fe263f" FOREIGN KEY ("course_day_id") REFERENCES "course_day"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_dd1ce01d1164c8bbdda052ced74" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_7d1e8932125f36332c12b8d356f" FOREIGN KEY ("apprentice_id") REFERENCES "apprentice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_4508b68ab173756e69bd795614a" FOREIGN KEY ("participant_id") REFERENCES "participant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_6f6386496f2426cda7be4d18a8d" FOREIGN KEY ("enrolled_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "FK_e547cefca8f1d53b58f50786c88" FOREIGN KEY ("follow_up_of_enrollment_id") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_day" ADD CONSTRAINT "FK_750677da036aa2167bf480099f0" FOREIGN KEY ("school_class_id") REFERENCES "school_class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class" ADD CONSTRAINT "FK_e9d9b0ec9f652d83c32fffe6c9e" FOREIGN KEY ("vocational_school_id") REFERENCES "vocational_school"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" ADD CONSTRAINT "FK_809702ca9e960af73b7266b16d1" FOREIGN KEY ("cohort_id") REFERENCES "cohort"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" ADD CONSTRAINT "FK_26d8a16aa1ba30268cfeb11b37f" FOREIGN KEY ("vocational_school_id") REFERENCES "vocational_school"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" ADD CONSTRAINT "FK_3bdc3e64c068d03a58971d388cf" FOREIGN KEY ("school_class_id") REFERENCES "school_class"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" ADD CONSTRAINT "FK_6a9013b45fcf11f67b047fed39c" FOREIGN KEY ("training_company_id") REFERENCES "training_company"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" ADD CONSTRAINT "FK_61e967c5e095ebd7737f8280b80" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" ADD CONSTRAINT "FK_9615583ccf99d1b92bf83140795" FOREIGN KEY ("import_batch_id") REFERENCES "import_batch"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_holiday" ADD CONSTRAINT "FK_63cf5aac685005939520e8b075a" FOREIGN KEY ("vocational_school_id") REFERENCES "vocational_school"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_module_prerequisite" ADD CONSTRAINT "FK_0d14aad06a3e1e8ce2882e350ea" FOREIGN KEY ("module_id") REFERENCES "curriculum_module"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_module_prerequisite" ADD CONSTRAINT "FK_9c42058826d93daf09515ec1d13" FOREIGN KEY ("prerequisite_module_id") REFERENCES "curriculum_module"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "FK_9aa8fcca6a2f86b2638c02fd1bd" FOREIGN KEY ("device_type_id") REFERENCES "device_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "FK_c52b0bf6565134088cf4f20b5f5" FOREIGN KEY ("home_location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_move" ADD CONSTRAINT "FK_c08d0c8b98c5e26caf49b435539" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_move" ADD CONSTRAINT "FK_2e81d8ca9d130bd5919cc42914c" FOREIGN KEY ("from_location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_move" ADD CONSTRAINT "FK_8943dc14c1c7379ec9a44c24b25" FOREIGN KEY ("to_location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_reservation" ADD CONSTRAINT "FK_170420b437de627b0888b23caa4" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_reservation" ADD CONSTRAINT "FK_e730a3b845a5aa7e262faaa8f5b" FOREIGN KEY ("course_day_id") REFERENCES "course_day"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_type_qualification" ADD CONSTRAINT "FK_e4f02c8e793a8b223fa315467a6" FOREIGN KEY ("device_type_id") REFERENCES "device_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_type_qualification" ADD CONSTRAINT "FK_e9b3f4ce3b9aa0717141a236e94" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_type_qualification" ADD CONSTRAINT "FK_34423a62c4529fb1319b2659196" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_window" ADD CONSTRAINT "FK_7632e765894e033f4f34df10cfd" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_type_maintenance_course_type" ADD CONSTRAINT "FK_d33a7c1a0bea8070c8085565e97" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_type_maintenance_course_type" ADD CONSTRAINT "FK_0ba207f53a2f4b85581f94bc5ef" FOREIGN KEY ("course_type_id") REFERENCES "course_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_distance" ADD CONSTRAINT "FK_dde5dc2fdf82038495c21d7e08b" FOREIGN KEY ("from_location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_distance" ADD CONSTRAINT "FK_416f0f8a39ea445a2cdf587bf6f" FOREIGN KEY ("to_location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ADD CONSTRAINT "FK_4f8be8098d008258712ef9d8c82" FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistant_conversation" ADD CONSTRAINT "FK_c267f6ff30e9d7c56d61dc62416" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_entry" ADD CONSTRAINT "FK_9145793cad0b4c9d2a33a3cc3fd" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "setting" ADD CONSTRAINT "FK_efd195d3967eaf761027afc7215" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "validation_issue" ADD CONSTRAINT "FK_c7934ecec27c8db190bef99168f" FOREIGN KEY ("import_batch_id") REFERENCES "import_batch"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "validation_issue" ADD CONSTRAINT "FK_af37245b5974edb542cced06904" FOREIGN KEY ("resolved_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "validation_issue" DROP CONSTRAINT "FK_af37245b5974edb542cced06904"`,
    );
    await queryRunner.query(
      `ALTER TABLE "validation_issue" DROP CONSTRAINT "FK_c7934ecec27c8db190bef99168f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "setting" DROP CONSTRAINT "FK_efd195d3967eaf761027afc7215"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_entry" DROP CONSTRAINT "FK_9145793cad0b4c9d2a33a3cc3fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistant_conversation" DROP CONSTRAINT "FK_c267f6ff30e9d7c56d61dc62416"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" DROP CONSTRAINT "FK_4f8be8098d008258712ef9d8c82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_distance" DROP CONSTRAINT "FK_416f0f8a39ea445a2cdf587bf6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_distance" DROP CONSTRAINT "FK_dde5dc2fdf82038495c21d7e08b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_type_maintenance_course_type" DROP CONSTRAINT "FK_0ba207f53a2f4b85581f94bc5ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_type_maintenance_course_type" DROP CONSTRAINT "FK_d33a7c1a0bea8070c8085565e97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_window" DROP CONSTRAINT "FK_7632e765894e033f4f34df10cfd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_type_qualification" DROP CONSTRAINT "FK_34423a62c4529fb1319b2659196"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_type_qualification" DROP CONSTRAINT "FK_e9b3f4ce3b9aa0717141a236e94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_type_qualification" DROP CONSTRAINT "FK_e4f02c8e793a8b223fa315467a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_reservation" DROP CONSTRAINT "FK_e730a3b845a5aa7e262faaa8f5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_reservation" DROP CONSTRAINT "FK_170420b437de627b0888b23caa4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_move" DROP CONSTRAINT "FK_8943dc14c1c7379ec9a44c24b25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_move" DROP CONSTRAINT "FK_2e81d8ca9d130bd5919cc42914c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_move" DROP CONSTRAINT "FK_c08d0c8b98c5e26caf49b435539"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "FK_c52b0bf6565134088cf4f20b5f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "FK_9aa8fcca6a2f86b2638c02fd1bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_module_prerequisite" DROP CONSTRAINT "FK_9c42058826d93daf09515ec1d13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_module_prerequisite" DROP CONSTRAINT "FK_0d14aad06a3e1e8ce2882e350ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_holiday" DROP CONSTRAINT "FK_63cf5aac685005939520e8b075a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" DROP CONSTRAINT "FK_9615583ccf99d1b92bf83140795"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" DROP CONSTRAINT "FK_61e967c5e095ebd7737f8280b80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" DROP CONSTRAINT "FK_6a9013b45fcf11f67b047fed39c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" DROP CONSTRAINT "FK_3bdc3e64c068d03a58971d388cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" DROP CONSTRAINT "FK_26d8a16aa1ba30268cfeb11b37f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apprentice" DROP CONSTRAINT "FK_809702ca9e960af73b7266b16d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class" DROP CONSTRAINT "FK_e9d9b0ec9f652d83c32fffe6c9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_day" DROP CONSTRAINT "FK_750677da036aa2167bf480099f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_e547cefca8f1d53b58f50786c88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_6f6386496f2426cda7be4d18a8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_4508b68ab173756e69bd795614a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_7d1e8932125f36332c12b8d356f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "FK_dd1ce01d1164c8bbdda052ced74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_ebd2fd3f1282f9caabcd5fe263f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_005fdbba9ac200693005f5ab21f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" DROP CONSTRAINT "FK_74f25d114b8d459b61a9698784b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_9714e38e051106dd07d2d82fdd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_a6a8f912e89eec542085fa36870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_4d9e99a41fec273817e6f48b2c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_416a37c25b7f21999e7ec7c40d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_2aba3ac5f304fb81f94cba10251"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_e3c0959b2c303cce601731fb194"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_501b08c360abecf7836b1f5d7f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_dba5285a4c234571fa0d9b46e37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_f4db7bd79230f59019869942974"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_2b0ed1e984156696847f1f299fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_bed2432633bd87ade8deb1b4c19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_day" DROP CONSTRAINT "FK_bc5bf220ea3076cad5d10158ac5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_day" DROP CONSTRAINT "FK_c6db824031771a04a218cebf53a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_day" DROP CONSTRAINT "FK_2b4b8665d08ab453f744be82242"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP CONSTRAINT "FK_08b0835442af1af05fa549aab42"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP CONSTRAINT "FK_8afbd7480c2c64f0e881b399abb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP CONSTRAINT "FK_678fbcd3ab6e6ff3bfd540a82ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP CONSTRAINT "FK_dbfdb76e9abe4014d6879788e7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP CONSTRAINT "FK_cfa207dca6268ec3ac5e0c6cb5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "demand" DROP CONSTRAINT "FK_5aec829e2c3b93d6a532d303b74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_run" DROP CONSTRAINT "FK_662c6ef8dfc481e980115af6ca6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_window" DROP CONSTRAINT "FK_4ddb8bf3ae915ecefaab9af77fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_window" DROP CONSTRAINT "FK_2fc4388c3d3ce548231aaf72f65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_window" DROP CONSTRAINT "FK_685405987295232162f20c881d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_module" DROP CONSTRAINT "FK_13050758030a85afeb073ab1d99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_skill" DROP CONSTRAINT "FK_c13701481492cf539344bd1d0fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_skill" DROP CONSTRAINT "FK_84a3fa73031b774164598f9310e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_device" DROP CONSTRAINT "FK_aaf5559ec61b32c552c1720368b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_device" DROP CONSTRAINT "FK_8d6bda083e1ddb36675ac5212ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_certificate" DROP CONSTRAINT "FK_578bfc47e9db7b766e927485df3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_type_certificate" DROP CONSTRAINT "FK_a5f402f3a956a818fd77de2696a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_batch" DROP CONSTRAINT "FK_d28f971205fcac7741c5ccfad1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_batch" DROP CONSTRAINT "FK_f6b36f5b21032d851914570a840"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_0f49a555b6e5fe09cad43ae52ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_11c03fb8b962b9a304677f462f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor" DROP CONSTRAINT "FK_42f27062dd8a5c09a4fb7d86438"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_skill" DROP CONSTRAINT "FK_1700b205286602298cd5012fd89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_skill" DROP CONSTRAINT "FK_ab2ed7a63624682172c9dd5f8e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_certificate" DROP CONSTRAINT "FK_f55db56e09d7caadeb8d551939f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_certificate" DROP CONSTRAINT "FK_f06aed797598efb498c3f804a65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability" DROP CONSTRAINT "FK_4ee137d22e1b90e37c6750766c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability" DROP CONSTRAINT "FK_7aa8b75a9bfdcbe5b6684519305"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability" DROP CONSTRAINT "FK_64573343efa329d3a79f6cb7163"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainer" DROP CONSTRAINT "FK_2e67e03c510922f36e5768096f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vocational_school" DROP CONSTRAINT "FK_73030bcc94290922080b23ecbcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_94e2397e21928f8285f1e45306b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" DROP CONSTRAINT "FK_e07c1bc20e627d33226a2ca1954"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b0177328bb339c6cddc7e525d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46e0972d256250fc8c913d9af0"`,
    );
    await queryRunner.query(`DROP TABLE "validation_issue"`);
    await queryRunner.query(`DROP TYPE "public"."validation_issue_status"`);
    await queryRunner.query(`DROP TABLE "setting"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8761a70355574c08e9fc33249b"`,
    );
    await queryRunner.query(`DROP TABLE "audit_entry"`);
    await queryRunner.query(`DROP TABLE "assistant_conversation"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_418b0d27dc93b06b31026508c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7eda9866fb67c4afb86cd8bb33"`,
    );
    await queryRunner.query(`DROP TABLE "alert"`);
    await queryRunner.query(`DROP TYPE "public"."alert_status"`);
    await queryRunner.query(`DROP TYPE "public"."alert_severity"`);
    await queryRunner.query(`DROP TYPE "public"."alert_kind"`);
    await queryRunner.query(`DROP TABLE "location_distance"`);
    await queryRunner.query(
      `DROP TABLE "certificate_type_maintenance_course_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e718784ebc8bd5011498904aa4"`,
    );
    await queryRunner.query(`DROP TABLE "maintenance_window"`);
    await queryRunner.query(`DROP TABLE "device_type_qualification"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8cfa4b1a719b5362f63d087b1a"`,
    );
    await queryRunner.query(`DROP TABLE "device_reservation"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dcbafb34d3cdd2e7ecfd4541cc"`,
    );
    await queryRunner.query(`DROP TABLE "device_move"`);
    await queryRunner.query(`DROP TABLE "device"`);
    await queryRunner.query(`DROP TYPE "public"."device_status"`);
    await queryRunner.query(`DROP TYPE "public"."device_mobility"`);
    await queryRunner.query(`DROP TABLE "curriculum_module_prerequisite"`);
    await queryRunner.query(`DROP TABLE "school_holiday"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb66928f720885be4dd31be0e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_809702ca9e960af73b7266b16d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3bdc3e64c068d03a58971d388c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26d8a16aa1ba30268cfeb11b37"`,
    );
    await queryRunner.query(`DROP TABLE "apprentice"`);
    await queryRunner.query(`DROP TYPE "public"."apprentice_status"`);
    await queryRunner.query(`DROP TYPE "public"."gender"`);
    await queryRunner.query(`DROP TABLE "school_class"`);
    await queryRunner.query(`DROP TABLE "school_class_day"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d1e8932125f36332c12b8d356"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd1ce01d1164c8bbdda052ced7"`,
    );
    await queryRunner.query(`DROP TABLE "enrollment"`);
    await queryRunner.query(`DROP TYPE "public"."enrollment_channel"`);
    await queryRunner.query(`DROP TYPE "public"."enrollment_status"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP TYPE "public"."attendance_status"`);
    await queryRunner.query(`DROP TABLE "participant"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3c0959b2c303cce601731fb19"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_501b08c360abecf7836b1f5d7f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_baccb82c6179dca139f6b8c768"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2aba3ac5f304fb81f94cba1025"`,
    );
    await queryRunner.query(`DROP TABLE "course"`);
    await queryRunner.query(`DROP TYPE "public"."course_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5db1b6a938945187db8d8c033d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1590b3d1e935c8869f5cecc2f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4db7bd79230f5901986994297"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff0d41f34ef2956d9282fb5cdf"`,
    );
    await queryRunner.query(`DROP TABLE "assignment"`);
    await queryRunner.query(`DROP TYPE "public"."assignment_status"`);
    await queryRunner.query(`DROP TYPE "public"."assignment_role"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3a631fc75226eb81bdfba5c12"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72cc960d902888e46817c05d3b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7504d834d280e236137a0f18b2"`,
    );
    await queryRunner.query(`DROP TABLE "course_day"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5aec829e2c3b93d6a532d303b7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08b0835442af1af05fa549aab4"`,
    );
    await queryRunner.query(`DROP TABLE "demand"`);
    await queryRunner.query(`DROP TYPE "public"."demand_status"`);
    await queryRunner.query(`DROP TYPE "public"."demand_source"`);
    await queryRunner.query(`DROP TABLE "planning_run"`);
    await queryRunner.query(`DROP TYPE "public"."planning_run_status"`);
    await queryRunner.query(`DROP TYPE "public"."planning_run_stage"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_613491639a8b977511ed87fae7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ed7867aac912f9031e5230fdb3"`,
    );
    await queryRunner.query(`DROP TABLE "time_window"`);
    await queryRunner.query(`DROP TABLE "curriculum_module"`);
    await queryRunner.query(`DROP TABLE "course_type"`);
    await queryRunner.query(`DROP TYPE "public"."weekday_rule"`);
    await queryRunner.query(`DROP TYPE "public"."course_kind"`);
    await queryRunner.query(`DROP TABLE "course_type_skill"`);
    await queryRunner.query(`DROP TABLE "course_type_device"`);
    await queryRunner.query(`DROP TABLE "device_type"`);
    await queryRunner.query(`DROP TYPE "public"."device_category"`);
    await queryRunner.query(`DROP TABLE "course_type_certificate"`);
    await queryRunner.query(`DROP TABLE "import_batch"`);
    await queryRunner.query(`DROP TYPE "public"."import_batch_status"`);
    await queryRunner.query(`DROP TYPE "public"."import_source"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_status"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bef4de89232d942dabf9955131"`,
    );
    await queryRunner.query(`DROP TABLE "instructor"`);
    await queryRunner.query(`DROP TYPE "public"."instructor_status"`);
    await queryRunner.query(`DROP TYPE "public"."employment_type"`);
    await queryRunner.query(`DROP TABLE "instructor_skill"`);
    await queryRunner.query(`DROP TABLE "skill"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ad3e35e391b531fe5efaeb229"`,
    );
    await queryRunner.query(`DROP TABLE "instructor_certificate"`);
    await queryRunner.query(`DROP TABLE "certificate_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05fdcbbe8fe5ce0e02d25f4770"`,
    );
    await queryRunner.query(`DROP TABLE "availability"`);
    await queryRunner.query(`DROP TYPE "public"."availability_source"`);
    await queryRunner.query(`DROP TYPE "public"."availability_status"`);
    await queryRunner.query(`DROP TYPE "public"."availability_kind"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce2cdec7da2cbe6593e00ac502"`,
    );
    await queryRunner.query(`DROP TABLE "trainer"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46b88c72a72b244bdbcaf265ec"`,
    );
    await queryRunner.query(`DROP TABLE "training_company"`);
    await queryRunner.query(`DROP TABLE "vocational_school"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TYPE "public"."language"`);
    await queryRunner.query(`DROP TYPE "public"."location_kind"`);
    await queryRunner.query(`DROP TABLE "room"`);
    await queryRunner.query(`DROP TYPE "public"."room_kind"`);
    await queryRunner.query(`DROP TABLE "customer"`);
    await queryRunner.query(`DROP TABLE "cohort"`);
    await queryRunner.query(`DROP TYPE "public"."track"`);
  }
}
