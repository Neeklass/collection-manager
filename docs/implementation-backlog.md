# Collection Manager Implementation Backlog

This backlog is derived from [`requirements.md`](requirements.md). Tasks are
ordered by implementation priority. Each task is intended to be completed,
reviewed, and merged in one pull request.

Complexity reflects implementation and review effort:

- **S**: small, focused change with limited surface area
- **M**: several related components or non-trivial tests
- **L**: broad workflow with multiple coordinated surfaces, still bounded to one
  pull request

## Priority 0: Project foundation

- [x] **F01 - Scaffold the Next.js application**

**Goal:** Establish the local TypeScript application and its basic App Router
structure.

**Acceptance criteria:**

- A supported Next.js version is configured with strict TypeScript.
- The application uses the App Router and starts with one documented local
  command.
- The default server binds to localhost rather than exposing itself to the
  network.
- Initial pages use Server Components unless client interactivity is required.
- No cloud service, Python service, container, or authentication provider is
  required to start the application.

**Dependencies:** None

**Estimated complexity:** S

- [x] **F02 - Establish automated quality checks**

**Goal:** Make formatting, linting, type checking, and tests consistent before
feature development begins.

**Acceptance criteria:**

- Prettier and ESLint use repository scripts without disabled baseline rules.
- Strict TypeScript checking runs independently of the production build.
- A TypeScript test runner is configured with one representative passing test.
- One aggregate command runs formatting checks, linting, type checking, and
  tests.
- CI runs the same checks for pull requests without requiring secrets.

**Dependencies:** F01

**Estimated complexity:** S

- [x] **F03 - Define modular-monolith boundaries**

**Goal:** Establish enforceable web, application, domain, and infrastructure
module boundaries.

**Acceptance criteria:**

- Source directories clearly separate web, application, domain, and
  infrastructure code.
- Domain modules do not import Next.js, SQLite, Excel, or TCGdex packages.
- Infrastructure implementations depend on application-owned ports or
  repository contracts.
- A minimal use case demonstrates dependency flow from web to application to a
  port without adding business functionality.
- Architecture and import-direction rules are documented.

**Dependencies:** F01, F02

**Estimated complexity:** S

- [x] **F04 - Add validated local configuration**

**Goal:** Centralize environment-based configuration with secure local defaults.

**Acceptance criteria:**

- Environment variables are parsed and validated once at application startup.
- Configuration includes the local data directory, database path, application
  URL, and log level.
- Defaults keep data in a documented local directory and bind the application
  to localhost.
- Invalid configuration fails fast with an actionable message that does not
  expose secrets.
- A safe example environment file and configuration tests are included.

**Dependencies:** F03

**Estimated complexity:** S

- [x] **F05 - Integrate SQLite and migration tooling**

**Goal:** Provide reliable local persistence through versioned migrations.

**Acceptance criteria:**

- SQLite is accessed through a maintained TypeScript-compatible data layer.
- Migrations run through an explicit repository command.
- Foreign keys and write-ahead logging are enabled and verified by integration
  tests.
- Database files are created beneath the configured local data directory.
- Queries use parameter binding rather than SQL string concatenation.
- A migration test creates a database from scratch and upgrades it to the latest
  schema.

**Dependencies:** F02, F04

**Estimated complexity:** M

- [x] **F06 - Implement shared domain value objects**

**Goal:** Define reusable rules for identifiers, quantities, money, language,
currency, and timestamps.

**Acceptance criteria:**

- Public identifiers use UUIDs.
- Quantity rejects values below one.
- Money uses integer minor units or another exact representation and always
  includes an ISO 4217 currency.
- Language values use validated codes while preserving source labels during
  import.
- Domain timestamps are UTC and serialize as ISO 8601.
- Unit tests cover valid values, invalid values, and serialization.

**Dependencies:** F03

**Estimated complexity:** M

- [x] **F07 - Create the catalog persistence model**

**Goal:** Persist catalog definitions independently from owned inventory.

**Acceptance criteria:**

