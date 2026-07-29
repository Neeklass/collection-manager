import {
  ConfigurationError,
  getApplicationConfiguration,
} from "@/infrastructure/configuration/application-configuration";
import {
  migrateDatabase,
  MigrationError,
} from "@/infrastructure/database/migrate-database";
import {
  openSqliteDatabase,
  SqliteDatabaseError,
} from "@/infrastructure/database/sqlite-database";

function getSafeErrorMessage(error: unknown): string {
  if (
    error instanceof ConfigurationError ||
    error instanceof MigrationError ||
    error instanceof SqliteDatabaseError
  ) {
    return error.message;
  }

  return "An unexpected database migration error occurred.";
}

function run(): void {
  const configuration = getApplicationConfiguration();
  const database = openSqliteDatabase(configuration);

  try {
    const result = migrateDatabase(database);
    console.log(
      `Database migrations complete. Current schema version: ${result.currentVersion}.`,
    );
  } finally {
    database.close();
  }
}

try {
  run();
} catch (error: unknown) {
  console.error(`Database migration failed: ${getSafeErrorMessage(error)}`);
  process.exitCode = 1;
}
