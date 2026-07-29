import { createCurrency } from "@/domain/shared/currency";
import { DomainValueError } from "@/domain/shared/domain-value-error";

export type SerializedMoney = Readonly<{
  minorUnits: number;
  currency: string;
}>;

export type Money = Readonly<{
  minorUnits: number;
  currency: string;
  toJSON(): SerializedMoney;
}>;

export function createMoney(minorUnits: number, currencyCode: string): Money {
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
    throw new DomainValueError(
      "Money minor units must be a non-negative safe integer.",
    );
  }

  const currency = createCurrency(currencyCode).code;

  return Object.freeze({
    minorUnits,
    currency,
    toJSON: (): SerializedMoney => ({ minorUnits, currency }),
  });
}
