# Collection Manager

Local-first Pokemon collection management.

## Development

```sh
npm install
npm run dev
```

The development server is bound to `127.0.0.1` and is available at
<http://127.0.0.1:3000>.

## Local configuration

Configuration is read from environment variables. Safe localhost defaults keep
application data in `.data/` and use the SQLite database
`.data/collection-manager.sqlite`. Copy `.env.example` to `.env.local` to
customize the data directory, database path, application URL, log level,
default language, or default currency.

| Variable                              | Safe local default                |
| ------------------------------------- | --------------------------------- |
| `COLLECTION_MANAGER_DATA_DIRECTORY`   | `.data`                           |
| `COLLECTION_MANAGER_DATABASE_PATH`    | `.data/collection-manager.sqlite` |
| `COLLECTION_MANAGER_APP_URL`          | `http://127.0.0.1:3000`           |
| `COLLECTION_MANAGER_LOG_LEVEL`        | `info`                            |
| `COLLECTION_MANAGER_DEFAULT_LANGUAGE` | `de-DE`                           |
| `COLLECTION_MANAGER_DEFAULT_CURRENCY` | `EUR`                             |

Language values must be valid BCP 47 codes. Currency values must be supported
ISO 4217 codes. The database path must remain beneath the configured local data
directory.

## Database bootstrap

Create or upgrade the database and bootstrap the local defaults explicitly:

```sh
npm run db:bootstrap
```

The command is idempotent. It creates `Local collection` only when no collection
exists, using the configured language and currency. It never replaces an
existing collection or overwrites seeded records that a user has edited.
Migrations can also be run without bootstrap data using `npm run db:migrate`.
Applied migrations are recorded in `schema_migrations`.

The fixed condition grades use stable UUIDs and display order. Their codes cover
the workbook terms `nm-`, `ex`, `gd`, `lp`, `played`, and `poor`; the ambiguous
`x` token remains an import-time decision between mint and near mint.

| UUID                                   | Code              | Display name    | Order |
| -------------------------------------- | ----------------- | --------------- | ----: |
| `10000000-0000-4000-8000-000000000001` | `mint`            | Mint            |    10 |
| `10000000-0000-4000-8000-000000000002` | `near_mint`       | Near Mint       |    20 |
| `10000000-0000-4000-8000-000000000003` | `near_mint_minus` | Near Mint Minus |    30 |
| `10000000-0000-4000-8000-000000000004` | `excellent`       | Excellent       |    40 |
| `10000000-0000-4000-8000-000000000005` | `good`            | Good            |    50 |
| `10000000-0000-4000-8000-000000000006` | `lightly_played`  | Lightly Played  |    60 |
| `10000000-0000-4000-8000-000000000007` | `played`          | Played          |    70 |
| `10000000-0000-4000-8000-000000000008` | `poor`            | Poor            |    80 |
| `10000000-0000-4000-8000-000000000009` | `unknown`         | Unknown         |    90 |

The default collection UUID is
`20000000-0000-4000-8000-000000000001`. If a missing seed would conflict with
an existing UUID, code, or display order, bootstrap fails and rolls back instead
of changing existing data.