- Migrations create series, sets, catalog items, card details, Pokemon,
  card-Pokemon links, card variants, product details, and external references.
- Card and promotional numbers are stored as text.
- Typed card and product detail tables are used instead of a generic
  entity-attribute-value table.
- External references are unique by provider, entity type, external ID, and
  language.
- Required constraints, indexes, delete behavior, and UTC timestamps are
  defined.
- Integration tests cover a custom item, an externally referenced card, and a
  card linked to multiple Pokemon.

**Dependencies:** F05, F06

**Estimated complexity:** M

- [x] **F08 - Create the collection persistence model**

**Goal:** Persist owned homogeneous lots without coupling ownership to catalog
metadata.

**Acceptance criteria:**

- Migrations create collections, condition grades, and collection entries.
- Every entry belongs to a collection and a catalog item.
- Entries support quantity, variant, language, condition, sealed state,
  location, notes, acquisition data, and optional manual value.
- Positive quantity and complete money/currency pair constraints are enforced.
- Different conditions, variants, languages, or acquisition details can be
  represented as separate lots for the same catalog item.
- Integration tests verify constraints and representative lot combinations.

**Dependencies:** F05, F06, F07

**Estimated complexity:** M

- [x] **F09 - Seed the default local collection**

**Goal:** Make a new installation immediately usable without authentication.

**Acceptance criteria:**

- Startup or an idempotent bootstrap command creates exactly one default local
  collection when none exists.
- Supported condition grades include an explicit unknown value and stable
  display order.
- Initial language and currency defaults come from validated configuration.
- Running bootstrap repeatedly does not duplicate data or overwrite user
  changes.
- Bootstrap behavior is covered by integration tests.

**Dependencies:** F08

**Estimated complexity:** S

- [ ] **F10 - Implement catalog and collection repositories**

**Goal:** Expose persistence through application-owned repository contracts.

**Acceptance criteria:**

- Repository ports support creating and retrieving catalog items, variants,
  collections, and collection entries.
- SQLite implementations map persistence records to domain types explicitly.
- A transaction abstraction supports atomic application use cases.
- Not-found, conflict, validation, and storage failures remain distinguishable.
- Integration tests prove that custom items, external cards, and multiple lots
  round-trip correctly.

**Dependencies:** F07, F08, F09

**Estimated complexity:** M

- [ ] **F11 - Create pre-operation database backups**

**Goal:** Protect local data before migrations, imports, and future destructive
operations.

**Acceptance criteria:**

- A service creates a consistent timestamped database backup in the configured
  data directory.
- Backup metadata includes schema and application versions.
- The service validates that the backup can be opened before reporting success.
- Failed backups prevent the guarded destructive operation from starting.
- Retention is explicit and does not silently delete the only valid backup.
- Integration tests cover successful and failed backup creation.

**Dependencies:** F05

**Estimated complexity:** M

## Priority 1: TCGdex catalog and workbook migration

- [ ] **C01 - Implement the TCGdex HTTP client**

**Goal:** Access TCGdex through a typed, testable infrastructure adapter.

**Acceptance criteria:**

- Explicit response schemas validate card, set, series, image, and pricing data
  received from TCGdex.
- The client supports configured language and request timeouts.
- Missing optional fields are represented explicitly and never fabricated.
- HTTP, timeout, schema, and rate-limit failures produce distinct errors.
- Logs exclude full payloads and user data.
- Tests use mocked or recorded responses and require no network access.

**Dependencies:** F03, F04, F06

**Estimated complexity:** M

- [ ] **C02 - Synchronize series and sets**

**Goal:** Build the local set index required for import matching and quick entry.

**Acceptance criteria:**

- An application use case fetches and upserts configured-language series and
  sets by stable TCGdex identifiers.
- Local records include localized names, release dates, and printed and total
  card counts when available.
- External references record provider, language, source identifier, and last
  successful synchronization.
- Repeated synchronization is idempotent.
- A failed refresh preserves the last successful local data.
- Tests cover initial sync, update, missing optional fields, retry, and failure.

