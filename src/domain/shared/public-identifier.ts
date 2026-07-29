import { DomainValueError } from "@/domain/shared/domain-value-error";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PublicIdentifier = Readonly<{
  value: string;
  toString(): string;
  toJSON(): string;
}>;

export function createPublicIdentifier(value: string): PublicIdentifier {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new DomainValueError(
      "Public identifier must be a canonical RFC 4122 UUID.",
    );
  }

  const normalizedValue = value.toLowerCase();

  return Object.freeze({
    value: normalizedValue,
    toString: (): string => normalizedValue,
    toJSON: (): string => normalizedValue,
  });
}

export function generatePublicIdentifier(): PublicIdentifier {
  return createPublicIdentifier(globalThis.crypto.randomUUID());
}
