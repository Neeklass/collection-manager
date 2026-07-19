# Collection Manager Requirements

## Project summary

Collection Manager is a local-first web application for cataloging, searching,
and valuing a large Pokemon card and collectible collection. It should replace
the current Excel workflow with faster keyboard-oriented data entry, reliable
inventory records, powerful filtering, and valuations sourced primarily from
TCGdex.

The application is initially for one user and should run entirely on a local
machine. It should not introduce cloud infrastructure, distributed services, or
enterprise authentication during the MVP. The design should nevertheless keep
collection ownership and infrastructure concerns explicit so that multiple
users and an Azure deployment can be added later without redesigning the domain
model.

The repository is currently a prototype rather than an application. It contains
Python examples for the TCGdex SDK and raw TCGdex pricing API, a legacy
PostgreSQL schema, an incomplete Appsmith UI, and placeholder Azure Terraform.
None of these should constrain the new implementation.

### Findings from the current workbook

`data/2026-07-10_Pokemon.xlsx` is a checklist-style workbook, not a clean
database export:

- `Tabelle1` contains 16,987 rows and 11 columns with no header row, table,
  filters, formulas, or validation.
- Workbook-defined names identify columns for Pokedex number, name, card
  number, set size, set name, rarity, special variant, and language. Definitions
  for type, HP, and price are broken references.
- The likely column meanings are:

  | Column | Inferred meaning |
  | --- | --- |
  | A | Pokedex number |
  | B | Card or trainer name |
  | C | Card number within the set |
  | D | Set card count or promotional sequence |
  | E | Set name |
  | F | Broad rarity |
  | G | Edition, finish, stamp, or special variant |
  | H | Additional finish, usually `Holo` |
  | I | Non-default language |
  | J | Ownership, condition, copy count, or attention marker |
  | K | Free-text note |

- Column J is populated on 10,510 rows. It mixes
  conditions (`nm-`, `ex`, `gd`, `lp`, `played`, and `poor`), sealed status,
  warnings (`!`), defects, and multiple copies such as `nm- / x`.
- (`x`) represents `nm` or `mint`
- At least 472 rows encode multiple copies in one cell. This demonstrates that
  a spreadsheet row is not consistently one owned copy.
- Blank language values likely mean the default language, but this must be
  confirmed during import rather than silently assumed.
- Card numbers are not integers. Values include forms such as `GG60`, `73a`,
  and promotional identifiers.
- Set identifiers and set sizes are inconsistent types, and set names include
  spelling, spacing, and naming variants.
- The sheet contains only two exact duplicate row groups, so accidental exact
  duplication is limited. Semantic duplicates remain possible because names and
  variants are free text.
- `Oversized` contains 242 rows with similar card metadata but no ownership or
  condition column. It appears to be a separate owned-item category.
- Two hidden sheets are empty.
- There are no current prices or purchase prices in the workbook.

The workbook has 16,987 checklist rows, but that does not prove that all 16,987
are owned cards. The 10,510 marked rows, multi-copy notation, ambiguous `!`
values, and separate oversized sheet must be reconciled in an import preview.
The application must report both unique catalog matches and owned quantities
rather than treating spreadsheet row count as collection size.

## User workflows

### 1. Import the existing workbook

1. Select the Excel file.
2. Review detected sheets, inferred columns, default language, and ownership
   rules.
3. Confirm how blank cells, `x`, `!`, slash-separated values, `sealed`, and
   condition abbreviations should be interpreted.
4. Match rows to TCGdex cards using set, card number, name, and language.
5. Review exact matches, ambiguous matches, custom items, and invalid rows.
6. Correct mappings in bulk or preserve unresolved rows as local custom items.
7. Commit the import atomically and receive a reconciliation report.
8. Re-import the same file safely without duplicating existing inventory.

### 2. Add cards quickly

1. Open a keyboard-focused quick-add screen.
2. Select a set once; retain it for subsequent entries.
3. Find a card by local number or a few characters of its name.
4. Accept defaults for language, condition, variant, quantity, and acquisition
   date, or change them without leaving the keyboard.
5. Save and immediately continue with the next card.
6. See the recently added entries and undo or correct mistakes.

The workflow should support set-by-set entry, where the user enters many cards
from the same set, and ad hoc entry, where the set is unknown initially.

### 3. Add duplicates and variants

1. Select the card definition.
2. Select a known finish, edition, stamp, language, and condition.
3. Enter a quantity when copies are homogeneous.
4. Split copies into separate entries when condition, notes, acquisition data,
   grading, or defects differ.