**Dependencies:** C01, F07, F10

**Estimated complexity:** M

- [ ] **C03 - Synchronize cards and variants on demand**

**Goal:** Cache only the card metadata needed by configured sets and workflows.

**Acceptance criteria:**

- A use case synchronizes cards for selected sets or fetches one card on demand.
- Card metadata, localized names, card number, rarity, illustrator, Pokedex
  links, image references, and source payload/version are stored when available.
- Provider variants are mapped to local variants without overwriting manually
  created variants.
- Repeated synchronization is idempotent and preserves all collection entries.
- TCGdex failure leaves existing local metadata usable.
- Tests cover new, updated, removed, incomplete, and locally overridden data.

**Dependencies:** C02

**Estimated complexity:** L

- [ ] **I01 - Add import provenance tables and repositories**

**Goal:** Persist explainable, resumable workbook analysis before importing
inventory.

**Acceptance criteria:**

- Migrations create import batches and import rows.
- A batch stores file fingerprint, filename, mapping configuration, status,
  counts, timestamps, and schema/application version.
- A row stores sheet, row number, original values, normalized values, match
  status, matched IDs, warnings, and errors.
- File fingerprint and row identity constraints support idempotency.
- Repository tests cover lifecycle transitions and prohibit invalid transitions.

**Dependencies:** F05, F06, F10

**Estimated complexity:** M

- [ ] **I02 - Parse and validate Excel workbooks**

**Goal:** Read the supplied workbook safely without loading it into the browser.

**Acceptance criteria:**

- The parser streams or incrementally reads workbook rows on the server.
- `Tabelle1` and `Oversized` are detected; empty hidden sheets are ignored by
  default.
- Column values and row numbers are preserved without treating row 1 as a
  header.
- Card numbers remain strings, including values such as `GG60` and `73a`.
- Formula-like content, hyperlinks, malformed files, oversized files, and
  unsupported workbook features are handled as untrusted input.
- Tests include representative fixtures and the supplied workbook's detected
  sheet and row counts.

**Dependencies:** F02, I01

**Estimated complexity:** M

- [ ] **I03 - Implement workbook interpretation rules**

**Goal:** Convert source rows into explicit candidate inventory records without
losing original values.

**Acceptance criteria:**

- Column mappings are configurable and versioned with the import batch.
- Blank language, blank status, `!`, `sealed`, and slash-separated values require
  explicit mapping decisions.
- `x` defaults to the requirement-defined near-mint or mint interpretation but
  remains visible in the saved source mapping.
- Slash-separated values create separate homogeneous candidate lots or a
  quantity when all interpreted properties are identical.
- Whitespace and known aliases are normalized while original values remain
  available.
- Defects and exceptional text remain notes rather than becoming condition
  codes.
- Unit tests cover all known source tokens and ambiguous cases.

**Dependencies:** I02, F06

**Estimated complexity:** M

- [ ] **I04 - Implement catalog matching and confidence scoring**

**Goal:** Match interpreted workbook rows to local TCGdex catalog records
without unsafe guesses.

**Acceptance criteria:**

- Matching prioritizes stable external IDs when present, then set, local card
  number, localized name, language, and variant.
- Exact, ambiguous, low-confidence, unmatched, and invalid outcomes are
  distinct.
- Normalized aliases improve matching without discarding source values.
- Ambiguous or low-confidence results are never committed automatically.
- Candidate results include explainable score components or reasons.
- Deterministic tests cover spelling variants, promotional numbers, trainers,
  missing Pokedex values, and duplicate candidates.

**Dependencies:** C03, I03

**Estimated complexity:** L

- [ ] **I05 - Orchestrate import analysis and progress**

**Goal:** Run parsing, interpretation, and matching as a persisted, observable
application workflow.

**Acceptance criteria:**

- A use case creates a batch, analyzes rows, persists outcomes, and records
  reconciliation counts.
- Progress reports sheets and rows processed without exposing complete row
  content in logs.
