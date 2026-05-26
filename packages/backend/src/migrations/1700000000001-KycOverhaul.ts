import { MigrationInterface, QueryRunner } from 'typeorm';

export class KycOverhaul1700000000001 implements MigrationInterface {
  name = 'KycOverhaul1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add BOTH value to user_role_enum
    await queryRunner.query(`ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'BOTH'`);

    // Create new enum types
    await queryRunner.query(`
      CREATE TYPE "kyc_method_enum" AS ENUM ('AADHAAR', 'PAN')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_details_status_enum" AS ENUM ('NONE', 'PENDING_VERIFICATION', 'VERIFIED')
    `);

    // Alter users table — add new columns
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "dob" date`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "kyc_method" "kyc_method_enum"`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "masked_aadhaar" varchar(10)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "masked_pan" varchar(15)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "kyc_rejection_reason" text`);

    // Create payment_details table
    await queryRunner.query(`
      CREATE TABLE "payment_details" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "upiId" varchar(100),
        "bankAccountNumber" text,
        "bankIfsc" varchar(11),
        "status" "payment_details_status_enum" NOT NULL DEFAULT 'NONE',
        "verifiedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payment_details_user" ON "payment_details"("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payment_details_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_details"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "masked_pan"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "masked_aadhaar"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_method"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "dob"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_details_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "kyc_method_enum"`);
    // NOTE: cannot remove enum value from PostgreSQL without recreating the type
  }
}
