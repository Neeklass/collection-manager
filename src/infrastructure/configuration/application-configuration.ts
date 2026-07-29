import path from "node:path";

export const DEFAULT_DATA_DIRECTORY = ".data";
export const DEFAULT_APPLICATION_URL = "http://127.0.0.1:3000";
export const DEFAULT_LOG_LEVEL = "info";

const DEFAULT_DATABASE_FILENAME = "collection-manager.sqlite";
const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type ApplicationConfiguration = {
  readonly dataDirectory: string;
  readonly databasePath: string;
  readonly applicationUrl: string;
  readonly logLevel: LogLevel;
};

export type ConfigurationEnvironment = Readonly<
  Record<string, string | undefined>
>;

export class ConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

function readOptionalEnvironment(
  environment: ConfigurationEnvironment,
  name: string,
): string | undefined {
  const value = environment[name]?.trim();

  if (value === "") {
    throw new ConfigurationError(`${name} must not be empty.`);
  }

  return value;
}

function validatePath(value: string, name: string): string {
  if (value.includes("\0") || value.includes("\n") || value.includes("\r")) {
    throw new ConfigurationError(`${name} contains invalid path characters.`);
  }

  return value;
}

function validateApplicationUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new ConfigurationError(
      "COLLECTION_MANAGER_APP_URL must be an absolute HTTP or HTTPS URL.",
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new ConfigurationError(
      "COLLECTION_MANAGER_APP_URL must use HTTP or HTTPS without credentials.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

function validateLogLevel(value: string): LogLevel {
  if (!LOG_LEVELS.includes(value as LogLevel)) {
    throw new ConfigurationError(
      "COLLECTION_MANAGER_LOG_LEVEL must be one of: debug, info, warn, error.",
    );
  }

  return value as LogLevel;
}

export function parseApplicationConfiguration(
  environment: ConfigurationEnvironment,
): ApplicationConfiguration {
  const dataDirectory = validatePath(
    readOptionalEnvironment(environment, "COLLECTION_MANAGER_DATA_DIRECTORY") ??
      DEFAULT_DATA_DIRECTORY,
    "COLLECTION_MANAGER_DATA_DIRECTORY",
  );
  const databasePath = validatePath(
    readOptionalEnvironment(environment, "COLLECTION_MANAGER_DATABASE_PATH") ??
      path.join(dataDirectory, DEFAULT_DATABASE_FILENAME),
    "COLLECTION_MANAGER_DATABASE_PATH",
  );
  const applicationUrl = validateApplicationUrl(
    readOptionalEnvironment(environment, "COLLECTION_MANAGER_APP_URL") ??
      DEFAULT_APPLICATION_URL,
  );
  const logLevel = validateLogLevel(
    readOptionalEnvironment(environment, "COLLECTION_MANAGER_LOG_LEVEL") ??
      DEFAULT_LOG_LEVEL,
  );

  return Object.freeze({
    dataDirectory,
    databasePath,
    applicationUrl,
    logLevel,
  });
}

let applicationConfiguration: ApplicationConfiguration | undefined;

export function getApplicationConfiguration(): ApplicationConfiguration {
  applicationConfiguration ??= parseApplicationConfiguration(process.env);

  return applicationConfiguration;
}
