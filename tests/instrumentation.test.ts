import { afterEach, describe, expect, it, vi } from "vitest";

import { register } from "@/instrumentation";

describe("startup instrumentation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("terminates startup for invalid configuration without logging its value", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("COLLECTION_MANAGER_LOG_LEVEL", "secret-value");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const processExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process exited");
    }) as typeof process.exit);

    await expect(register()).rejects.toThrow("process exited");

    expect(processExit).toHaveBeenCalledWith(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Invalid application configuration: COLLECTION_MANAGER_LOG_LEVEL must be one of: debug, info, warn, error.",
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("secret-value"),
    );
  });
});
