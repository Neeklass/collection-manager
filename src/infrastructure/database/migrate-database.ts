import { createHash } from "node:crypto";

import type { SqliteMigration } from "@/infrastructure/database/migration";
import { sqliteMigrations } from "@/infrastructure/database/migrations";
import type { SqliteDatabase } from "@/infrastructure/database/sqlite-database";

const CREATE_MIGRATION_HISTORY_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL CHECK (version > 0),
    name TEXT NOT NULL UNIQUE,
    checksum TEXT NOT NULL CHECK (length(checksum) = 64),
    applied_at TEXT NOT NULL
      CHECK (applied_at GLOB '????-??-??T??:??:??.???Z')
  );
`;

type AppliedMigration = {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
};

export type MigrationResult = {
  readonly appliedVersions: readonly number[];
  readonly currentVersion: number;
};

export class MigrationError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MigrationError";
  }
}

function calculateChecksum(migration: SqliteMigration): string {
  return createHash("sha256")
    .update(`${migration.version}\n${migration.name}\n${migration.sql}`)
    .digest("hex");
}

function validateMigrationSequence(
  migrations: readonly SqliteMigration[],
): void {
  if (migrations.length === 0) {
    throw new MigrationError(
      "Migration definitions must contain at least version 1.",
    );
  }

  migrations.forEach((migration, index) => {
    const expectedVersion = index + 1;

    if (
      migration.version !== expectedVersion ||
      migration.name.trim() === "" ||
      migration.sql.trim() === ""
    ) {
      throw new MigrationError(
        `Migration definitions must be non-empty and sequential from version 1; expected version ${expectedVersion}.`,
      );
    }
  });
}

function readAppliedMigrations(
  database: SqliteDatabase,
): readonly AppliedMigration[] {
  return database
    .prepare<[], AppliedMigration>(
      `
        SELECT version, name, checksum
        FROM schema_migrations
        ORDER BY version
      `,
    )
    .all();
}

function validateAppliedMigrations(
  appliedMigrations: readonly AppliedMigration[],
  migrations: readonly SqliteMigration[],
): void {
  appliedMigrations.forEach((appliedMigration, index) => {
    const migration = migrations[index];

    if (migration === undefined) {
      throw new MigrationError(
        "The database schema is newer than this application supports.",
      );
    }

    if (
      appliedMigration.version !== migration.version ||
      appliedMigration.name !== migration.name ||
      appliedMigration.checksum !== calculateChecksum(migration)
    ) {
      throw new MigrationError(
        `Migration history validation failed at version ${appliedMigration.version}. Restore the expected migration before continuing.`,
      );
    }
  });
}

function applyMigration(
  database: SqliteDatabase,
  migration: SqliteMigration,
): void {
  const recordMigration = database.prepare<
    [number, string, string, string],
    never
  >(
    `
      INSERT INTO schema_migrations (
        version,
        name,
        checksum,
        applied_at
      ) VALUES (?, ?, ?, ?)
    `,
  );

  try {
    database.runInTransaction(() => {
      database.executeSchema(migration.sql);
      recordMigration.run(
        migration.version,
        migration.name,
        calculateChecksum(migration),
        new Date().toISOString(),
      );
    });
  } catch (error: unknown) {
    throw new MigrationError(
      `Migration version ${migration.version} could not be applied. Its database changes were rolled back.`,
      { cause: error },
    );
  }
}

export function migrateDatabase(
  database: SqliteDatabase,
  migrations: readonly SqliteMigration[] = sqliteMigrations,
): MigrationResult {
  validateMigrationSequence(migrations);
  database.executeSchema(CREATE_MIGRATION_HISTORY_TABLE_SQL);

  const appliedMigrations = readAppliedMigrations(database);
  validateAppliedMigrations(appliedMigrations, migrations);

  const pendingMigrations = migrations.slice(appliedMigrations.length);
  pendingMigrations.forEach((migration) => {
    applyMigration(database, migration);
  });

  return Object.freeze({
    appliedVersions: Object.freeze(
      pendingMigrations.map((migration) => migration.version),
    ),
    currentVersion: migrations.at(-1)?.version ?? 0,
  });
}