- A user can cancel analysis before any inventory is committed.
- Processing failures identify the affected sheet and row and leave the batch in
  a recoverable terminal state.
- Re-running analysis with the same file and mapping reuses or replaces the
  prior analysis explicitly rather than duplicating it.
- Integration tests cover success, cancellation, row failure, and retry.

**Dependencies:** I01, I02, I03, I04, F11

**Estimated complexity:** M

- [ ] **I06 - Build the import upload and mapping screen**

**Goal:** Let the user review workbook structure and define uncertain source
semantics before matching.

**Acceptance criteria:**

- The screen accepts Excel files and displays validated sheet and row summaries.
- The inferred A-K mapping is editable.
- The user explicitly chooses default language and interpretations for blank
  status, `x`, `!`, `sealed`, slash-separated values, and the `Oversized` sheet.
- The selected mapping is summarized before analysis begins.
- Invalid files and mappings show actionable messages without exposing internal
  details.
- The workflow is keyboard accessible and does not upload data to a cloud
  service.

**Dependencies:** I05, F01

**Estimated complexity:** L

- [ ] **I07 - Build the import reconciliation screen**

**Goal:** Resolve ambiguous, unmatched, duplicate, and invalid rows before
commit.

**Acceptance criteria:**

- The screen groups exact, ambiguous, low-confidence, unmatched, skipped, and
  invalid outcomes.
- Users can accept a candidate, choose another candidate, create a custom item,
  defer a row, or intentionally skip it.
- Bulk actions are available for repeated set aliases and interpretation rules.
- Every source row remains accounted for.
- Reconciliation totals distinguish source rows, interpreted copies, unique
  items, warnings, and errors.
- Keyboard navigation and pagination or virtualization support the real workbook
  size.

**Dependencies:** I06

**Estimated complexity:** L

- [ ] **I08 - Commit imports transactionally and idempotently**

**Goal:** Convert reviewed candidates into catalog and collection records
without partial or duplicate imports.

**Acceptance criteria:**

- Commit is blocked while unresolved required decisions or validation errors
  remain.
- A validated pre-import backup is created before the transaction starts.
- Catalog, custom item, variant, and collection-entry changes commit in one
  database transaction.
- Created records are linked back to their import rows.
- Repeating the same batch does not duplicate inventory unless the user
  explicitly selects duplicate creation.
- Failure rolls back inventory changes and records a clear batch failure.
- Integration tests cover success, duplicate prevention, rollback, and retry.

**Dependencies:** I07, F11

**Estimated complexity:** L

- [ ] **I09 - Reconcile the supplied workbook end to end**

**Goal:** Prove that the real collection can be migrated explainably.

**Acceptance criteria:**

- An automated integration scenario processes the supplied workbook using a
  documented mapping fixture.
- The scenario verifies 16,987 `Tabelle1` rows, 242 `Oversized` rows, and the two
  ignored empty hidden sheets.
- Every source row ends in an imported, skipped, deferred, or invalid state.
- Multi-copy rows reconcile source rows to interpreted quantities.
- A second run demonstrates default idempotency.
- Test output reports counts without committing a generated database or
  sensitive row content.

**Dependencies:** I08

**Estimated complexity:** M

## Priority 2: Fast entry and inventory maintenance

- [ ] **E01 - Implement local catalog lookup**

**Goal:** Provide fast set, card-number, and card-name suggestions without
requiring TCGdex availability.

**Acceptance criteria:**

- An application query searches locally by set, exact or partial local number,
  and normalized localized name.
- Results include card art reference, set, number, rarity, and available
  variants.
- Results are deterministic, ranked, and limited.
- The query remains functional with network access disabled.
- Performance tests use a realistic catalog size and define a regression limit.

**Dependencies:** C03, F10

**Estimated complexity:** M

- [ ] **E02 - Implement the add-entry use case**

**Goal:** Add homogeneous collection lots through validated domain logic.

**Acceptance criteria:**

