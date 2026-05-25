import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('TENANT', 'OWNER')`);
    await queryRunner.query(`CREATE TYPE "kyc_status_enum" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED')`);
    await queryRunner.query(`CREATE TYPE "agreement_status_enum" AS ENUM ('DRAFT', 'PENDING_DEPOSIT', 'ACTIVE', 'RELEASING', 'DISPUTED', 'CLOSED')`);
    await queryRunner.query(`CREATE TYPE "payment_type_enum" AS ENUM ('DEPOSIT', 'RELEASE', 'REFUND', 'DEDUCTION')`);
    await queryRunner.query(`CREATE TYPE "payment_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED')`);
    await queryRunner.query(`CREATE TYPE "job_type_enum" AS ENUM ('REGISTER_USER', 'MINT_AGREEMENT_NFT', 'DEPOSIT_ESCROW', 'RELEASE_ESCROW', 'RESOLVE_DISPUTE', 'MINT_REPUTATION_SBT')`);
    await queryRunner.query(`CREATE TYPE "job_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(15) NOT NULL UNIQUE,
        "name" varchar(100),
        "role" "user_role_enum" NOT NULL DEFAULT 'TENANT',
        "kyc_status" "kyc_status_enum" NOT NULL DEFAULT 'PENDING',
        "kyc_job_id" varchar(50),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE,
        "address" varchar(42) NOT NULL UNIQUE,
        "encrypted_key" text NOT NULL,
        "key_iv" text NOT NULL,
        "registered_on_chain" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "agreements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "status" "agreement_status_enum" NOT NULL DEFAULT 'DRAFT',
        "property_address" varchar(300) NOT NULL,
        "monthly_rent_i_n_r" decimal(12,2) NOT NULL,
        "deposit_i_n_r" decimal(12,2) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "pdf_ipfs_hash" varchar(100),
        "on_chain_agreement_id" varchar(66),
        "nft_token_id_tenant" bigint,
        "nft_token_id_owner" bigint,
        "tenant_confirmed" boolean NOT NULL DEFAULT false,
        "owner_confirmed" boolean NOT NULL DEFAULT false,
        "dispute_reason" text,
        "dispute_evidence_ipfs_hash" varchar(100),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY ("tenant_id") REFERENCES "users"("id"),
        FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payment_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "agreement_id" uuid NOT NULL,
        "type" "payment_type_enum" NOT NULL,
        "amount_i_n_r" decimal(12,2) NOT NULL,
        "usdc_wei" varchar,
        "forex_rate" varchar(18),
        "gateway_order_id" varchar(100),
        "gateway_payment_id" varchar(100),
        "tx_hash" varchar(66),
        "status" "payment_status_enum" NOT NULL DEFAULT 'PENDING',
        "retry_count" int,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blockchain_jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "agreement_id" uuid,
        "type" "job_type_enum" NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "status" "job_status_enum" NOT NULL DEFAULT 'PENDING',
        "attempts" int NOT NULL DEFAULT 0,
        "tx_hash" varchar(66),
        "last_error" text,
        "process_after" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reputation_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "agreement_id" uuid NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "score" smallint NOT NULL,
        "review" text,
        "sbt_token_id" int,
        "minted_at" timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id"),
        FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id")
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "idx_agreements_tenant" ON "agreements"("tenant_id", "status")`);
    await queryRunner.query(`CREATE INDEX "idx_agreements_owner" ON "agreements"("owner_id", "status")`);
    await queryRunner.query(`CREATE INDEX "idx_payment_events_agr" ON "payment_events"("agreement_id", "type", "status")`);
    await queryRunner.query(`CREATE INDEX "idx_blockchain_jobs_poll" ON "blockchain_jobs"("status", "process_after") WHERE status IN ('PENDING', 'FAILED')`);
    await queryRunner.query(`CREATE INDEX "idx_reputation_user" ON "reputation_tokens"("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reputation_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blockchain_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agreements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agreement_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "kyc_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