### 4. Add sealed, oversized, and custom collectibles

1. Select a collectible type such as oversized card, booster pack, booster box,
   Elite Trainer Box, tin, collection box, or custom item.
2. Search for external metadata when available.
3. Enter a local name and optional details when no external record exists.
4. Record quantity, condition, sealed status, purchase data, estimated value,
   storage location, and notes.

### 5. Search and browse the collection

1. Search globally by card name, set name, card number, Pokedex number, or note.
2. Filter by ownership, collectible type, set, series, rarity, variant,
   language, condition, quantity, value range, and pricing status.
3. Sort by name, set order, acquisition date, quantity, or value.
4. Save common filter combinations.
5. Open an item to see catalog metadata, owned entries, valuation, and history.

### 6. Maintain inventory

1. Edit one entry or select many entries for a bulk update.
2. Change condition, language, storage location, notes, or variant.
3. Merge homogeneous entries or split a quantity into distinct entries.
4. Remove an entry with an undo period or explicit confirmation.
5. Identify potential duplicates and unresolved imported records.

### 7. Review value and statistics

1. Refresh market prices manually or use a configurable daily refresh.
2. View total estimated value with currency, source, coverage, and timestamp.
3. Break value and counts down by set, series, item type, language, condition,
   rarity, and variant.
4. Distinguish market-valued, manually valued, stale, and unpriced items.
5. Inspect historical collection value and large price changes after sufficient
   snapshots exist.

### 8. Back up and export

1. Create a portable backup containing local data and configuration.
2. Export filtered inventory to CSV or Excel.
3. Restore a backup into an empty local installation with validation and a
   preview.

## Functional requirements

### Catalog and external metadata

- Store card, set, series, rarity, image, Pokedex, and related metadata needed
  for local search and display.
- Preserve stable TCGdex identifiers and the source language of synchronized
  metadata.
- Support catalog records without a TCGdex match.
- Support multiple local variants of one catalog card, including finish,
  edition, stamp, promotional treatment, and other distinctions.
- Keep the original external payload or a versioned subset for troubleshooting
  and future remapping.
- Display synchronization status, source, and last successful refresh.
- Never overwrite local inventory fields or explicit manual overrides during a
  metadata refresh.

### Collection inventory

- Support standard cards, oversized cards, sealed products, and manually
  defined collectibles.
- Record a homogeneous quantity per collection entry.
- Record language, condition, variant, sealed state, notes, storage location,
  acquisition date, purchase unit price, purchase currency, and optional seller
  or source.
- Permit an entry without external metadata or a market price.
- Preserve defects and exceptional details as notes instead of embedding them
  in a condition code.
- Support merge, split, bulk edit, and deletion with confirmation or undo.
- Calculate total copies independently from unique catalog cards and unique
  variants.
- Include a collection boundary on every owned entry even while only one local
  collection exists.

### Excel import

- Read both populated workbook sheets and ignore empty hidden sheets by default.
- Provide explicit column mapping because the source has no headers.
- Allow the user to define the default language and meanings of blank status,
  `x`, `!`, `sealed`, and slash-separated status values.
- Treat card numbers and external identifiers as strings.
- Split multi-copy status cells into homogeneous inventory entries while
  preserving the original cell value.
- Normalize whitespace and known aliases without discarding the original value.
- Match cards using stable identifiers when available, otherwise use set, local
  number, name, language, and variant with confidence scoring.
- Require review for ambiguous or low-confidence matches.
- Allow unresolved rows to be imported as custom records or deferred.
- Validate the full import before committing it in a database transaction.
- Record an import batch, source-file fingerprint, row number, raw values,
  mapping result, errors, and created record identifiers.
- Make repeated import of the same workbook idempotent unless the user
  explicitly chooses to create duplicates.
- Produce counts for source rows, interpreted copies, matched cards, custom
  records, skipped rows, warnings, and errors.

### Fast data entry

- Provide full keyboard navigation and visible keyboard shortcuts.
- Support autocomplete by set, local number, and localized card name.
- Keep selected set, language, condition, and variant defaults between entries.
- Allow quantity entry and rapid repetition of the previous entry.
- Show card art and key metadata as a confirmation, not as a required step.
- Save an entry without a full page reload.
- Show recently added entries with immediate correction and undo.
- Prevent accidental duplicates while allowing intentional duplicate copies.

### Search and filtering

