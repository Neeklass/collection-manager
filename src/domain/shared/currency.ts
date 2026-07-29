import { DomainValueError } from "@/domain/shared/domain-value-error";

const ISO_CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const supportedCurrencyCodes: ReadonlySet<string> = new Set(
  Intl.supportedValuesOf("currency"),
);

export type Currency = Readonly<{
  code: string;
  toString(): string;
  toJSON(): string;
}>;

export function createCurrency(code: string): Currency {
  const normalizedCode = typeof code === "string" ? code.toUpperCase() : "";

  if (
    !ISO_CURRENCY_CODE_PATTERN.test(normalizedCode) ||
    !supportedCurrencyCodes.has(normalizedCode)
  ) {
    throw new DomainValueError(
      "Currency must be a supported ISO 4217 currency code.",
    );
  }

  return Object.freeze({
    code: normalizedCode,
    toString: (): string => normalizedCode,
    toJSON: (): string => normalizedCode,
  });
}
