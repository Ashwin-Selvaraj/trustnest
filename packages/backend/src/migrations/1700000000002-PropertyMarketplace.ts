import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropertyMarketplace1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE bhk_type_enum AS ENUM (
        'STUDIO', 'ONE_BHK', 'TWO_BHK', 'THREE_BHK',
        'FOUR_BHK_PLUS', 'VILLA', 'INDEPENDENT_HOUSE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE furnishing_status_enum AS ENUM (
        'UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE property_status_enum AS ENUM (
        'DRAFT', 'ACTIVE', 'PAUSED', 'RENTED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE interest_status_enum AS ENUM (
        'PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE tenant_preference_enum AS ENUM (
        'FAMILY', 'BACHELORS', 'WORKING_PROFESSIONAL', 'STUDENTS', 'ANY'
      )
    `);

    // ── properties ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE properties (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId"           UUID NOT NULL REFERENCES users(id),
        title               VARCHAR(200) NOT NULL,
        address             VARCHAR(300) NOT NULL,
        city                VARCHAR(100) NOT NULL,
        locality            VARCHAR(100) NOT NULL,
        "bhkType"           bhk_type_enum NOT NULL,
        "furnishingStatus"  furnishing_status_enum NOT NULL,
        "monthlyRentINR"    NUMERIC(12,2) NOT NULL,
        "depositINR"        NUMERIC(12,2) NOT NULL,
        "areaSqft"          INTEGER,
        "floorNumber"       INTEGER,
        "totalFloors"       INTEGER,
        description         TEXT,
        amenities           TEXT NOT NULL DEFAULT '[]',
        "preferredTenants"  TEXT NOT NULL DEFAULT '[]',
        "availableFrom"     DATE NOT NULL,
        status              property_status_enum NOT NULL DEFAULT 'DRAFT',
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── property_images ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE property_images (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "propertyId"     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        "s3Key"          VARCHAR(300) NOT NULL,
        url              VARCHAR(500) NOT NULL,
        "displayOrder"   INTEGER NOT NULL DEFAULT 0,
        "isPrimary"      BOOLEAN NOT NULL DEFAULT false,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── property_interests ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE property_interests (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "propertyId"   UUID NOT NULL REFERENCES properties(id),
        "tenantId"     UUID NOT NULL REFERENCES users(id),
        status         interest_status_enum NOT NULL DEFAULT 'PENDING',
        message        TEXT,
        "agreementId"  VARCHAR,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Indexes ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX idx_properties_search
        ON properties(city, locality, status, "monthlyRentINR")
    `);
    await queryRunner.query(`
      CREATE INDEX idx_properties_owner
        ON properties("ownerId", status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_interests_property
        ON property_interests("propertyId", status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_interests_tenant
        ON property_interests("tenantId", status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interests_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interests_property`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_owner`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_properties_search`);
    await queryRunner.query(`DROP TABLE IF EXISTS property_interests`);
    await queryRunner.query(`DROP TABLE IF EXISTS property_images`);
    await queryRunner.query(`DROP TABLE IF EXISTS properties`);
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_preference_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS interest_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS property_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS furnishing_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS bhk_type_enum`);
  }
}