- Search locally without requiring TCGdex or internet access.
- Use normalized, case-insensitive search across localized names, set names,
  local card numbers, Pokedex numbers, and notes.
- Provide combinable filters for all common inventory and catalog attributes.
- Support owned, missing, and all-catalog views where catalog coverage permits.
- Support stable sorting and pagination or virtualized lists.
- Persist the current search state in the URL.
- Allow saved searches after the core filtering workflow is stable.

### Valuation

- Synchronize TCGdex/Cardmarket EUR and TCGplayer USD quote data when available.
- Keep provider, currency, market/variant, quote timestamp, and synchronization
  timestamp with every quote.
- Map a quote to a local card variant only when the mapping is explicit.
- Do not fabricate a price when the provider or variant is absent.
- Support a manual estimated unit value and currency for any entry.
- Clearly define precedence between market quotes and manual estimates; an
  explicit manual override should win until removed.
- Calculate totals using decimal-safe money values and never binary floating
  point.
- Show valuation coverage and stale-price counts next to totals.
- Store periodic price or collection-value snapshots for trend reporting.
- Do not silently convert currencies; require a configured exchange-rate source
  and timestamp if conversion is introduced later.

### Backup, export, and recovery

- Export the complete collection and filtered views in open formats.
- Create and validate local backups before destructive import or migration
  operations.
- Restore into a new installation without relying on external metadata.
- Include schema version and application version in backups.
- Surface actionable import, sync, backup, and restore failures.

### Out of scope for the MVP

- Azure deployment and Terraform.
- Multi-user login, permissions, sharing, and concurrent editing.
- Marketplace listing or automated buying and selling.
- Barcode and camera recognition.
- Native mobile applications.
- Automated grading from images.
- Microservices, message brokers, distributed caches, and external search
  services.

## Non-functional requirements

### Usability

- A practiced user should be able to add cards from one set using only the
  keyboard.
- Common entry values must default from the previous entry or user preferences.
- Every destructive bulk action must show its impact before confirmation.
- Import and synchronization errors must identify the affected rows or records.
- The UI should be responsive and usable on desktop and tablet, with future
  camera input in mind.
- Interactive controls should meet WCAG 2.2 AA keyboard, focus, label, and
  contrast expectations.

### Performance

- Local searches over at least 100,000 collection entries should normally
  return the first page within 200 ms on a typical development machine.
- Adding or editing an entry should normally complete within 500 ms locally.
- The supplied workbook should be parsed and validated without loading the
  entire collection into the browser.
- Long imports and synchronization runs must report progress and remain
  cancelable before commit where practical.
- Lists must use server-side pagination or virtualization rather than rendering
  the full collection.

### Reliability and data integrity

- Database changes must use migrations.
- Imports, quantity changes, and merge/split operations must be transactional.
- Foreign keys and check constraints must be enabled.
- External synchronization must be idempotent and safe to retry.
- External API failure must not prevent local browsing or editing.
- Original import values and explicit manual changes must be recoverable.
- Dates and timestamps must be stored in UTC and serialized as ISO 8601.
- Publicly exposed identifiers should be UUIDs.

### Security and privacy

- The MVP must run without cloud services and must not expose the application to
  the network by default.
- All file, form, URL, and TCGdex data must be validated at system boundaries.
- Database access must use parameterized queries.
- Imported spreadsheet content must be treated as untrusted data, including
  formula-like strings and hyperlinks.
- Exports must prevent spreadsheet formula injection.
- Secrets and credentials must come from environment variables and must never be
  committed or logged.
- Logs must not contain sensitive notes, credentials, or complete imported rows.
- Authentication and authorization may be omitted for localhost-only MVP use,
  but ownership must remain explicit in the domain model.

### Maintainability and testability

- Use strict typing and explicit input/output contracts.
- Keep domain rules independent of Next.js, SQLite, TCGdex, and file formats.
- Place persistence and external APIs behind repository or adapter interfaces.
- Cover import interpretation, matching, quantity handling, valuation, and sync
  precedence with deterministic unit tests.
- Test critical persistence behavior against the real local database.
- Keep external API tests deterministic with recorded or mocked responses.
- Avoid generic entity-attribute-value storage for core fields.

### Portability and operations

- Development and normal use must work locally with one documented command.
- The application must be container-friendly but should not require containers
  for ordinary local development.
- Configuration must use environment variables with safe local defaults.
- The database and uploaded files must reside in a documented local data
  directory.
