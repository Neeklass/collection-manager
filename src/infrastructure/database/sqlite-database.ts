import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import type { ApplicationConfiguration } from "@/infrastructure/configuration/application-configuration";

const SQLITE_BUSY_TIMEOUT_MILLISECONDS = 5_000;

export type SqliteRuntimeSettings = {
  readonly foreignKeysEnabled: boolean;
  readonly journalMode: string;
};

export class SqliteDatabaseError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SqliteDatabaseError";
  }
}

export class SqliteDatabase {
  public constructor(private readonly database: Database.Database) {}

  public get isOpen(): boolean {
    return this.database.open;
  }

  public prepare<
    BindParameters extends unknown[] | object = unknown[],
    Result = unknown,
  >(sql: string): Database.Statement<BindParameters, Result> {
    return this.database.prepare<BindParameters, Result>(sql);
  }

  public executeSchema(sql: string): void {
    this.database.exec(sql);
  }

  public runInTransaction(operation: () => void): void {
    this.database.transaction(operation)();
  }

  public getRuntimeSettings(): SqliteRuntimeSettings {
    return readRuntimeSettings(this.database);
  }

  public close(): void {
    if (this.database.open) {
      this.database.close();
    }
  }
}

function readRuntimeSettings(
  database: Database.Database,
): SqliteRuntimeSettings {
  const foreignKeys = database.pragma("foreign_keys", { simple: true });
  const journalMode = database.pragma("journal_mode", { simple: true });

  if (typeof foreignKeys !== "number" || typeof journalMode !== "string") {
    throw new SqliteDatabaseError(
      "SQLite did not report the expected runtime settings.",
    );
  }

  return Object.freeze({
    foreignKeysEnabled: foreignKeys === 1,
    journalMode: journalMode.toLowerCase(),
  });
}

function configureDatabase(database: Database.Database): void {
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");

  const settings = readRuntimeSettings(database);

  if (!settings.foreignKeysEnabled || settings.journalMode !== "wal") {
    throw new SqliteDatabaseError(
      "SQLite requires foreign keys and write-ahead logging, but they could not be enabled.",
    );
  }
}

export function openSqliteDatabase(
  configuration: Pick<
    ApplicationConfiguration,
    "dataDirectory" | "databasePath"
  >,
): SqliteDatabase {
  let database: Database.Database | undefined;

  try {
    const dataDirectory = path.resolve(configuration.dataDirectory);
    const databasePath = path.resolve(configuration.databasePath);
    const relativeDatabasePath = path.relative(dataDirectory, databasePath);
    const isOutsideDataDirectory =
      relativeDatabasePath === "" ||
      relativeDatabasePath === ".." ||
      relativeDatabasePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativeDatabasePath);

    if (isOutsideDataDirectory) {
      throw new SqliteDatabaseError(
        "The configured SQLite database path must remain beneath the local data directory.",
      );
    }

    mkdirSync(dataDirectory, { recursive: true });
    mkdirSync(path.dirname(databasePath), {
      recursive: true,
    });

    database = new Database(databasePath, {
      timeout: SQLITE_BUSY_TIMEOUT_MILLISECONDS,
    });
    configureDatabase(database);

    return new SqliteDatabase(database);
  } catch (error: unknown) {
    if (database?.open) {
      database.close();
    }

    if (error instanceof SqliteDatabaseError) {
      throw error;
    }

    throw new SqliteDatabaseError(
      "Unable to open the local SQLite database. Verify that the configured data directory is writable.",
      { cause: error },
    );
  }
}
