import type { SqliteMigration } from "@/infrastructure/database/migration";

export const initialInfrastructureMigration = {
  version: 1,
  name: "initial-infrastructure",
  sql: `
    CREATE TABLE database_metadata (
      metadata_key TEXT PRIMARY KEY NOT NULL
        CHECK (length(metadata_key) > 0),
      metadata_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
        CHECK (updated_at GLOB '????-??-??T??:??:??.???Z')
    );
  `,
} satisfies SqliteMigration;