- The architecture must permit replacing SQLite with PostgreSQL and local files
  with Azure storage adapters later.

## Recommended architecture

### Architectural style

Use a **modular monolith**, not separate frontend, API, worker, and sync
services. A 16,000- to 100,000-item single-user collection does not justify
distributed infrastructure.

Use one TypeScript application built with Next.js App Router:

- React Server Components for read-heavy pages.
- Small client components for quick entry, keyboard interactions, and dynamic
  filtering.
- Thin route handlers or server actions that call application use cases.
- Domain and application modules that do not import Next.js or database code.
- Infrastructure adapters for persistence, Excel parsing, TCGdex, image access,
  and future Azure services.

This is simpler than retaining a Python service solely because a TCGdex Python
prototype exists. TCGdex has a straightforward HTTP API, and using it directly
from the server keeps the MVP to one runtime and one deployment unit. Python
should only be introduced later if a genuinely Python-specific workload, such
as computer vision, requires it.

### Suggested module boundaries

```text
web
  quick entry, collection browser, import review, dashboard, settings
application
  add inventory, import workbook, match catalog, search, sync, value collection
domain
  catalog, variants, collection entries, money, conditions, valuation rules
infrastructure
  SQLite repositories, TCGdex client, Excel reader, backup/export, logging
```

The web layer must not contain matching, valuation, quantity, or synchronization
rules. Those rules belong in application and domain services.

### Persistence and search

Use SQLite for the local MVP with:

- migrations and foreign keys enabled;
- write-ahead logging for responsive reads during local writes;
- normal relational indexes for filters;
- SQLite FTS5 for name, set, number, and note search.

SQLite is the appropriate default for one local user and this data volume. A
local PostgreSQL container would add installation and operational friction
without improving the core workflow. Repository boundaries and portable SQL
types should be used to make a later PostgreSQL migration deliberate rather
than pretending it will be automatic.

Do not add Elasticsearch, Redis, or a job queue. Synchronization and imports can
run as explicit in-process jobs with persisted progress. If Azure deployment
later requires multiple application instances, those jobs can move behind a
database lease or dedicated worker.

### TCGdex synchronization boundary

TCGdex should be treated as an external catalog and market-data provider, not
the collection's source of truth.

Synchronize or cache:

- TCGdex card, set, and series identifiers;
- localized names and descriptions;
- set card counts and release dates;
- rarity, illustrator, Pokedex links, images, and other useful card metadata;
- provider pricing, available finish/market variants, currencies, and quote
  timestamps;
- raw source version or payload needed to diagnose changes.

Keep exclusively local:

- ownership and quantity;
- condition and grading;
- the language of a specific owned copy;
- purchase price, acquisition date, seller, and storage location;
- notes, defects, and user tags;
- custom items and custom variants;
- manual value and manual metadata overrides;
- import provenance and matching decisions.

Catalog synchronization should upsert by provider and external ID, record the
last successful sync, and retain local overrides. Price refresh should be
separate from metadata refresh because their frequency and failure modes differ.
Images should initially use provider URLs with an optional local cache rather
than downloading the entire image catalog.

### Initial synchronization strategy

Do not mirror every TCGdex language and image before the user can use the
application. Seed or synchronize the languages and sets required by the import,
then fetch additional catalog records on demand. Once initial matching is
complete, the application may maintain a compact local search index for the
configured languages.

Local entry, search, editing, and manual valuation must continue to work when
TCGdex is unavailable. Sync failures should leave the previous successful
metadata and prices intact.

## Database recommendations

### Modeling principles

- Separate catalog definitions from collection ownership.
- Model a collection entry as a homogeneous lot with `quantity >= 1`.
- Split entries when condition, variant, language, acquisition, grading, notes,
  or value differs.
- Use typed detail tables for cards and sealed products rather than one wide
  nullable table or an entity-attribute-value model.
- Store card and promotional numbers as text.
- Store money as integer minor units plus ISO 4217 currency, or use an exact
  decimal type where supported.
- Use UTC timestamps and UUIDs for externally visible identifiers.
- Preserve source values alongside normalized values during import.

### Proposed logical model

