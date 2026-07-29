import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { migrateDatabase } from "@/infrastructure/database/migrate-database";
import {
  openSqliteDatabase,
  type SqliteDatabase,
} from "@/infrastructure/database/sqlite-database";

const TIMESTAMP = "2026-07-29T19:09:57.174Z";
const SERIES_ID = "11111111-1111-4111-8111-111111111111";
const SET_ID = "22222222-2222-4222-8222-222222222222";
const CARD_ID = "33333333-3333-4333-8333-333333333333";

type TableNameRow = {
  readonly name: string;
};

type CatalogItemRow = {
  readonly itemKind: string;
  readonly displayName: string;
};

type DetailCountRow = {
  readonly cardDetails: number;
  readonly productDetails: number;
  readonly externalReferences: number;
};

type ExternalCardRow = {
  readonly itemKind: string;
  readonly localCardNumber: string;
  readonly localCardNumberType: string;
  readonly promotionalNumber: string;
  readonly promotionalNumberType: string;
  readonly provider: string;
  readonly externalId: string;
  readonly languageCode: string;
  readonly rawPayload: string;
};

type PokemonRow = {
  readonly displayName: string;
  readonly pokedexNumber: number;
};

type CountRow = {
  readonly count: number;
};

const temporaryDirectories: string[] = [];
const openDatabases: SqliteDatabase[] = [];

async function createMigratedDatabase(): Promise<SqliteDatabase> {
  const rootDirectory = await mkdtemp(
    path.join(tmpdir(), "collection-manager-catalog-"),
  );
  const dataDirectory = path.join(rootDirectory, "local-data");
  const database = openSqliteDatabase({
    dataDirectory,
    databasePath: path.join(dataDirectory, "catalog.sqlite"),
  });

  temporaryDirectories.push(rootDirectory);
  openDatabases.push(database);
  migrateDatabase(database);

  return database;
}

