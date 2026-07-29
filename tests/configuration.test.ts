import { describe, expect, it } from "vitest";

import {
  ConfigurationError,
  parseApplicationConfiguration,
} from "@/infrastructure/configuration/application-configuration";

describe("application configuration", () => {
  it("uses safe local defaults", () => {
    expect(parseApplicationConfiguration({})).toEqual({
      dataDirectory: ".data",
      databasePath: ".data/collection-manager.sqlite",
      applicationUrl: "http://127.0.0.1:3000",
      logLevel: "info",
    });
  });

  it("loads and normalizes supported environment values", () => {
    expect(
      parseApplicationConfiguration({
        COLLECTION_MANAGER_DATA_DIRECTORY: "var/data",
        COLLECTION_MANAGER_DATABASE_PATH: "var/data/app.sqlite",
        COLLECTION_MANAGER_APP_URL: "http://localhost:4000/",
        COLLECTION_MANAGER_LOG_LEVEL: "debug",
      }),
    ).toEqual({
      dataDirectory: "var/data",
      databasePath: "var/data/app.sqlite",
      applicationUrl: "http://localhost:4000",
      logLevel: "debug",
    });
  });

  it("allows a database in a nested directory beneath the data directory", () => {
    expect(
      parseApplicationConfiguration({
        COLLECTION_MANAGER_DATA_DIRECTORY: "var/data",
        COLLECTION_MANAGER_DATABASE_PATH: "var/data/databases/app.sqlite",
      }).databasePath,
    ).toBe("var/data/databases/app.sqlite");
  });

  it.each([["../outside.sqlite"], [".data-other/outside.sqlite"], [".data"]])(
    "rejects a database path outside the local data directory",
    (value) => {
      expect(() =>
        parseApplicationConfiguration({
          COLLECTION_MANAGER_DATA_DIRECTORY: ".data",
          COLLECTION_MANAGER_DATABASE_PATH: value,
        }),
      ).toThrowError(
        "COLLECTION_MANAGER_DATABASE_PATH must be located beneath COLLECTION_MANAGER_DATA_DIRECTORY.",
      );
    },
  );

  it("does not expose a rejected database path", () => {
    const unsafePath = "../private/customer-name.sqlite";

    try {
      parseApplicationConfiguration({
        COLLECTION_MANAGER_DATA_DIRECTORY: ".data",
        COLLECTION_MANAGER_DATABASE_PATH: unsafePath,
      });
      expect.fail("Expected configuration parsing to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect((error as Error).message).not.toContain(unsafePath);
    }
  });

  it.each([
    ["COLLECTION_MANAGER_DATA_DIRECTORY", "\0data"],
    ["COLLECTION_MANAGER_DATABASE_PATH", "db\n.sqlite"],
  ])("rejects invalid %s without exposing its value", (name, value) => {
    expect(() => parseApplicationConfiguration({ [name]: value })).toThrowError(
      ConfigurationError,
    );
    expect(() => parseApplicationConfiguration({ [name]: value })).toThrowError(
      new RegExp(`${name} contains invalid path characters`),
    );
  });

  it("rejects invalid URLs and log levels", () => {
    expect(() =>
      parseApplicationConfiguration({
        COLLECTION_MANAGER_APP_URL: "http://user:secret@example.test",
      }),
    ).toThrowError(
      "COLLECTION_MANAGER_APP_URL must use HTTP or HTTPS without credentials.",
    );
    expect(() =>
      parseApplicationConfiguration({
        COLLECTION_MANAGER_LOG_LEVEL: "trace",
      }),
    ).toThrowError(
      "COLLECTION_MANAGER_LOG_LEVEL must be one of: debug, info, warn, error.",
    );
  });
});