| Entity | Purpose and important fields |
| --- | --- |
| `collection` | Ownership boundary: ID, name, default language, default currency, timestamps. One row in the MVP. |
| `catalog_item` | Shared definition for card, oversized card, sealed product, or custom collectible: ID, kind, display name, source status, timestamps. |
| `card_details` | Card-specific data: catalog item ID, set ID, local card number as text, rarity, illustrator, image references, and optional TCGdex-derived fields. |
| `set` | Set ID, series ID, localized name, release date, printed and total card counts, source identifiers. |
| `series` | Series ID, localized name, source identifiers. |
| `pokemon` | Optional normalized Pokemon identity and Pokedex number. Cards may link to zero or multiple Pokemon. |
| `card_pokemon` | Many-to-many relationship between card definitions and Pokemon. |
| `card_variant` | A selectable printing treatment: card ID, finish, edition, stamp, promotional treatment, local label, and optional provider price key. |
| `product_details` | Sealed-product details: product category, set, contents or SKU when known. |
| `external_reference` | Provider, external entity type, external ID, language, source URL, last sync, source version, and optional raw payload. Unique by provider/type/ID/language. |
| `collection_entry` | Owned homogeneous lot: collection, catalog item, variant, quantity, language, condition, sealed state, location, notes, acquisition data, manual value, timestamps. |
| `condition_grade` | Controlled local condition codes and display order. It should include `unknown` and preserve imported source labels. |
| `price_quote` | Catalog item or variant, provider, market, currency, amount, quote time, fetched time, and source variant. |
| `valuation_snapshot` | Periodic collection or entry value with source, coverage, currency, and timestamp. |
| `import_batch` | File fingerprint, filename, mapping configuration, status, counts, timestamps, and application/schema version. |
| `import_row` | Batch, sheet, row number, raw values, normalized values, match status, matched IDs, warnings, and errors. |
| `saved_search` | Optional post-core feature containing a collection-scoped name and versioned filter definition. |

`catalog_item` should always exist, including for custom records. External
references are optional. This avoids nullable ownership targets and allows a
custom item to be linked to TCGdex later without replacing the collection
entry.

### Important constraints and indexes

- Unique external references by provider, entity type, external ID, and
  language.
- Unique cards by set and normalized local card number within a catalog source,
  with an escape hatch for documented source anomalies.
- Positive quantity and non-negative monetary values.
- Valid ISO language and currency codes where applicable.
- A manual value must include both amount and currency.
- An acquisition price must include both amount and currency.
- Index collection entries by collection, catalog item, variant, language,
  condition, and acquisition date.
- Index cards by set and local number, and sets by normalized name.
- FTS index localized card names, set names, local numbers, and user notes.
- Index quotes by catalog item or variant, provider, currency, and quote time.
- Unique import fingerprint and row identity sufficient to support idempotency.

### Import interpretation recommendation

The first import must not hard-code uncertain workbook semantics. Present these
as explicit decisions:

- whether blank J means not owned or owned with unknown condition;
- whether `!` means owned with attention required, wanted, missing, or another
  status;
- which language a blank I represents;
- whether `x` means owned with unknown condition or a specific condition;
- how `sealed` and notes such as "not available unpackaged" should map;
- how slash-separated values map to copy quantities and per-copy conditions;
- whether every row in `Oversized` is owned.

Save the chosen mapping with the import batch so the import is explainable and
repeatable.

## Weaknesses of the old schema

The legacy schema is not a suitable base for the new application.

1. **Catalog and inventory are conflated.** `card` contains condition and
   language, so the same printed card cannot be represented cleanly in several
   conditions, languages, or copies.
2. **There is no ownership model.** The schema has no collection, owner,
   quantity, copy or lot, acquisition, location, note, or deletion concept.
3. **Card numbers use the wrong type.** `card_number int` cannot store real
   values found in the workbook such as `GG60`, `73a`, or promotional numbers.
4. **Variants are not modeled.** Holo, reverse holo, first edition, stamps,
   promotional treatments, and other print variants are central to identity and
   price but have no structured representation.
5. **The generic metadata table is too weak.** It stores only an attribute name
   with no value, category, provenance, language, or uniqueness rules. It is not
   a substitute for typed fields or variants.
6. **The model only supports normal cards.** There are no sealed products,
   oversized cards, custom items, or extensible collectible types.
7. **External synchronization is absent.** There are no TCGdex IDs, provider
   references, payload versions, sync timestamps, or override rules.
8. **Valuation is absent.** There are no purchase prices, currencies, market
   quotes, quote timestamps, provider variants, manual estimates, or history.
9. **Set data is duplicated.** `expansion_max_number` exists on both `card` and
   `expansion`, allowing inconsistent values.
10. **Integrity constraints are incomplete.** Most descriptive columns are
    nullable, lookup names are not unique, quantities and values cannot be
    checked, and relationships have no stated delete behavior.
