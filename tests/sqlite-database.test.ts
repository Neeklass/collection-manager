import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { migrateDatabase } from "@/infrastructure/database/migrate-database";
import type { SqliteMigration } from "@/infrastructure/database/migration";
import { sqliteMigrations } from "@/infrastructure/database/migrations";
import {
  openSqliteDatabase,
  type SqliteDatabase,
  SqliteDatabaseError,
} from "@/infrastructure/database/sqlite-database";

type MigrationHistoryRow = {
  readonly name: string;
  readonly checksum: string;
};

type MetadataRow = {
  readonly metadataValue: string;
};

type CountRow = {
  readonly count: number;
};

const temporaryDirectories: string[] = [];
const openDatabases: SqliteDatabase[] = [];

async function createDatabaseConfiguration(): Promise<{
  readonly dataDirectory: string;
  readonly databasePath: string;
}> {
  const rootDirectory = await mkdtemp(
    path.join(tmpdir(), "collection-manager-sqlite-"),
  );
  const dataDirectory = path.join(rootDirectory, "local-data");
  const databasePath = path.join(
    dataDirectory,
    "database",
    "collection.sqlite",
  );

  temporaryDirectories.push(rootDirectory);

  return { dataDirectory, databasePath };
}

function trackDatabase(database: SqliteDatabase): SqliteDatabase {
  openDatabases.push(database);
  return database;
}

afterEach(async () => {
  openDatabases.splice(0).forEach((database) => {
    database.close();
  });

  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("SQLite database", () => {
  it("creates the database beneath the configured local data directory", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    expect(existsSync(configuration.databasePath)).toBe(true);
    expect(database.isOpen).toBe(true);

    database.close();
    expect(database.isOpen).toBe(false);
  });

  it("rejects an adapter configuration that escapes the data directory", async () => {
    const configuration = await createDatabaseConfiguration();
    const outsidePath = path.join(
      path.dirname(configuration.dataDirectory),
      "outside.sqlite",
    );

    expect(() =>
      openSqliteDatabase({
        dataDirectory: configuration.dataDirectory,
        databasePath: outsidePath,
      }),
    ).toThrowError(SqliteDatabaseError);
    expect(existsSync(outsidePath)).toBe(false);
  });

  it("enables write-ahead logging and enforces foreign keys", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    expect(database.getRuntimeSettings()).toEqual({
      foreignKeysEnabled: true,
      journalMode: "wal",
    });

    database.executeSchema(`
      CREATE TABLE test_parent (id INTEGER PRIMARY KEY);
      CREATE TABLE test_child (
        parent_id INTEGER NOT NULL REFERENCES test_parent(id)
      );
    `);

    expect(() =>
      database
        .prepare<[number]>("INSERT INTO test_child (parent_id) VALUES (?)")
        .run(404),
    ).toThrowError(/FOREIGN KEY constraint failed/);
  });
});

describe("SQLite migrations", () => {
  it("creates a database from scratch and upgrades it to the latest schema", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    expect(migrateDatabase(database)).toEqual({
      appliedVersions: [1, 2, 3],
      currentVersion: 3,
    });

    const history = database
      .prepare<[number], MigrationHistoryRow>(
        `
          SELECT name, checksum
          FROM schema_migrations
          WHERE version = ?
        `,
      )
      .get(3);

    expect(history).toEqual({
      name: "collection-persistence",
      checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
    });

    database
      .prepare<[string, string, string]>(
        `
          INSERT INTO database_metadata (
            metadata_key,
            metadata_value,
            updated_at
          ) VALUES (?, ?, ?)
        `,
      )
      .run("database_format", "collection-manager", new Date().toISOString());

    expect(
      database
        .prepare<[string], MetadataRow>(
          `
            SELECT metadata_value AS metadataValue
            FROM database_metadata
            WHERE metadata_key = ?
          `,
        )
        .get("database_format"),
    ).toEqual({ metadataValue: "collection-manager" });
  });

  it("is idempotent when the latest schema is already applied", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    migrateDatabase(database);

    expect(migrateDatabase(database)).toEqual({
      appliedVersions: [],
      currentVersion: 3,
    });
  });

  it("rejects changed migration content after it has been applied", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    migrateDatabase(database);

    const appliedMigration = sqliteMigrations[0];
    if (appliedMigration === undefined) {
      throw new Error("Expected the initial migration to exist.");
    }

    const changedMigrations: readonly SqliteMigration[] = [
      {
        ...appliedMigration,
        sql: `${appliedMigration.sql}\n-- changed after application`,
      },
    ];

    expect(() => migrateDatabase(database, changedMigrations)).toThrowError(
      "Migration history validation failed at version 1.",
    );
  });

  it("rejects migration definitions that are not sequential", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    expect(() =>
      migrateDatabase(database, [
        {
          version: 2,
          name: "invalid-first-version",
          sql: "SELECT 1;",
        },
      ]),
    ).toThrowError(
      "Migration definitions must be non-empty and sequential from version 1; expected version 1.",
    );
  });

  it("rejects an empty migration definition", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));

    expect(() => migrateDatabase(database, [])).toThrowError(
      "Migration definitions must contain at least version 1.",
    );
  });

  it("rolls back a migration and its history record when applying it fails", async () => {
    const configuration = await createDatabaseConfiguration();
    const database = trackDatabase(openSqliteDatabase(configuration));
    const failingMigration: SqliteMigration = {
      version: 4,
      name: "failing-test-migration",
      sql: `
        CREATE TABLE table_that_must_be_rolled_back (id INTEGER PRIMARY KEY);
        INVALID SQL;
      `,
    };

    expect(() =>
      migrateDatabase(database, [...sqliteMigrations, failingMigration]),
    ).toThrowError(
      "Migration version 4 could not be applied. Its database changes were rolled back.",
    );

    expect(
      database
        .prepare<[string], CountRow>(
          `
            SELECT count(*) AS count
            FROM sqlite_master
            WHERE type = 'table' AND name = ?
          `,
        )
        .get("table_that_must_be_rolled_back"),
    ).toEqual({ count: 0 });
    expect(
      database
        .prepare<[number], CountRow>(
          "SELECT count(*) AS count FROM schema_migrations WHERE version = ?",
        )
        .get(4),
    ).toEqual({ count: 0 });
  });
});
