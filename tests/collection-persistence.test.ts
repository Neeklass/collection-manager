import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { migrateDatabase } from "@/infrastructure/database/migrate-database";
import {
  openSqliteDatabase,
  type SqliteDatabase,
} from "@/infrastructure/database/sqlite-database";

const TIMESTAMP = "2026-07-29T19:35:11.780Z";
const COLLECTION_ID = "11111111-1111-4111-8111-111111111111";
const NEAR_MINT_CONDITION_ID = "22222222-2222-4222-8222-222222222222";
const PLAYED_CONDITION_ID = "33333333-3333-4333-8333-333333333333";
const CARD_ID = "44444444-4444-4444-8444-444444444444";
const OTHER_CARD_ID = "55555555-5555-4555-8555-555555555555";
const NORMAL_VARIANT_ID = "66666666-6666-4666-8666-666666666666";
const HOLO_VARIANT_ID = "77777777-7777-4777-8777-777777777777";

type EntryValues = {
  readonly id: string;
  readonly catalogItemId?: string;
  readonly variantId?: string | null;
  readonly quantity?: number;
  readonly languageCode?: string;
  readonly conditionGradeId?: string;
  readonly sealedState?: string;
  readonly storageLocation?: string | null;
  readonly notes?: string | null;
  readonly acquisitionDate?: string | null;
  readonly acquisitionSource?: string | null;
  readonly purchaseMinorUnits?: number | null;
  readonly purchaseCurrencyCode?: string | null;
  readonly manualValueMinorUnits?: number | null;
  readonly manualValueCurrencyCode?: string | null;
};

type CollectionEntryRow = {
  readonly id: string;
  readonly variantId: string | null;
  readonly quantity: number;
  readonly languageCode: string;
  readonly conditionCode: string;
  readonly sealedState: string;
  readonly storageLocation: string | null;
  readonly notes: string | null;
  readonly acquisitionDate: string | null;
  readonly acquisitionSource: string | null;
  readonly purchaseMinorUnits: number | null;
  readonly purchaseCurrencyCode: string | null;
  readonly manualValueMinorUnits: number | null;
  readonly manualValueCurrencyCode: string | null;
  readonly revision: number;
};

type NameRow = {
  readonly name: string;
};

const temporaryDirectories: string[] = [];
const openDatabases: SqliteDatabase[] = [];

async function createMigratedDatabase(): Promise<SqliteDatabase> {
  const rootDirectory = await mkdtemp(
    path.join(tmpdir(), "collection-manager-collection-"),
  );
  const dataDirectory = path.join(rootDirectory, "local-data");
  const database = openSqliteDatabase({
    dataDirectory,
    databasePath: path.join(dataDirectory, "collection.sqlite"),
  });

  temporaryDirectories.push(rootDirectory);
  openDatabases.push(database);
  migrateDatabase(database);

  return database;
}

function insertCollectionAndConditions(database: SqliteDatabase): void {
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
    .run(
      COLLECTION_ID,
      "Personal collection",
      "de-DE",
      "EUR",
      TIMESTAMP,
      TIMESTAMP,
    );

  const insertCondition = database.prepare<
    [string, string, string, number, string, string]
  >(
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
  );

  insertCondition.run(
    NEAR_MINT_CONDITION_ID,
    "near_mint",
    "Near mint",
    10,
    TIMESTAMP,
    TIMESTAMP,
  );
  insertCondition.run(
    PLAYED_CONDITION_ID,
    "played",
    "Played",
    20,
    TIMESTAMP,
    TIMESTAMP,
  );
}

