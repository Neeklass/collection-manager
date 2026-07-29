import type { SqliteMigration } from "@/infrastructure/database/migration";

export const catalogPersistenceMigration = {
  version: 2,
  name: "catalog-persistence",
  sql: `
    CREATE TABLE catalog_series (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (
          length(id) = 36
          AND substr(id, 9, 1) = '-'
          AND substr(id, 14, 1) = '-'
          AND substr(id, 19, 1) = '-'
          AND substr(id, 24, 1) = '-'
          AND length(replace(id, '-', '')) = 32
          AND replace(id, '-', '') NOT GLOB '*[^0-9a-f]*'
          AND id = lower(id)
          AND substr(id, 15, 1) GLOB '[1-8]'
          AND substr(id, 20, 1) GLOB '[89ab]'
        ),
      display_name TEXT NOT NULL
        CHECK (length(trim(display_name)) > 0),
      normalized_name TEXT NOT NULL
        CHECK (
          length(trim(normalized_name)) > 0
          AND normalized_name = lower(normalized_name)
        ),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        )
    ) STRICT;

    CREATE TABLE catalog_sets (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (
          length(id) = 36
          AND substr(id, 9, 1) = '-'
          AND substr(id, 14, 1) = '-'
          AND substr(id, 19, 1) = '-'
          AND substr(id, 24, 1) = '-'
          AND length(replace(id, '-', '')) = 32
          AND replace(id, '-', '') NOT GLOB '*[^0-9a-f]*'
          AND id = lower(id)
          AND substr(id, 15, 1) GLOB '[1-8]'
          AND substr(id, 20, 1) GLOB '[89ab]'
        ),
      series_id TEXT NOT NULL,
      display_name TEXT NOT NULL
        CHECK (length(trim(display_name)) > 0),
      normalized_name TEXT NOT NULL
        CHECK (
          length(trim(normalized_name)) > 0
          AND normalized_name = lower(normalized_name)
        ),
      set_code TEXT
        CHECK (set_code IS NULL OR length(trim(set_code)) > 0),
      release_date TEXT
        CHECK (
          release_date IS NULL
          OR (
            release_date GLOB '????-??-??'
            AND coalesce(strftime('%Y-%m-%d', release_date), '') = release_date
          )
        ),
      printed_card_count INTEGER
        CHECK (printed_card_count IS NULL OR printed_card_count >= 0),
      total_card_count INTEGER
        CHECK (total_card_count IS NULL OR total_card_count >= 0),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      FOREIGN KEY (series_id) REFERENCES catalog_series(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
      CHECK (
        printed_card_count IS NULL
        OR total_card_count IS NULL
        OR total_card_count >= printed_card_count
      )
    ) STRICT;

    CREATE TABLE catalog_items (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (
          length(id) = 36
          AND substr(id, 9, 1) = '-'
          AND substr(id, 14, 1) = '-'
          AND substr(id, 19, 1) = '-'
          AND substr(id, 24, 1) = '-'
          AND length(replace(id, '-', '')) = 32
          AND replace(id, '-', '') NOT GLOB '*[^0-9a-f]*'
          AND id = lower(id)
          AND substr(id, 15, 1) GLOB '[1-8]'
          AND substr(id, 20, 1) GLOB '[89ab]'
        ),
      item_kind TEXT NOT NULL
        CHECK (
          item_kind IN (
            'card',
            'oversized_card',
            'sealed_product',
            'custom'
          )
        ),
      display_name TEXT NOT NULL
        CHECK (length(trim(display_name)) > 0),
      normalized_name TEXT NOT NULL
        CHECK (
          length(trim(normalized_name)) > 0
          AND normalized_name = lower(normalized_name)
        ),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      UNIQUE (id, item_kind)
    ) STRICT;

    CREATE TABLE card_details (
      catalog_item_id TEXT PRIMARY KEY NOT NULL,
      item_kind TEXT NOT NULL
        CHECK (item_kind IN ('card', 'oversized_card')),
      set_id TEXT,
      local_card_number TEXT NOT NULL
        CHECK (length(trim(local_card_number)) > 0),
      normalized_local_card_number TEXT NOT NULL
        CHECK (
          length(trim(normalized_local_card_number)) > 0
          AND normalized_local_card_number = lower(normalized_local_card_number)
        ),
      catalog_number_disambiguator TEXT NOT NULL DEFAULT '',
      promotional_number TEXT
        CHECK (
          promotional_number IS NULL
          OR length(trim(promotional_number)) > 0
        ),
      rarity TEXT
        CHECK (rarity IS NULL OR length(trim(rarity)) > 0),
      illustrator TEXT
        CHECK (illustrator IS NULL OR length(trim(illustrator)) > 0),
      image_url TEXT
        CHECK (image_url IS NULL OR length(trim(image_url)) > 0),
      image_high_resolution_url TEXT
        CHECK (
          image_high_resolution_url IS NULL
          OR length(trim(image_high_resolution_url)) > 0
        ),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      FOREIGN KEY (catalog_item_id, item_kind)
        REFERENCES catalog_items(id, item_kind)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (set_id) REFERENCES catalog_sets(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
    ) STRICT;

    CREATE TABLE pokemon (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (
          length(id) = 36
          AND substr(id, 9, 1) = '-'
          AND substr(id, 14, 1) = '-'
          AND substr(id, 19, 1) = '-'
          AND substr(id, 24, 1) = '-'
          AND length(replace(id, '-', '')) = 32
          AND replace(id, '-', '') NOT GLOB '*[^0-9a-f]*'
          AND id = lower(id)
          AND substr(id, 15, 1) GLOB '[1-8]'
          AND substr(id, 20, 1) GLOB '[89ab]'
        ),
      display_name TEXT NOT NULL
        CHECK (length(trim(display_name)) > 0),
      normalized_name TEXT NOT NULL
        CHECK (
          length(trim(normalized_name)) > 0
          AND normalized_name = lower(normalized_name)
        ),
      pokedex_number INTEGER
        CHECK (pokedex_number IS NULL OR pokedex_number > 0),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      UNIQUE (normalized_name, pokedex_number)
    ) STRICT;

    CREATE TABLE card_pokemon_links (
      card_id TEXT NOT NULL,
      pokemon_id TEXT NOT NULL,
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      PRIMARY KEY (card_id, pokemon_id),
      FOREIGN KEY (card_id) REFERENCES card_details(catalog_item_id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
    ) STRICT;

    CREATE TABLE card_variants (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (
          length(id) = 36
          AND substr(id, 9, 1) = '-'
          AND substr(id, 14, 1) = '-'
          AND substr(id, 19, 1) = '-'
          AND substr(id, 24, 1) = '-'
          AND length(replace(id, '-', '')) = 32
          AND replace(id, '-', '') NOT GLOB '*[^0-9a-f]*'
          AND id = lower(id)
          AND substr(id, 15, 1) GLOB '[1-8]'
          AND substr(id, 20, 1) GLOB '[89ab]'
        ),
      card_id TEXT NOT NULL,
      variant_key TEXT NOT NULL
        CHECK (
          length(trim(variant_key)) > 0
          AND variant_key = lower(variant_key)
        ),
      local_label TEXT NOT NULL
        CHECK (length(trim(local_label)) > 0),
      finish TEXT
        CHECK (finish IS NULL OR length(trim(finish)) > 0),
      edition TEXT
        CHECK (edition IS NULL OR length(trim(edition)) > 0),
      stamp TEXT
        CHECK (stamp IS NULL OR length(trim(stamp)) > 0),
      promotional_treatment TEXT
        CHECK (
          promotional_treatment IS NULL
          OR length(trim(promotional_treatment)) > 0
        ),
      provider_price_key TEXT
        CHECK (
          provider_price_key IS NULL
          OR length(trim(provider_price_key)) > 0
        ),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      UNIQUE (card_id, variant_key),
      FOREIGN KEY (card_id) REFERENCES card_details(catalog_item_id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
    ) STRICT;

    CREATE TABLE product_details (
      catalog_item_id TEXT PRIMARY KEY NOT NULL,
      item_kind TEXT NOT NULL
        CHECK (item_kind = 'sealed_product'),
      product_category TEXT NOT NULL
        CHECK (
          product_category IN (
            'booster_pack',
            'booster_box',
            'elite_trainer_box',
            'tin',
            'collection_box',
            'promotional_product',
            'deck',
            'other'
          )
        ),
      set_id TEXT,
      stock_keeping_unit TEXT
        CHECK (
          stock_keeping_unit IS NULL
          OR length(trim(stock_keeping_unit)) > 0
        ),
      contents_description TEXT
        CHECK (
          contents_description IS NULL
          OR length(trim(contents_description)) > 0
        ),
      declared_item_count INTEGER
        CHECK (
          declared_item_count IS NULL
          OR declared_item_count >= 0
        ),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      FOREIGN KEY (catalog_item_id, item_kind)
        REFERENCES catalog_items(id, item_kind)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (set_id) REFERENCES catalog_sets(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
    ) STRICT;

    CREATE TABLE external_references (
      id TEXT PRIMARY KEY NOT NULL
        CHECK (
          length(id) = 36
          AND substr(id, 9, 1) = '-'
          AND substr(id, 14, 1) = '-'
          AND substr(id, 19, 1) = '-'
          AND substr(id, 24, 1) = '-'
          AND length(replace(id, '-', '')) = 32
          AND replace(id, '-', '') NOT GLOB '*[^0-9a-f]*'
          AND id = lower(id)
          AND substr(id, 15, 1) GLOB '[1-8]'
          AND substr(id, 20, 1) GLOB '[89ab]'
        ),
      provider TEXT NOT NULL
        CHECK (
          length(trim(provider)) > 0
          AND provider = lower(provider)
        ),
      entity_kind TEXT NOT NULL
        CHECK (
          entity_kind IN (
            'series',
            'set',
            'catalog_item',
            'card',
            'product',
            'pokemon',
            'card_variant'
          )
        ),
      external_id TEXT NOT NULL
        CHECK (length(trim(external_id)) > 0),
      language_code TEXT COLLATE NOCASE NOT NULL
        CHECK (
          length(language_code) BETWEEN 2 AND 35
          AND language_code NOT GLOB '*[^A-Za-z0-9-]*'
          AND language_code NOT GLOB '-*'
          AND language_code NOT GLOB '*-'
          AND language_code NOT GLOB '*--*'
        ),
      series_id TEXT,
      set_id TEXT,
      catalog_item_id TEXT,
      card_id TEXT,
      product_id TEXT,
      pokemon_id TEXT,
      card_variant_id TEXT,
      source_url TEXT
        CHECK (source_url IS NULL OR length(trim(source_url)) > 0),
      source_version TEXT
        CHECK (
          source_version IS NULL
          OR length(trim(source_version)) > 0
        ),
      raw_payload TEXT
        CHECK (raw_payload IS NULL OR json_valid(raw_payload)),
      synchronization_status TEXT NOT NULL DEFAULT 'never'
        CHECK (
          synchronization_status IN ('never', 'synchronized', 'failed')
        ),
      last_synchronized_at TEXT
        CHECK (
          last_synchronized_at IS NULL
          OR (
            last_synchronized_at GLOB '????-??-??T??:??:??.???Z'
            AND coalesce(
              strftime(
                '%Y-%m-%dT%H:%M:%fZ',
                last_synchronized_at
              ),
              ''
            ) = last_synchronized_at
          )
        ),
      created_at TEXT NOT NULL
        CHECK (
          created_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at),
            ''
          ) = created_at
        ),
      updated_at TEXT NOT NULL
        CHECK (
          updated_at GLOB '????-??-??T??:??:??.???Z'
          AND coalesce(
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at),
            ''
          ) = updated_at
          AND updated_at >= created_at
        ),
      UNIQUE (provider, entity_kind, external_id, language_code),
      FOREIGN KEY (series_id) REFERENCES catalog_series(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (set_id) REFERENCES catalog_sets(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (card_id) REFERENCES card_details(catalog_item_id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (product_id) REFERENCES product_details(catalog_item_id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (card_variant_id) REFERENCES card_variants(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      CHECK (
        (entity_kind = 'series'
          AND series_id IS NOT NULL
          AND set_id IS NULL
          AND catalog_item_id IS NULL
          AND card_id IS NULL
          AND product_id IS NULL
          AND pokemon_id IS NULL
          AND card_variant_id IS NULL)
        OR
        (entity_kind = 'set'
          AND series_id IS NULL
          AND set_id IS NOT NULL
          AND catalog_item_id IS NULL
          AND card_id IS NULL
          AND product_id IS NULL
          AND pokemon_id IS NULL
          AND card_variant_id IS NULL)
        OR
        (entity_kind = 'catalog_item'
          AND series_id IS NULL
          AND set_id IS NULL
          AND catalog_item_id IS NOT NULL
          AND card_id IS NULL
          AND product_id IS NULL
          AND pokemon_id IS NULL
          AND card_variant_id IS NULL)
        OR
        (entity_kind = 'card'
          AND series_id IS NULL
          AND set_id IS NULL
          AND catalog_item_id IS NULL
          AND card_id IS NOT NULL
          AND product_id IS NULL
          AND pokemon_id IS NULL
          AND card_variant_id IS NULL)
        OR
        (entity_kind = 'product'
          AND series_id IS NULL
          AND set_id IS NULL
          AND catalog_item_id IS NULL
          AND card_id IS NULL
          AND product_id IS NOT NULL
          AND pokemon_id IS NULL
          AND card_variant_id IS NULL)
        OR
        (entity_kind = 'pokemon'
          AND series_id IS NULL
          AND set_id IS NULL
          AND catalog_item_id IS NULL
          AND card_id IS NULL
          AND product_id IS NULL
          AND pokemon_id IS NOT NULL
          AND card_variant_id IS NULL)
        OR
        (entity_kind = 'card_variant'
          AND series_id IS NULL
          AND set_id IS NULL
          AND catalog_item_id IS NULL
          AND card_id IS NULL
          AND product_id IS NULL
          AND pokemon_id IS NULL
          AND card_variant_id IS NOT NULL)
      ),
      CHECK (
        synchronization_status <> 'synchronized'
        OR last_synchronized_at IS NOT NULL
      )
    ) STRICT;

    CREATE INDEX index_catalog_series_on_normalized_name
      ON catalog_series(normalized_name);
    CREATE INDEX index_catalog_sets_on_series_id
      ON catalog_sets(series_id);
    CREATE INDEX index_catalog_sets_on_normalized_name
      ON catalog_sets(normalized_name);
    CREATE INDEX index_catalog_sets_on_release_date
      ON catalog_sets(release_date);
    CREATE INDEX index_catalog_items_on_kind_and_normalized_name
      ON catalog_items(item_kind, normalized_name);
    CREATE UNIQUE INDEX index_card_details_on_set_number_and_disambiguator
      ON card_details(
        set_id,
        normalized_local_card_number,
        catalog_number_disambiguator
      )
      WHERE set_id IS NOT NULL;
    CREATE INDEX index_card_details_on_normalized_local_number
      ON card_details(normalized_local_card_number);
    CREATE INDEX index_card_details_on_promotional_number
      ON card_details(promotional_number)
      WHERE promotional_number IS NOT NULL;
    CREATE INDEX index_card_details_on_rarity
      ON card_details(rarity);
    CREATE INDEX index_pokemon_on_pokedex_number
      ON pokemon(pokedex_number);
    CREATE INDEX index_pokemon_on_normalized_name
      ON pokemon(normalized_name);
    CREATE INDEX index_card_pokemon_links_on_pokemon_id
      ON card_pokemon_links(pokemon_id);
    CREATE INDEX index_card_variants_on_card_id
      ON card_variants(card_id);
    CREATE INDEX index_card_variants_on_provider_price_key
      ON card_variants(provider_price_key)
      WHERE provider_price_key IS NOT NULL;
    CREATE INDEX index_product_details_on_set_and_category
      ON product_details(set_id, product_category);
    CREATE INDEX index_product_details_on_stock_keeping_unit
      ON product_details(stock_keeping_unit)
      WHERE stock_keeping_unit IS NOT NULL;
    CREATE INDEX index_external_references_on_series_id
      ON external_references(series_id)
      WHERE series_id IS NOT NULL;
    CREATE INDEX index_external_references_on_set_id
      ON external_references(set_id)
      WHERE set_id IS NOT NULL;
    CREATE INDEX index_external_references_on_catalog_item_id
      ON external_references(catalog_item_id)
      WHERE catalog_item_id IS NOT NULL;
    CREATE INDEX index_external_references_on_card_id
      ON external_references(card_id)
      WHERE card_id IS NOT NULL;
    CREATE INDEX index_external_references_on_product_id
      ON external_references(product_id)
      WHERE product_id IS NOT NULL;
    CREATE INDEX index_external_references_on_pokemon_id
      ON external_references(pokemon_id)
      WHERE pokemon_id IS NOT NULL;
    CREATE INDEX index_external_references_on_card_variant_id
      ON external_references(card_variant_id)
      WHERE card_variant_id IS NOT NULL;
  `,
} satisfies SqliteMigration;