- The use case accepts catalog item, variant, quantity, language, condition,
  sealed state, location, notes, acquisition data, and optional manual value.
- Validation rejects incomplete money values, invalid quantity, and incompatible
  variant or item references.
- Duplicate candidates produce a warning while intentional duplicates remain
  possible.
- The write is transactional and returns the created entry.
- Tests cover standard cards, duplicates, custom items, and invalid input.

**Dependencies:** F10

**Estimated complexity:** M

- [ ] **E03 - Build the keyboard-first quick-add screen**

**Goal:** Make repeated card entry faster than spreadsheet editing.

**Acceptance criteria:**

- A user can select a set, find a card, choose a variant, and save without using
  a mouse.
- Set, language, condition, and variant defaults persist for subsequent entries.
- Quantity and acquisition date are editable without expanding a separate form.
- Card art and key metadata confirm the selection but are not required to save.
- Successful save resets only fields needed for the next entry and does not
  reload the page.
- Visible shortcuts, focus order, and error focus meet keyboard accessibility
  requirements.

**Dependencies:** E01, E02

**Estimated complexity:** L

- [ ] **E04 - Add recent-entry correction and undo**

**Goal:** Let users recover immediately from rapid-entry mistakes.

**Acceptance criteria:**

- Quick add displays a bounded list of recent entries from the current session.
- A recent entry can be reopened for correction.
- Undo removes or reverses the exact created entry after confirmation where
  needed.
- Undo cannot affect an entry changed by another operation without warning.
- Tests cover add, edit, undo, repeated undo, and stale-entry conflicts.

**Dependencies:** E03

**Estimated complexity:** M

- [ ] **E05 - Add custom, oversized, and sealed product entry**

**Goal:** Catalog collectibles that are not normal TCGdex card records.

**Acceptance criteria:**

- Users can create custom items, oversized cards, and supported sealed product
  categories.
- External metadata is optional.
- Forms support quantity, condition, sealed state, purchase data, manual value,
  location, and notes.
- Product-specific details are stored in typed product fields.
- A custom item can later receive an external reference without replacing its
  collection entry.
- Tests cover each item category and a record without a market price.

**Dependencies:** E02

**Estimated complexity:** M

- [ ] **E06 - Implement single-entry editing and removal**

**Goal:** Maintain an inventory entry without direct database changes.

**Acceptance criteria:**

- Users can edit all local inventory fields without modifying synchronized
  catalog metadata.
- Validation rules match creation rules.
- Removal requires confirmation or offers a reliable undo path.
- Conflicting or stale updates are detected rather than silently overwritten.
- Tests cover edit, remove, invalid input, not found, and conflict behavior.

**Dependencies:** E02

**Estimated complexity:** M

- [ ] **E07 - Implement lot merge and split**

**Goal:** Correct quantities while preserving differences between copies.

**Acceptance criteria:**

- Homogeneous entries can be merged only when all identity-defining local fields
  are compatible.
- A quantity can be split into separate entries with distinct condition, notes,
  acquisition data, grading, or value.
- Merge and split operations are transactional.
- Resulting quantities remain positive and preserve the original total.
- Tests cover compatible merge, rejected merge, full split, partial split, and
  rollback.

**Dependencies:** E06

**Estimated complexity:** M

- [ ] **E08 - Implement safe bulk editing**

**Goal:** Apply common inventory corrections to many selected entries.

**Acceptance criteria:**

- Users can preview and apply supported changes such as condition, language,
  location, and tags or notes policy.
- The preview reports affected entry and copy counts.
- Destructive or lossy changes require explicit confirmation.
- The operation is transactional and reports per-selection validation conflicts
  before writing.
- Tests cover mixed item types, no-op changes, validation failure, and rollback.

**Dependencies:** E06

**Estimated complexity:** M

## Priority 3: Search, browsing, statistics, and recovery

- [ ] **S01 - Add normalized FTS5 search indexing**

**Goal:** Index local catalog and inventory text for fast offline search.

**Acceptance criteria:**

