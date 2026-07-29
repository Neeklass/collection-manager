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
customize the data directory, database path, application URL, or log level.