function insertSeriesAndSet(database: SqliteDatabase): void {
  database
    .prepare<[string, string, string, string, string]>(
      `
        INSERT INTO catalog_series (
          id,
          display_name,
          normalized_name,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `,
    )
    .run(
      SERIES_ID,
      "Scarlet & Violet",
      "scarlet & violet",
      TIMESTAMP,
      TIMESTAMP,
    );

  database
    .prepare<
      [string, string, string, string, string, number, number, string, string]
    >(
      `
        INSERT INTO catalog_sets (
          id,
          series_id,
          display_name,
          normalized_name,
          set_code,
          printed_card_count,
          total_card_count,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      SET_ID,
      SERIES_ID,
      "Paldean Fates",
      "paldean fates",
      "PAF",
      91,
      245,
      TIMESTAMP,
      TIMESTAMP,
    );
}

function insertCard(database: SqliteDatabase): void {
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
    .run(CARD_ID, "card", "Pikachu", "pikachu", TIMESTAMP, TIMESTAMP);

  database
    .prepare<[string, string, string, string, string, string, string, string]>(
      `
        INSERT INTO card_details (
          catalog_item_id,
          item_kind,
          set_id,
          local_card_number,
          normalized_local_card_number,
          promotional_number,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      CARD_ID,
      "card",
      SET_ID,
      "GG60",
      "gg60",
      "SVP 001",
      TIMESTAMP,
      TIMESTAMP,
    );
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

describe("catalog persistence migration", () => {
  it("creates the catalog tables and persists a custom item without external metadata", async () => {
    const database = await createMigratedDatabase();
    const customItemId = "44444444-4444-4444-8444-444444444444";

    const tableNames = database
      .prepare<[string], TableNameRow>(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = ?
          ORDER BY name
        `,
      )
      .all("table")
      .map(({ name }) => name);

    expect(tableNames).toEqual(
      expect.arrayContaining([
        "card_details",
        "card_pokemon_links",
        "card_variants",
        "catalog_items",
        "catalog_series",
        "catalog_sets",
        "external_references",
        "pokemon",
        "product_details",
      ]),
    );

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
        customItemId,
        "custom",
        "Convention badge",
        "convention badge",
        TIMESTAMP,
        TIMESTAMP,
      );

    expect(
      database
        .prepare<[string], CatalogItemRow>(
          `
            SELECT
              item_kind AS itemKind,
              display_name AS displayName
            FROM catalog_items
            WHERE id = ?
          `,
        )
        .get(customItemId),
    ).toEqual({
      itemKind: "custom",
      displayName: "Convention badge",
    });

    expect(
      database
        .prepare<[string, string, string], DetailCountRow>(
          `
            SELECT
              (SELECT count(*) FROM card_details WHERE catalog_item_id = ?)
                AS cardDetails,
              (SELECT count(*) FROM product_details WHERE catalog_item_id = ?)
                AS productDetails,
              (SELECT count(*) FROM external_references
                WHERE catalog_item_id = ?)
                AS externalReferences
          `,
        )
        .get(customItemId, customItemId, customItemId),
    ).toEqual({
      cardDetails: 0,
      productDetails: 0,
      externalReferences: 0,
    });
  });

  it("persists an externally referenced card with text card and promotional numbers", async () => {
    const database = await createMigratedDatabase();
    const externalReferenceId = "55555555-5555-4555-8555-555555555555";
    const rawPayload = JSON.stringify({
      id: "sv4pt5-131",
      localId: "GG60",
    });

    insertSeriesAndSet(database);
    insertCard(database);

    const insertExternalReference = database.prepare<
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
        string,
        string | null,
        string,
        string,
      ]
    >(
      `
        INSERT INTO external_references (
          id,
          provider,
          entity_kind,
          external_id,
          language_code,
          card_id,
          source_url,
          source_version,
          raw_payload,
          synchronization_status,
          last_synchronized_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    );

    insertExternalReference.run(
      externalReferenceId,
      "tcgdex",
      "card",
      "sv4pt5-131",
      "en",
      CARD_ID,
      "https://api.tcgdex.net/v2/en/cards/sv4pt5-131",
      "v2",
      rawPayload,
      "synchronized",
      TIMESTAMP,
      TIMESTAMP,
      TIMESTAMP,
    );

    expect(
      database
        .prepare<[string, string, string], ExternalCardRow>(
          `
            SELECT
              catalog_items.item_kind AS itemKind,
              card_details.local_card_number AS localCardNumber,
              typeof(card_details.local_card_number) AS localCardNumberType,
              card_details.promotional_number AS promotionalNumber,
              typeof(card_details.promotional_number)
                AS promotionalNumberType,
              external_references.provider,
              external_references.external_id AS externalId,
              external_references.language_code AS languageCode,
              external_references.raw_payload AS rawPayload
            FROM external_references
            INNER JOIN card_details
              ON card_details.catalog_item_id = external_references.card_id
            INNER JOIN catalog_items
              ON catalog_items.id = card_details.catalog_item_id
            WHERE external_references.provider = ?
              AND external_references.external_id = ?
              AND external_references.language_code = ?
          `,
        )
        .get("tcgdex", "sv4pt5-131", "en"),
    ).toEqual({
      itemKind: "card",
      localCardNumber: "GG60",
      localCardNumberType: "text",
      promotionalNumber: "SVP 001",
      promotionalNumberType: "text",
      provider: "tcgdex",
      externalId: "sv4pt5-131",
      languageCode: "en",
      rawPayload,
    });

    expect(() =>
      insertExternalReference.run(
        "66666666-6666-4666-8666-666666666666",
        "tcgdex",
        "card",
        "sv4pt5-131",
        "EN",
        CARD_ID,
        "https://api.tcgdex.net/v2/en/cards/sv4pt5-131",
        "v2",
        rawPayload,
        "synchronized",
        TIMESTAMP,
        TIMESTAMP,
        TIMESTAMP,
      ),
    ).toThrowError(
      /UNIQUE constraint failed: external_references\.provider, external_references\.entity_kind, external_references\.external_id, external_references\.language_code/,
    );

    expect(() =>
      insertExternalReference.run(
        "77777777-7777-4777-8777-777777777777",
        "tcgdex",
        "card",
        "different-id",
        "en",
        CARD_ID,
        null,
        null,
        "{invalid-json",
        "never",
        null,
        TIMESTAMP,
        TIMESTAMP,
      ),
    ).toThrowError(/CHECK constraint failed/);

    expect(() =>
      database
        .prepare<
          [string, string, string, string, string, string, string, string]
        >(
          `
            INSERT INTO external_references (
              id,
              provider,
              entity_kind,
              external_id,
              language_code,
              catalog_item_id,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          "88888888-8888-4888-8888-888888888888",
          "tcgdex",
          "card",
          "unchecked-card-target",
          "en",
          CARD_ID,
          TIMESTAMP,
          TIMESTAMP,
        ),
    ).toThrowError(/CHECK constraint failed/);
  });

  it("links one card to multiple Pokemon and cascades card-owned records", async () => {
    const database = await createMigratedDatabase();
    const pokemon = [
      {
        id: "99999999-9999-4999-8999-999999999999",
        displayName: "Pikachu",
        normalizedName: "pikachu",
        pokedexNumber: 25,
      },
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        displayName: "Morpeko",
        normalizedName: "morpeko",
        pokedexNumber: 877,
      },
    ] as const;

    insertSeriesAndSet(database);
    insertCard(database);

    const insertPokemon = database.prepare<
      [string, string, string, number, string, string]
    >(
      `
        INSERT INTO pokemon (
          id,
          display_name,
          normalized_name,
          pokedex_number,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    );
    const linkPokemon = database.prepare<[string, string, string]>(
      `
        INSERT INTO card_pokemon_links (
          card_id,
          pokemon_id,
          created_at
        ) VALUES (?, ?, ?)
      `,
    );

    pokemon.forEach((entry) => {
      insertPokemon.run(
        entry.id,
        entry.displayName,
        entry.normalizedName,
        entry.pokedexNumber,
        TIMESTAMP,
        TIMESTAMP,
      );
      linkPokemon.run(CARD_ID, entry.id, TIMESTAMP);
    });

    expect(
      database
        .prepare<[string], PokemonRow>(
          `
            SELECT
              pokemon.display_name AS displayName,
              pokemon.pokedex_number AS pokedexNumber
            FROM card_pokemon_links
            INNER JOIN pokemon ON pokemon.id = card_pokemon_links.pokemon_id
            WHERE card_pokemon_links.card_id = ?
            ORDER BY pokemon.pokedex_number
          `,
        )
        .all(CARD_ID),
    ).toEqual([
      { displayName: "Pikachu", pokedexNumber: 25 },
      { displayName: "Morpeko", pokedexNumber: 877 },
    ]);

    database
      .prepare<[string]>("DELETE FROM catalog_items WHERE id = ?")
      .run(CARD_ID);

    expect(
      database
        .prepare<[string], CountRow>(
          `
            SELECT count(*) AS count
            FROM card_pokemon_links
            WHERE card_id = ?
          `,
        )
        .get(CARD_ID),
    ).toEqual({ count: 0 });
    expect(
      database
        .prepare<[string], CountRow>(
          `
            SELECT count(*) AS count
            FROM pokemon
            WHERE id IN (
              SELECT pokemon_id
              FROM card_pokemon_links
              WHERE card_id = ?
            )
          `,
        )
        .get(CARD_ID),
    ).toEqual({ count: 0 });
    expect(
      database
        .prepare<[], CountRow>("SELECT count(*) AS count FROM pokemon")
        .get(),
    ).toEqual({ count: 2 });
  });

  it("rejects negative set counts and mismatched typed details", async () => {
    const database = await createMigratedDatabase();
    const customItemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const insertSeries = database.prepare<
      [string, string, string, string, string]
    >(
      `
        INSERT INTO catalog_series (
          id,
          display_name,
          normalized_name,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `,
    );

    expect(() =>
      insertSeries.run(
        "00000000-0000-0000-0000-000000000000",
        "Invalid UUID",
        "invalid uuid",
        TIMESTAMP,
        TIMESTAMP,
      ),
    ).toThrowError(/CHECK constraint failed/);
    expect(() =>
      insertSeries.run(
        "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        "Invalid timestamp",
        "invalid timestamp",
        "2026-99-99T99:99:99.999Z",
        "2026-99-99T99:99:99.999Z",
      ),
    ).toThrowError(/CHECK constraint failed/);

    insertSeries.run(SERIES_ID, "Base", "base", TIMESTAMP, TIMESTAMP);

    expect(() =>
      database
        .prepare<
          [string, string, string, string, number, number, string, string]
        >(
          `
            INSERT INTO catalog_sets (
              id,
              series_id,
              display_name,
              normalized_name,
              printed_card_count,
              total_card_count,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          SET_ID,
          SERIES_ID,
          "Invalid set",
          "invalid set",
          -1,
          10,
          TIMESTAMP,
          TIMESTAMP,
        ),
    ).toThrowError(/CHECK constraint failed/);

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
        customItemId,
        "custom",
        "Local item",
        "local item",
        TIMESTAMP,
        TIMESTAMP,
      );

    expect(() =>
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
        .run(customItemId, "card", "73a", "73a", TIMESTAMP, TIMESTAMP),
    ).toThrowError(/FOREIGN KEY constraint failed/);
  });
});
