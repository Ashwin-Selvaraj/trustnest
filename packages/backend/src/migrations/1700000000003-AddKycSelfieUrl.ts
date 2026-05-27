import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycSelfieUrl1700000000003 implements MigrationInterface {
  name = 'AddKycSelfieUrl1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycSelfieUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kycSelfieUrl"`);
  }
}