- Migrations create and maintain FTS5 indexes for localized names, set names,
  card numbers, Pokedex numbers, and user notes.
- Normalization is case-insensitive and handles expected punctuation and
  spacing.
- Inserts, updates, deletes, imports, and synchronization keep the index
  consistent.
- A rebuild command can restore the index from relational data.
- Integration tests cover indexing and rebuild behavior.

**Dependencies:** F07, F08

**Estimated complexity:** M

- [ ] **S02 - Implement collection search, filters, and sorting**

**Goal:** Provide one composable query contract for collection browsing.

**Acceptance criteria:**

- Queries combine text search with item type, set, series, rarity, variant,
  language, condition, quantity, acquisition date, value status, and ownership
  filters.
- Sorting is stable and supports name, set order, acquisition date, quantity,
  and value where available.
- Pagination is cursor-based or otherwise stable under normal local edits.
- Input schemas validate all filter, sort, and pagination values.
- Query tests cover combinations, empty results, invalid input, and stable page
  boundaries.

**Dependencies:** S01, F10

**Estimated complexity:** L

- [ ] **S03 - Build the collection browser**

**Goal:** Make large filtered result sets easy to navigate and maintain.

**Acceptance criteria:**

- Search, filters, sorting, and pagination use the S02 query contract.
- Search state is encoded in the URL and survives reload and navigation.
- Result rows show item identity, variant, owned quantity, condition, language,
  and available value summary.
- Large result sets use server-side pagination or virtualization.
- Empty, loading, invalid-filter, and storage-error states are explicit.
- Desktop and tablet keyboard navigation is supported.

**Dependencies:** S02

**Estimated complexity:** L

- [ ] **S04 - Build catalog item and inventory detail pages**

**Goal:** Show synchronized metadata and local ownership without conflating
them.

**Acceptance criteria:**

- A detail page separates catalog metadata, variants, external source status,
  owned lots, acquisition data, notes, and valuation.
- All lots for the selected catalog item are visible.
- Edit, split, merge, and remove actions link to existing inventory workflows.
- Missing external metadata, missing images, and unpriced items have explicit
  states.
- Server-rendered content remains usable without client-side JavaScript where
  interaction is not required.

**Dependencies:** S03, E06, E07

**Estimated complexity:** M

- [ ] **S05 - Add owned, missing, and all-catalog views**

**Goal:** Support checklist workflows without confusing catalog rows with
inventory.

**Acceptance criteria:**

- Users can switch between owned entries, missing synchronized cards, and the
  complete local catalog.
- Owned counts distinguish unique catalog items, unique variants, lots, and
  total copies.
- Missing status is calculated against explicit set and variant scope.
- Incomplete local catalog coverage is disclosed instead of presenting an
  inaccurate completion percentage.
- Tests cover duplicate copies, variants, custom items, and partial set sync.

**Dependencies:** S02, C03

**Estimated complexity:** M

- [ ] **S06 - Add collection count statistics**

**Goal:** Summarize inventory composition before market valuation is available.

**Acceptance criteria:**

- Statistics include total copies, lots, unique catalog items, and unique
  variants.
- Breakdowns are available by set, series, item type, language, condition,
  rarity, and variant.
- Counts respect active collection filters where appropriate.
- Custom and unresolved records are visible rather than dropped.
- Query tests reconcile totals and breakdowns against deterministic fixtures.

**Dependencies:** S02

**Estimated complexity:** M

- [ ] **X01 - Export collection data safely**

**Goal:** Export complete or filtered inventory in open formats.

**Acceptance criteria:**

- Complete and current-filter exports are available as CSV.
- Exported fields distinguish catalog metadata, local inventory, quantity, and
  value source.
- Values that could trigger spreadsheet formulas are neutralized.
- UTF-8, delimiters, dates, quantities, and exact money values round-trip in
  tests.
- Export streams large results rather than loading the full collection into the
  browser.

**Dependencies:** S02

**Estimated complexity:** M

- [ ] **B01 - Implement validated backup restore**

