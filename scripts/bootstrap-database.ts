import {
  ConfigurationError,
  getApplicationConfiguration,
} from "@/infrastructure/configuration/application-configuration";
import {
  bootstrapDatabase,
  DatabaseBootstrapError,
} from "@/infrastructure/database/bootstrap-database";
import {
  migrateDatabase,
  MigrationError,
} from "@/infrastructure/database/migrate-database";
import {
  openSqliteDatabase,
  SqliteDatabaseError,
} from "@/infrastructure/database/sqlite-database";
import { systemClock } from "@/infrastructure/time/system-clock";

function getSafeErrorMessage(error: unknown): string {
  if (
    error instanceof ConfigurationError ||
    error instanceof DatabaseBootstrapError ||
    error instanceof MigrationError ||
    error instanceof SqliteDatabaseError
  ) {
    return error.message;
  }

  return "An unexpected database bootstrap error occurred.";
}

function run(): void {
  const configuration = getApplicationConfiguration();
  const database = openSqliteDatabase(configuration);

  try {
    const migrationResult = migrateDatabase(database);
    const bootstrapResult = bootstrapDatabase(
      database,
      configuration,
      systemClock,
    );

    console.log(
      `Database bootstrap complete. Schema version: ${migrationResult.currentVersion}; condition grades created: ${bootstrapResult.conditionGradesCreated}; default collection created: ${bootstrapResult.collectionCreated ? "yes" : "no"}.`,
    );
  } finally {
    database.close();
  }
}

try {
  run();
} catch (error: unknown) {
  console.error(`Database bootstrap failed: ${getSafeErrorMessage(error)}`);
  process.exitCode = 1;
}
