import { DomainValueError } from "@/domain/shared/domain-value-error";

export type Quantity = Readonly<{
  value: number;
  toJSON(): number;
}>;

export function createQuantity(value: number): Quantity {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new DomainValueError("Quantity must be a positive safe integer.");
  }

  return Object.freeze({
    value,
    toJSON: (): number => value,
  });
}