**Goal:** Restore a portable local backup without requiring TCGdex.

**Acceptance criteria:**

- Restore validates file integrity, schema version, and application
  compatibility before replacing data.
- A preview reports collection, catalog, import, and valuation record counts.
- The current database is backed up before restore.
- Replacement is atomic and failure leaves the current database usable.
- Restored catalog metadata and local inventory work without network access.
- Integration tests cover valid restore, corrupt backup, incompatible version,
  and rollback.

**Dependencies:** F11, I08

**Estimated complexity:** M

## Priority 4: Pricing and valuation

- [ ] **V01 - Add price quote and valuation snapshot persistence**

**Goal:** Store traceable market quotes and historical collection values.

**Acceptance criteria:**

- Migrations create price quote and valuation snapshot tables.
- Quotes include catalog item or variant, provider, market, source variant,
  exact amount, currency, quote time, and fetch time.
- Snapshots include scope, currency, value, coverage, source policy, and UTC
  timestamp.
- Constraints reject incomplete or negative money values.
- Indexes support latest-quote and historical queries.
- Integration tests cover multiple providers, currencies, variants, and times.

**Dependencies:** F06, F07, F08

**Estimated complexity:** M

- [ ] **V02 - Synchronize TCGdex market prices**

**Goal:** Refresh Cardmarket and TCGplayer quotes independently from catalog
metadata.

**Acceptance criteria:**

- A price-sync use case reads available TCGdex pricing fields without assuming
  every provider or finish exists.
- Cardmarket EUR and TCGplayer USD values retain provider field and variant
  identity.
- Repeated synchronization is idempotent and safe to retry.
- Failed refresh preserves prior quotes and records actionable sync status.
- Metadata synchronization and price synchronization can run independently.
- Tests cover partial providers, absent variants, stale data, and API failure.

**Dependencies:** C01, V01

**Estimated complexity:** M

- [ ] **V03 - Map local variants to provider prices**

**Goal:** Prevent incorrect valuation caused by implicit finish assumptions.

**Acceptance criteria:**

- A local card variant can reference an explicit provider price variant.
- Unmapped, ambiguous, and unavailable mappings are distinguishable.
- Automatic suggestions require user confirmation when more than one mapping is
  plausible.
- Synchronization never replaces an explicit local mapping silently.
- Tests cover normal, reverse, holo, first-edition/custom, and unmapped variants.

**Dependencies:** V02, C03

**Estimated complexity:** M

- [ ] **V04 - Implement the valuation engine and manual overrides**

**Goal:** Calculate explainable entry and collection values without fabricated
prices.

**Acceptance criteria:**

- An entry value uses its explicit manual estimate when present; otherwise it
  uses an eligible mapped market quote.
- Quantity is applied using exact money arithmetic.
- Missing, stale, ambiguous, and currency-incompatible values remain visible and
  are not silently treated as market-price zero.
- Totals report valued and unpriced copy counts, coverage, source, currency, and
  quote age.
- No automatic currency conversion occurs.
- Unit tests cover precedence, quantity, rounding, staleness, missing data, and
  mixed currencies.

**Dependencies:** V03, E02

**Estimated complexity:** L

- [ ] **V05 - Build the valuation dashboard**

**Goal:** Present collection value with enough context to judge its reliability.

**Acceptance criteria:**

- The dashboard shows total estimated value by currency.
- Coverage, stale quotes, manual overrides, unpriced items, and last refresh are
  visible next to totals.
- Breakdowns are available by set, series, item type, language, condition,
  rarity, and variant.
- Users can navigate from an aggregate to the underlying filtered entries.
- Mixed currencies are displayed separately unless a future configured exchange
  rate exists.
- Loading, offline, empty, and price-sync failure states are explicit.

**Dependencies:** V04, S06

**Estimated complexity:** L

- [ ] **V06 - Capture and display valuation history**

**Goal:** Track value trends without recalculating historical data from current
quotes.

**Acceptance criteria:**

