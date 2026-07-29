import { describe, expect, it } from "vitest";

import { createCurrency } from "@/domain/shared/currency";
import {
  createDomainTimestamp,
  createDomainTimestampFromDate,
} from "@/domain/shared/domain-timestamp";
import { DomainValueError } from "@/domain/shared/domain-value-error";
import { createLanguage } from "@/domain/shared/language";
import { createMoney } from "@/domain/shared/money";
import {
  createPublicIdentifier,
  generatePublicIdentifier,
} from "@/domain/shared/public-identifier";
import { createQuantity } from "@/domain/shared/quantity";

describe("public identifiers", () => {
  it("accepts and canonically serializes RFC 4122 UUIDs", () => {
    const identifier = createPublicIdentifier(
      "67E55044-10B1-426F-9247-BB680E5FE0C8",
    );

    expect(identifier.value).toBe("67e55044-10b1-426f-9247-bb680e5fe0c8");
    expect(identifier.toString()).toBe("67e55044-10b1-426f-9247-bb680e5fe0c8");
    expect(JSON.stringify(identifier)).toBe(
      '"67e55044-10b1-426f-9247-bb680e5fe0c8"',
    );
    expect(Object.isFrozen(identifier)).toBe(true);
  });

  it("generates valid public UUID identifiers", () => {
    const identifier = generatePublicIdentifier();

    expect(() => createPublicIdentifier(identifier.value)).not.toThrow();
  });

  it.each([
    "67e5504410b1426f9247bb680e5fe0c8",
    "{67e55044-10b1-426f-9247-bb680e5fe0c8}",
    "67e55044-10b1-026f-9247-bb680e5fe0c8",
    "67e55044-10b1-426f-7247-bb680e5fe0c8",
  ])("rejects invalid UUID value %s", (value) => {
    expect(() => createPublicIdentifier(value)).toThrowError(DomainValueError);
  });
});

describe("quantity", () => {
  it("accepts positive safe integers and serializes as a number", () => {
    const quantity = createQuantity(3);

    expect(quantity.value).toBe(3);
    expect(JSON.stringify(quantity)).toBe("3");
    expect(Object.isFrozen(quantity)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid quantity %s",
    (value) => {
      expect(() => createQuantity(value)).toThrowError(DomainValueError);
    },
  );
});

describe("currency", () => {
  it.each([
    ["eur", "EUR"],
    ["USD", "USD"],
  ])("validates and normalizes %s", (input, expected) => {
    const currency = createCurrency(input);

    expect(currency.code).toBe(expected);
    expect(JSON.stringify(currency)).toBe(`"${expected}"`);
    expect(Object.isFrozen(currency)).toBe(true);
  });

  it.each(["", "US", "ZZZ", "EURO"])(
    "rejects unsupported currency %s",
    (value) => {
      expect(() => createCurrency(value)).toThrowError(DomainValueError);
    },
  );
});

describe("money", () => {
  it("preserves exact minor units with a validated currency", () => {
    const money = createMoney(12_345, "usd");

    expect(money).toMatchObject({
      minorUnits: 12_345,
      currency: "USD",
    });
    expect(JSON.stringify(money)).toBe('{"minorUnits":12345,"currency":"USD"}');
    expect(Object.isFrozen(money)).toBe(true);
  });

  it("accepts zero minor units", () => {
    expect(createMoney(0, "EUR").minorUnits).toBe(0);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid minor units %s",
    (value) => {
      expect(() => createMoney(value, "EUR")).toThrowError(DomainValueError);
    },
  );

  it.each(["", "ZZZ"])("rejects incomplete or invalid currency %s", (value) => {
    expect(() => createMoney(100, value)).toThrowError(DomainValueError);
  });
});

describe("language", () => {
  it("canonicalizes BCP 47 codes independently from source labels", () => {
    const language = createLanguage("de-de", " Deutsch (Import) ");

    expect(language.code).toBe("de-DE");
    expect(language.sourceLabel).toBe(" Deutsch (Import) ");
    expect(JSON.stringify(language)).toBe(
      '{"code":"de-DE","sourceLabel":" Deutsch (Import) "}',
    );
    expect(Object.isFrozen(language)).toBe(true);
  });

  it("serializes without a source label when none was supplied", () => {
    expect(JSON.stringify(createLanguage("ja"))).toBe('{"code":"ja"}');
  });

  it.each(["", "de_DE", "123"])("rejects invalid language code %s", (value) => {
    expect(() => createLanguage(value)).toThrowError(DomainValueError);
  });

  it("rejects an empty source label", () => {
    expect(() => createLanguage("en", "   ")).toThrowError(DomainValueError);
  });
});

describe("domain timestamps", () => {
  it.each([
    ["2026-07-29T18:55:18Z", "2026-07-29T18:55:18.000Z"],
    ["2026-07-29T18:55:18.2Z", "2026-07-29T18:55:18.200Z"],
    ["2024-02-29T00:00:00.123Z", "2024-02-29T00:00:00.123Z"],
  ])("validates and canonically serializes %s", (input, expected) => {
    const timestamp = createDomainTimestamp(input);

    expect(timestamp.value).toBe(expected);
    expect(timestamp.toString()).toBe(expected);
    expect(JSON.stringify(timestamp)).toBe(`"${expected}"`);
    expect(Object.isFrozen(timestamp)).toBe(true);
  });

  it("creates a canonical UTC value from a valid Date", () => {
    expect(
      createDomainTimestampFromDate(new Date("2026-07-29T20:55:18.223+02:00"))
        .value,
    ).toBe("2026-07-29T18:55:18.223Z");
  });

  it.each([
    "2026-07-29",
    "2026-07-29T18:55:18+00:00",
    "2026-07-29T20:55:18.223+02:00",
    "2025-02-29T00:00:00Z",
    "2026-04-31T00:00:00Z",
    "2026-07-29T24:01:00Z",
  ])("rejects invalid or non-UTC timestamp %s", (value) => {
    expect(() => createDomainTimestamp(value)).toThrowError(DomainValueError);
  });

  it("rejects an invalid Date", () => {
    expect(() =>
      createDomainTimestampFromDate(new Date(Number.NaN)),
    ).toThrowError(DomainValueError);
  });
});
