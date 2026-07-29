import type { SqliteMigration } from "@/infrastructure/database/migration";

// Keep the ISO 4217 snapshot static so this migration remains checksum-safe.
const ISO_4217_CURRENCY_CODES =
  "|AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHF|CLP|CNY|COP|CRC|CUC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HRK|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SLL|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|UYU|UZS|VES|VND|VUV|WST|XAF|XCD|XCG|XDR|XOF|XPF|XSU|YER|ZAR|ZMW|ZWG|ZWL|";

export const collectionPersistenceMigration = {
  version: 3,
  name: "collection-persistence",
  sql: `
    CREATE TABLE collections (
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
      name TEXT NOT NULL
        CHECK (length(trim(name)) > 0),
      default_language_code TEXT NOT NULL
        CHECK (
          length(default_language_code) BETWEEN 2 AND 35
          AND default_language_code NOT GLOB '*[^A-Za-z0-9-]*'
          AND default_language_code NOT GLOB '-*'
          AND default_language_code NOT GLOB '*-'
          AND default_language_code NOT GLOB '*--*'
          AND length(substr(
            default_language_code,
            1,
            instr(default_language_code || '-', '-') - 1
          )) BETWEEN 2 AND 8
          AND substr(
            default_language_code,
            1,
            instr(default_language_code || '-', '-') - 1
          ) NOT GLOB '*[^a-z]*'
          AND substr(
            default_language_code,
            1,
            instr(default_language_code || '-', '-') - 1
          ) = lower(substr(
            default_language_code,
            1,
            instr(default_language_code || '-', '-') - 1
          ))
          AND (
            instr(default_language_code, '-') = 0
            OR length(substr(
              default_language_code,
              instr(default_language_code, '-') + 1
            )) <> 2
            OR substr(
              default_language_code,
              instr(default_language_code, '-') + 1
            ) = upper(substr(
              default_language_code,
              instr(default_language_code, '-') + 1
            ))
          )
        ),
      default_currency_code TEXT NOT NULL
        CHECK (
          length(default_currency_code) = 3
          AND default_currency_code NOT GLOB '*[^A-Z]*'
          AND instr(
            '${ISO_4217_CURRENCY_CODES}',
            '|' || default_currency_code || '|'
          ) > 0
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

    CREATE TABLE condition_grades (
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
      code TEXT NOT NULL UNIQUE
        CHECK (
          length(trim(code)) > 0
          AND code = lower(code)
          AND code NOT GLOB '*[^a-z0-9_-]*'
        ),
      display_name TEXT NOT NULL
        CHECK (length(trim(display_name)) > 0),
      display_order INTEGER NOT NULL UNIQUE
        CHECK (display_order >= 0),
      description TEXT
        CHECK (
          description IS NULL
          OR length(trim(description)) > 0
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

    CREATE UNIQUE INDEX index_card_variants_on_id_and_card_id
      ON card_variants(id, card_id);

    CREATE TABLE collection_entries (
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
      collection_id TEXT NOT NULL,
      catalog_item_id TEXT NOT NULL,
      variant_id TEXT,
      quantity INTEGER NOT NULL
        CHECK (quantity > 0 AND quantity <= 9007199254740991),
      language_code TEXT NOT NULL
        CHECK (
          length(language_code) BETWEEN 2 AND 35
          AND language_code NOT GLOB '*[^A-Za-z0-9-]*'
          AND language_code NOT GLOB '-*'
          AND language_code NOT GLOB '*-'
          AND language_code NOT GLOB '*--*'
          AND length(substr(
            language_code,
            1,
            instr(language_code || '-', '-') - 1
          )) BETWEEN 2 AND 8
          AND substr(
            language_code,
            1,
            instr(language_code || '-', '-') - 1
          ) NOT GLOB '*[^a-z]*'
          AND substr(
            language_code,
            1,
            instr(language_code || '-', '-') - 1
          ) = lower(substr(
            language_code,
            1,
            instr(language_code || '-', '-') - 1
          ))
          AND (
            instr(language_code, '-') = 0
            OR length(substr(
              language_code,
              instr(language_code, '-') + 1
            )) <> 2
            OR substr(
              language_code,
              instr(language_code, '-') + 1
            ) = upper(substr(
              language_code,
              instr(language_code, '-') + 1
            ))
          )
        ),
      condition_grade_id TEXT NOT NULL,
      sealed_state TEXT NOT NULL
        CHECK (
          sealed_state IN (
            'sealed',
            'unsealed',
            'unknown',
            'not_applicable'
          )
        ),
      storage_location TEXT
        CHECK (
          storage_location IS NULL
          OR length(trim(storage_location)) > 0
        ),
      notes TEXT
        CHECK (notes IS NULL OR length(trim(notes)) > 0),
      acquisition_date TEXT
        CHECK (
          acquisition_date IS NULL
          OR (
            acquisition_date GLOB '????-??-??'
            AND coalesce(
              strftime('%Y-%m-%d', acquisition_date),
              ''
            ) = acquisition_date
          )
        ),
      acquisition_source TEXT
        CHECK (
          acquisition_source IS NULL
          OR length(trim(acquisition_source)) > 0
        ),
      purchase_unit_price_minor_units INTEGER
        CHECK (
          purchase_unit_price_minor_units IS NULL
          OR (
            purchase_unit_price_minor_units >= 0
            AND purchase_unit_price_minor_units <= 9007199254740991
          )
        ),
      purchase_currency_code TEXT
        CHECK (
          purchase_currency_code IS NULL
          OR (
            length(purchase_currency_code) = 3
            AND purchase_currency_code NOT GLOB '*[^A-Z]*'
            AND instr(
              '${ISO_4217_CURRENCY_CODES}',
              '|' || purchase_currency_code || '|'
            ) > 0
          )
        ),
      manual_value_minor_units INTEGER
        CHECK (
          manual_value_minor_units IS NULL
          OR (
            manual_value_minor_units >= 0
            AND manual_value_minor_units <= 9007199254740991
          )
        ),
      manual_value_currency_code TEXT
        CHECK (
          manual_value_currency_code IS NULL
          OR (
            length(manual_value_currency_code) = 3
            AND manual_value_currency_code NOT GLOB '*[^A-Z]*'
            AND instr(
              '${ISO_4217_CURRENCY_CODES}',
              '|' || manual_value_currency_code || '|'
            ) > 0
          )
        ),
      revision INTEGER NOT NULL DEFAULT 1
        CHECK (revision > 0 AND revision <= 9007199254740991),
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
      FOREIGN KEY (collection_id) REFERENCES collections(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
      FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
      FOREIGN KEY (variant_id, catalog_item_id)
        REFERENCES card_variants(id, card_id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
      FOREIGN KEY (condition_grade_id) REFERENCES condition_grades(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
      CHECK (
        (purchase_unit_price_minor_units IS NULL
          AND purchase_currency_code IS NULL)
        OR
        (purchase_unit_price_minor_units IS NOT NULL
          AND purchase_currency_code IS NOT NULL)
      ),
      CHECK (
        (manual_value_minor_units IS NULL
          AND manual_value_currency_code IS NULL)
        OR
        (manual_value_minor_units IS NOT NULL
          AND manual_value_currency_code IS NOT NULL)
      )
    ) STRICT;

    CREATE INDEX index_collection_entries_on_collection_id
      ON collection_entries(collection_id);
    CREATE INDEX index_collection_entries_on_catalog_item_id
      ON collection_entries(catalog_item_id);
    CREATE INDEX index_collection_entries_on_variant_id
      ON collection_entries(variant_id)
      WHERE variant_id IS NOT NULL;
    CREATE INDEX index_collection_entries_on_language_code
      ON collection_entries(language_code);
    CREATE INDEX index_collection_entries_on_condition_grade_id
      ON collection_entries(condition_grade_id);
    CREATE INDEX index_collection_entries_on_acquisition_date
      ON collection_entries(acquisition_date)
      WHERE acquisition_date IS NOT NULL;
  `,
} satisfies SqliteMigration;
