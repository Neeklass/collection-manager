import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ApplicationClock } from "@/application/ports/application-clock";
import { parseApplicationConfiguration } from "@/infrastructure/configuration/application-configuration";
import {
  bootstrapDatabase,
  DatabaseBootstrapError,
  DEFAULT_LOCAL_COLLECTION_ID,
  SEEDED_CONDITION_GRADES,
} from "@/infrastructure/database/bootstrap-database";
import { migrateDatabase } from "@/infrastructure/database/migrate-database";
import {
  openSqliteDatabase,
  type SqliteDatabase,
} from "@/infrastructure/database/sqlite-database";

const TIMESTAMP = "2026-07-29T19:56:15.084Z";
const UPDATED_TIMESTAMP = "2026-07-30T19:56:15.084Z";
const EXISTING_COLLECTION_ID = "30000000-0000-4000-8000-000000000001";
const CONFLICTING_CONDITION_ID = "30000000-0000-4000-8000-000000000002";

const fixedClock: ApplicationClock = {
  now: (): Date => new Date(TIMESTAMP),
};

type CollectionRow = {
  readonly id: string;
  readonly name: string;
  readonly defaultLanguageCode: string;
  readonly defaultCurrencyCode: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type ConditionGradeRow = {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly displayOrder: number;
  readonly description: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type CountRow = {
  readonly count: number;
};

const temporaryDirectories: string[] = [];
const openDatabases: SqliteDatabase[] = [];

async function createMigratedDatabase(): Promise<{
  readonly database: SqliteDatabase;
  readonly configuration: ReturnType<typeof parseApplicationConfiguration>;
}> {
  const rootDirectory = await mkdtemp(
    path.join(tmpdir(), "collection-manager-bootstrap-"),
  );
  const dataDirectory = path.join(rootDirectory, "local-data");
  const databasePath = path.join(dataDirectory, "collection.sqlite");
  const configuration = parseApplicationConfiguration({
    COLLECTION_MANAGER_DATA_DIRECTORY: dataDirectory,
    COLLECTION_MANAGER_DATABASE_PATH: databasePath,
    COLLECTION_MANAGER_DEFAULT_LANGUAGE: "en-gb",
    COLLECTION_MANAGER_DEFAULT_CURRENCY: "usd",
  });
  const database = openSqliteDatabase(configuration);

  temporaryDirectories.push(rootDirectory);
  openDatabases.push(database);
  migrateDatabase(database);

  return { database, configuration };
}

function readCollections(database: SqliteDatabase): readonly CollectionRow[] {
  return database
    .prepare<[], CollectionRow>(
      `
        SELECT
          id,
          name,
          default_language_code AS defaultLanguageCode,
          default_currency_code AS defaultCurrencyCode,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM collections
        ORDER BY id
      `,
    )
    .all();
}

function readConditionGrades(
  database: SqliteDatabase,
): readonly ConditionGradeRow[] {
  return database
    .prepare<[], ConditionGradeRow>(
      `
        SELECT
          id,
          code,
          display_name AS displayName,
          display_order AS displayOrder,
          description,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM condition_grades
        ORDER BY display_order
      `,
    )
    .all();
}

function insertCollection(
  database: SqliteDatabase,
  id: string,
  name: string,
): void {
  database
    .prepare<[string, string, string, string, string, string]>(
      `
        INSERT INTO collections (
          id,
          name,
          default_language_code,
          default_currency_code,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(id, name, "ja", "JPY", TIMESTAMP, TIMESTAMP);
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

describe("database bootstrap", () => {
  it("creates the fixed condition grades and one configured local collection on first run", async () => {
    const { database, configuration } = await createMigratedDatabase();

    expect(bootstrapDatabase(database, configuration, fixedClock)).toEqual({
      conditionGradesCreated: SEEDED_CONDITION_GRADES.length,
      collectionCreated: true,
    });
    expect(readCollections(database)).toEqual([
      {
        id: DEFAULT_LOCAL_COLLECTION_ID,
        name: "Local collection",
        defaultLanguageCode: "en-GB",
        defaultCurrencyCode: "USD",
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      },
    ]);
    expect(readConditionGrades(database)).toEqual(
      SEEDED_CONDITION_GRADES.map((conditionGrade) => ({
        ...conditionGrade,
        description: null,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      })),
    );
    expect(readConditionGrades(database).at(-1)?.code).toBe("unknown");
  });

  it("is idempotent and restores only a missing fixed grade", async () => {
    const { database, configuration } = await createMigratedDatabase();

    bootstrapDatabase(database, configuration, fixedClock);

    expect(bootstrapDatabase(database, configuration, fixedClock)).toEqual({
      conditionGradesCreated: 0,
      collectionCreated: false,
    });
    expect(readCollections(database)).toHaveLength(1);
    expect(readConditionGrades(database)).toHaveLength(
      SEEDED_CONDITION_GRADES.length,
    );

    const unknownGrade = SEEDED_CONDITION_GRADES.at(-1);
    if (unknownGrade === undefined) {
      throw new Error("Expected an unknown condition grade seed.");
    }

    database
      .prepare<[string]>("DELETE FROM condition_grades WHERE id = ?")
      .run(unknownGrade.id);

    expect(bootstrapDatabase(database, configuration, fixedClock)).toEqual({
      conditionGradesCreated: 1,
      collectionCreated: false,
    });
    expect(readConditionGrades(database)).toHaveLength(
      SEEDED_CONDITION_GRADES.length,
    );
  });

  it("preserves renamed collections and modified seeded grades", async () => {
    const { database, configuration } = await createMigratedDatabase();
    const mintGrade = SEEDED_CONDITION_GRADES[0];

    if (mintGrade === undefined) {
      throw new Error("Expected a mint condition grade seed.");
    }

    bootstrapDatabase(database, configuration, fixedClock);
    database
      .prepare<[string, string, string, string, string]>(
        `
          UPDATE collections
          SET
            name = ?,
            default_language_code = ?,
            default_currency_code = ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        "Renamed by user",
        "ja",
        "JPY",
        UPDATED_TIMESTAMP,
        DEFAULT_LOCAL_COLLECTION_ID,
      );
    database
      .prepare<[string, string, number, string, string, string]>(
        `
          UPDATE condition_grades
          SET
            code = ?,
            display_name = ?,
            display_order = ?,
            description = ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        "pristine",
        "Mint (custom)",
        11,
        "User-managed description",
        UPDATED_TIMESTAMP,
        mintGrade.id,
      );

    expect(bootstrapDatabase(database, configuration, fixedClock)).toEqual({
      conditionGradesCreated: 0,
      collectionCreated: false,
    });
    expect(readCollections(database)[0]).toMatchObject({
      name: "Renamed by user",
      defaultLanguageCode: "ja",
      defaultCurrencyCode: "JPY",
      updatedAt: UPDATED_TIMESTAMP,
    });
    expect(
      readConditionGrades(database).find(({ id }) => id === mintGrade.id),
    ).toMatchObject({
      code: "pristine",
      displayName: "Mint (custom)",
      displayOrder: 11,
      description: "User-managed description",
      updatedAt: UPDATED_TIMESTAMP,
    });
  });

  it("does not create a default collection when any collection already exists", async () => {
    const { database, configuration } = await createMigratedDatabase();

    insertCollection(database, EXISTING_COLLECTION_ID, "Existing collection");

    expect(bootstrapDatabase(database, configuration, fixedClock)).toEqual({
      conditionGradesCreated: SEEDED_CONDITION_GRADES.length,
      collectionCreated: false,
    });
    expect(readCollections(database)).toEqual([
      {
        id: EXISTING_COLLECTION_ID,
        name: "Existing collection",
        defaultLanguageCode: "ja",
        defaultCurrencyCode: "JPY",
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      },
    ]);
  });

  it("fails visibly and rolls back when fixed seed data conflicts", async () => {
    const { database, configuration } = await createMigratedDatabase();

    database
      .prepare<[string, string, string, number, string, string]>(
        `
          INSERT INTO condition_grades (
            id,
            code,
            display_name,
            display_order,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        CONFLICTING_CONDITION_ID,
        "near_mint",
        "Conflicting grade",
        999,
        TIMESTAMP,
        TIMESTAMP,
      );

    expect(() =>
      bootstrapDatabase(database, configuration, fixedClock),
    ).toThrowError(DatabaseBootstrapError);
    expect(
      database
        .prepare<[], CountRow>("SELECT count(*) AS count FROM condition_grades")
        .get(),
    ).toEqual({ count: 1 });
    expect(
      database
        .prepare<[], CountRow>("SELECT count(*) AS count FROM collections")
        .get(),
    ).toEqual({ count: 0 });
  });
});
