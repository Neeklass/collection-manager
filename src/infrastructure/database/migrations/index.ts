import { initialInfrastructureMigration } from "@/infrastructure/database/migrations/0001-initial-infrastructure";

import type { SqliteMigration } from "@/infrastructure/database/migration";

export const sqliteMigrations: readonly SqliteMigration[] = Object.freeze([
  initialInfrastructureMigration,
]);