11. **Natural uniqueness is undefined.** Duplicate cards, sets, languages,
    rarities, and Pokemon names can be inserted freely.
12. **Localization is inadequate.** A single name per entity cannot represent
    German, English, Japanese, and other synchronized metadata.
13. **Audit and import provenance are absent.** There are no timestamps,
    import batches, source rows, matching decisions, or original values.
14. **Identifiers are implementation-oriented.** Sequential integers are
    acceptable internally but should not be the only externally visible IDs.
15. **The DDL is not migration-friendly.** It creates a database directly and
    adds identity behavior after table creation instead of defining a versioned
    schema migration.
16. **Search support is too narrow.** Basic indexes do not provide normalized
    full-text search across localized names, set numbers, and notes.
17. **Images are represented as one local path.** This cannot express provider
    URLs, image variants, cache state, or source provenance.

## MVP roadmap

### Phase 1: Domain foundation and local application shell

Deliver:

- Next.js modular-monolith skeleton with strict TypeScript.
- SQLite migrations, repositories, and local data-directory configuration.
- Core catalog, variant, collection, collection-entry, condition, and external
  reference models.
- One default local collection with no authentication.
- Seeded condition and language values.
- Backup mechanism before schema-changing or import operations.

Exit criteria:

- A custom item and an externally referenced card can both be persisted and
  retrieved.
- Multiple homogeneous lots can represent different copies of one card.
- The application starts locally without cloud services.

### Phase 2: Workbook import and reconciliation

Deliver:

- Excel parsing for `Tabelle1` and `Oversized`.
- Mapping screen for headerless columns and ambiguous status conventions.
- TCGdex-assisted card and set matching.
- Review queues for ambiguous, unmatched, duplicate, and invalid rows.
- Transactional, idempotent commit with import provenance and reconciliation
  totals.
- Import tests using the supplied workbook.

Exit criteria:

- Every source row is accounted for as imported, intentionally skipped,
  unresolved, or invalid.
- A repeated import does not duplicate inventory by default.
- Reported unique items and total quantities can be reconciled against the
  selected workbook interpretation.

This phase comes before elaborate dashboards. Losing or silently misclassifying
the current collection would be more damaging than postponing presentation
features.

### Phase 3: High-speed entry and inventory correction

Deliver:

- Keyboard-first quick-add with persistent set, language, condition, and variant
  defaults.
- Search by card number and name with immediate card-art confirmation.
- Quantity, duplicate, recent-entry, edit, and undo workflows.
- Custom, sealed, and oversized item entry.
- Merge, split, and basic bulk-edit operations.

Exit criteria:

- Repeated entry from one set requires minimal typing and no mouse.
- The user can correct imported records without editing the database.
- Intentional duplicate quantities are easy to add and distinguish.

### Phase 4: Search and collection management

Deliver:

- FTS-backed global search.
- Combinable inventory and catalog filters.
- Stable sorting, pagination, URL-persisted state, and item detail pages.
- Owned, missing, and all-catalog views where synchronized data permits.
- Count statistics by set, item type, language, condition, rarity, and variant.
- CSV or Excel export of complete and filtered inventory.

Exit criteria:

- Typical local searches meet the 200 ms target at 100,000 test entries.
- Every imported field that affects collection management is searchable,
  filterable, or visible on an item detail page.

### Phase 5: TCGdex synchronization and valuation

Deliver:

- Retry-safe metadata synchronization with local override protection.
- Separate price synchronization for Cardmarket and TCGplayer data.
- Explicit variant-to-price mapping.
- Manual estimated values for unpriced and custom items.
- Dashboard totals with source, currency, coverage, staleness, and unpriced
  counts.
- Initial valuation snapshots and price history.

Exit criteria:

- A TCGdex outage does not prevent local collection use.
- Every displayed total is traceable to a current quote or manual estimate.
- Missing prices are visible and never silently treated as zero-valued market
  data.

### Phase 6: Workflow polish and readiness for future inputs

Deliver:

- Saved searches and configurable defaults.
- Accessibility and responsive-layout pass.
- Restore workflow and complete local operations documentation.
- Performance profiling with the real import plus generated 100,000-entry data.
- Stable input-service boundary for future barcode or camera adapters.

Azure deployment, multi-user authentication, and scanning should begin only
after the local workflow demonstrably outperforms Excel. Adding them earlier
would increase complexity without reducing the primary user's collection-entry
effort.
