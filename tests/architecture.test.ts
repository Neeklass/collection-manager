import { describe, expect, it } from "vitest";

import { createGetApplicationHealth } from "@/application/health/get-application-health";

describe("application boundaries", () => {
  it("allows a use case to run with an injected port", async () => {
    const health = await createGetApplicationHealth({
      now: (): Date => new Date("2026-01-01T00:00:00.000Z"),
    })();

    expect(health).toEqual({
      status: "ok",
      checkedAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