- A manual or configurable daily action records a collection valuation snapshot.
- Duplicate snapshots for the same configured period are prevented or
  explicitly replaced.
- History displays value, currency, coverage, and source policy over time.
- Large changes can be traced to underlying quote or inventory changes where
  data exists.
- Missing days and mixed currencies are represented honestly.
- Tests cover snapshot creation, idempotency, and historical queries.

**Dependencies:** V04, V05

**Estimated complexity:** M

## Priority 5: Workflow polish and future readiness

- [ ] **P01 - Add collection preferences and saved searches**

**Goal:** Persist frequently used defaults and filter combinations.

**Acceptance criteria:**

- Collection preferences include default language, currency, condition, and
  quick-entry behavior.
- Saved searches store a collection-scoped name and versioned filter contract.
- Invalid or outdated saved filters fail visibly and can be edited or removed.
- Preferences change defaults without changing existing inventory.
- Tests cover create, update, duplicate names, contract versioning, and delete.

**Dependencies:** E03, S03

**Estimated complexity:** M

- [ ] **P02 - Complete accessibility and responsive workflow review**

**Goal:** Ensure primary workflows meet WCAG 2.2 AA expectations on desktop and
tablet.

**Acceptance criteria:**

- Quick add, import review, collection browsing, item editing, and valuation are
  fully operable by keyboard.
- Focus order, focus restoration, labels, error association, and contrast pass
  documented checks.
- Long tables and dialogs remain usable at supported desktop and tablet widths.
- Automated accessibility checks cover representative pages.
- Manual test notes document the remaining limitations, if any.

**Dependencies:** I07, E03, S03, V05

**Estimated complexity:** M

- [ ] **P03 - Verify performance at target scale**

**Goal:** Demonstrate that local use remains responsive beyond the current
collection size.

**Acceptance criteria:**

- A deterministic generator creates at least 100,000 collection entries for
  testing.
- Representative search requests normally return the first page within the
  200 ms requirement on a documented development machine.
- Representative local add and edit operations normally complete within the
  500 ms requirement.
- The real workbook import is profiled without loading the full dataset into the
  browser.
- Identified bottlenecks are fixed or documented with a separately approved
  follow-up task.

**Dependencies:** I09, E06, S03, V04

**Estimated complexity:** M

- [ ] **P04 - Document local operation and recovery**

**Goal:** Make installation, use, backup, and recovery understandable without
tribal knowledge.

**Acceptance criteria:**

- Documentation covers prerequisites, environment variables, startup,
  migrations, data location, import, TCGdex sync, backup, restore, and upgrades.
- One documented command starts normal local development.
- Troubleshooting covers database locks, failed migrations, failed sync,
  corrupt imports, and restore rollback.
- Documentation states that the application binds locally and identifies any
  step that can make it network-accessible.
- Commands are verified from a clean local setup.

**Dependencies:** B01, V02

**Estimated complexity:** S

- [ ] **P05 - Define the future input-adapter contract**

**Goal:** Prepare barcode and camera workflows without implementing scanning in
the MVP.

**Acceptance criteria:**

- An application-owned contract accepts normalized identification candidates
  from manual, barcode, or camera sources.
- The existing quick-add workflow uses the same candidate resolution path.
- The contract includes confidence, source, candidate identifiers, and
  validation errors without depending on camera or barcode libraries.
- No scanner UI, computer-vision service, or new runtime is introduced.
- Contract tests show that a future adapter can submit candidates without
  bypassing catalog matching or entry validation.

**Dependencies:** E01, E02, E03

**Estimated complexity:** S

## Deferred until after the MVP

The following work is intentionally not part of this backlog:

- Azure deployment and Terraform implementation
- Multi-user authentication, authorization, sharing, and concurrent editing
- Barcode and camera recognition implementations
- Native mobile applications
- Marketplace listing, buying, or selling
- Automated grading
- Microservices, message brokers, distributed caches, and external search
  services

These should be reconsidered only after the local workflow has been measured
against the current Excel process.