function insertCard(
  database: SqliteDatabase,
  id: string,
  displayName: string,
  localCardNumber: string,
): void {
  database
    .prepare<[string, string, string, string, string, string]>(
      `
        INSERT INTO catalog_items (
          id,
          item_kind,
          display_name,
          normalized_name,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      "card",
      displayName,
      displayName.toLowerCase(),
      TIMESTAMP,
      TIMESTAMP,
    );

  database
    .prepare<[string, string, string, string, string, string]>(
      `
        INSERT INTO card_details (
          catalog_item_id,
          item_kind,
          local_card_number,
          normalized_local_card_number,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      "card",
      localCardNumber,
      localCardNumber.toLowerCase(),
      TIMESTAMP,
      TIMESTAMP,
    );
}

function insertVariant(
  database: SqliteDatabase,
  id: string,
  cardId: string,
  key: string,
  label: string,
): void {
  database
    .prepare<[string, string, string, string, string, string]>(
      `
        INSERT INTO card_variants (
          id,
          card_id,
          variant_key,
          local_label,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(id, cardId, key, label, TIMESTAMP, TIMESTAMP);
}

function insertEntry(database: SqliteDatabase, values: EntryValues): void {
  database
    .prepare<
      [
        string,
        string,
        string,
        string | null,
        number,
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
        string | null,
        number | null,
        string | null,
        number | null,
        string | null,
        string,
        string,
      ]
    >(
      `
        INSERT INTO collection_entries (
          id,
          collection_id,
          catalog_item_id,
          variant_id,
          quantity,
          language_code,
          condition_grade_id,
          sealed_state,
          storage_location,
          notes,
          acquisition_date,
          acquisition_source,
          purchase_unit_price_minor_units,
          purchase_currency_code,
          manual_value_minor_units,
          manual_value_currency_code,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      values.id,
      COLLECTION_ID,
      values.catalogItemId ?? CARD_ID,
      values.variantId ?? null,
      values.quantity ?? 1,
      values.languageCode ?? "de-DE",
      values.conditionGradeId ?? NEAR_MINT_CONDITION_ID,
      values.sealedState ?? "not_applicable",
      values.storageLocation ?? null,
      values.notes ?? null,
      values.acquisitionDate ?? null,
      values.acquisitionSource ?? null,
      values.purchaseMinorUnits ?? null,
      values.purchaseCurrencyCode ?? null,
      values.manualValueMinorUnits ?? null,
      values.manualValueCurrencyCode ?? null,
      TIMESTAMP,
      TIMESTAMP,
    );
}

function prepareInventory(database: SqliteDatabase): void {
  insertCollectionAndConditions(database);
  insertCard(database, CARD_ID, "Pikachu", "GG60");
  insertCard(database, OTHER_CARD_ID, "Raichu", "GG61");
  insertVariant(database, NORMAL_VARIANT_ID, CARD_ID, "normal", "Normal");
  insertVariant(database, HOLO_VARIANT_ID, CARD_ID, "holo", "Holo");
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

describe("collection persistence migration", () => {
  it("creates collection tables and all required collection-entry indexes", async () => {
    const database = await createMigratedDatabase();

    const tableNames = database
      .prepare<[string, string, string, string], NameRow>(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = ? AND name IN (?, ?, ?)
          ORDER BY name
        `,
      )
      .all("table", "collection_entries", "collections", "condition_grades")
      .map(({ name }) => name);

    expect(tableNames).toEqual([
      "collection_entries",
      "collections",
      "condition_grades",
    ]);

    const indexNames = database
      .prepare<[string, string], NameRow>(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = ? AND tbl_name = ?
          ORDER BY name
        `,
      )
      .all("index", "collection_entries")
      .map(({ name }) => name);

    expect(indexNames).toEqual(
      expect.arrayContaining([
        "index_collection_entries_on_acquisition_date",
        "index_collection_entries_on_catalog_item_id",
        "index_collection_entries_on_collection_id",
        "index_collection_entries_on_condition_grade_id",
        "index_collection_entries_on_language_code",
        "index_collection_entries_on_variant_id",
      ]),
    );
  });

  it("persists intentional homogeneous lots for one catalog card", async () => {
    const database = await createMigratedDatabase();
    const entries = [
      {
        id: "88888888-8888-4888-8888-888888888888",
        variantId: NORMAL_VARIANT_ID,
        quantity: 2,
        languageCode: "de-DE",
        conditionGradeId: NEAR_MINT_CONDITION_ID,
        sealedState: "not_applicable",
        storageLocation: "Binder A",
        notes: "Matching pair",
        acquisitionDate: "2026-07-01",
        acquisitionSource: "Local card shop",
        purchaseMinorUnits: 1_250,
        purchaseCurrencyCode: "EUR",
        manualValueMinorUnits: 1_600,
        manualValueCurrencyCode: "EUR",
      },
      {
        id: "99999999-9999-4999-8999-999999999999",
        variantId: HOLO_VARIANT_ID,
        languageCode: "en",
        conditionGradeId: PLAYED_CONDITION_ID,
        sealedState: "unsealed",
        acquisitionDate: "2025-12-24",
        acquisitionSource: "Gift",
      },
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        variantId: NORMAL_VARIANT_ID,
        languageCode: "ja",
        sealedState: "unknown",
      },
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        variantId: NORMAL_VARIANT_ID,
        languageCode: "de-DE",
        conditionGradeId: NEAR_MINT_CONDITION_ID,
        sealedState: "sealed",
        acquisitionSource: "Convention seller",
      },
      {
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        variantId: NORMAL_VARIANT_ID,
        quantity: 2,
        languageCode: "de-DE",
        conditionGradeId: NEAR_MINT_CONDITION_ID,
        sealedState: "not_applicable",
        storageLocation: "Binder A",
        notes: "Matching pair",
        acquisitionDate: "2026-07-01",
        acquisitionSource: "Local card shop",
        purchaseMinorUnits: 1_250,
        purchaseCurrencyCode: "EUR",
        manualValueMinorUnits: 1_600,
        manualValueCurrencyCode: "EUR",
      },
    ] as const;

    prepareInventory(database);
    entries.forEach((entry) => {
      insertEntry(database, entry);
    });

    const persistedEntries = database
      .prepare<[string], CollectionEntryRow>(
        `
          SELECT
            collection_entries.id,
            collection_entries.variant_id AS variantId,
            collection_entries.quantity,
            collection_entries.language_code AS languageCode,
            condition_grades.code AS conditionCode,
            collection_entries.sealed_state AS sealedState,
            collection_entries.storage_location AS storageLocation,
            collection_entries.notes,
            collection_entries.acquisition_date AS acquisitionDate,
            collection_entries.acquisition_source AS acquisitionSource,
            collection_entries.purchase_unit_price_minor_units
              AS purchaseMinorUnits,
            collection_entries.purchase_currency_code
              AS purchaseCurrencyCode,
            collection_entries.manual_value_minor_units
              AS manualValueMinorUnits,
            collection_entries.manual_value_currency_code
              AS manualValueCurrencyCode,
            collection_entries.revision
          FROM collection_entries
          INNER JOIN condition_grades
            ON condition_grades.id = collection_entries.condition_grade_id
          WHERE collection_entries.catalog_item_id = ?
          ORDER BY collection_entries.id
        `,
      )
      .all(CARD_ID);

    expect(persistedEntries).toHaveLength(5);
    expect(persistedEntries[0]).toEqual({
      id: entries[0].id,
      variantId: NORMAL_VARIANT_ID,
      quantity: 2,
      languageCode: "de-DE",
      conditionCode: "near_mint",
      sealedState: "not_applicable",
      storageLocation: "Binder A",
      notes: "Matching pair",
      acquisitionDate: "2026-07-01",
      acquisitionSource: "Local card shop",
      purchaseMinorUnits: 1_250,
      purchaseCurrencyCode: "EUR",
      manualValueMinorUnits: 1_600,
      manualValueCurrencyCode: "EUR",
      revision: 1,
    });
    expect(persistedEntries.map(({ sealedState }) => sealedState)).toEqual([
      "not_applicable",
      "unsealed",
      "unknown",
      "sealed",
      "not_applicable",
    ]);
  });

  it("rejects non-positive quantities and incomplete or invalid money pairs", async () => {
    const database = await createMigratedDatabase();

    prepareInventory(database);

    const invalidEntries: readonly EntryValues[] = [
      {
        id: "c0000000-0000-4000-8000-000000000001",
        quantity: 0,
      },
      {
        id: "c0000000-0000-4000-8000-000000000002",
        purchaseMinorUnits: 100,
      },
      {
        id: "c0000000-0000-4000-8000-000000000003",
        purchaseCurrencyCode: "EUR",
      },
      {
        id: "c0000000-0000-4000-8000-000000000004",
        purchaseMinorUnits: -1,
        purchaseCurrencyCode: "EUR",
      },
      {
        id: "c0000000-0000-4000-8000-000000000005",
        manualValueMinorUnits: 500,
      },
      {
        id: "c0000000-0000-4000-8000-000000000006",
        manualValueCurrencyCode: "USD",
      },
      {
        id: "c0000000-0000-4000-8000-000000000007",
        manualValueMinorUnits: -1,
        manualValueCurrencyCode: "USD",
      },
      {
        id: "c0000000-0000-4000-8000-000000000008",
        manualValueMinorUnits: 500,
        manualValueCurrencyCode: "usd",
      },
      {
        id: "c0000000-0000-4000-8000-000000000009",
        manualValueMinorUnits: 500,
        manualValueCurrencyCode: "ZZZ",
      },
    ];

    invalidEntries.forEach((entry) => {
      expect(() => insertEntry(database, entry)).toThrowError(
        /CHECK constraint failed/,
      );
    });
  });

  it("enforces entry ownership, same-card variants, canonical codes, and restrictive deletes", async () => {
    const database = await createMigratedDatabase();
    const validEntryId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

    prepareInventory(database);
    insertEntry(database, {
      id: validEntryId,
      variantId: NORMAL_VARIANT_ID,
    });

    expect(() =>
      insertEntry(database, {
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        catalogItemId: OTHER_CARD_ID,
        variantId: NORMAL_VARIANT_ID,
      }),
    ).toThrowError(/FOREIGN KEY constraint failed/);
    expect(() =>
      insertEntry(database, {
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        languageCode: "DE-de",
      }),
    ).toThrowError(/CHECK constraint failed/);
    expect(() =>
      insertEntry(database, {
        id: "f0000000-0000-4000-8000-000000000001",
        languageCode: "12-ABCDEF",
      }),
    ).toThrowError(/CHECK constraint failed/);
    expect(() =>
      insertEntry(database, {
        id: "f0000000-0000-4000-8000-000000000002",
        languageCode: "de-de",
      }),
    ).toThrowError(/CHECK constraint failed/);
    expect(() =>
      database
        .prepare<[string]>("DELETE FROM collections WHERE id = ?")
        .run(COLLECTION_ID),
    ).toThrowError(/FOREIGN KEY constraint failed/);
    expect(() =>
      database
        .prepare<[string]>("DELETE FROM catalog_items WHERE id = ?")
        .run(CARD_ID),
    ).toThrowError(/FOREIGN KEY constraint failed/);
    expect(() =>
      database
        .prepare<[string]>("DELETE FROM card_variants WHERE id = ?")
        .run(NORMAL_VARIANT_ID),
    ).toThrowError(/FOREIGN KEY constraint failed/);
    expect(() =>
      database
        .prepare<[string]>("DELETE FROM condition_grades WHERE id = ?")
        .run(NEAR_MINT_CONDITION_ID),
    ).toThrowError(/FOREIGN KEY constraint failed/);
  });
});
