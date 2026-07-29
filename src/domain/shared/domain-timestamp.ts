import { DomainValueError } from "@/domain/shared/domain-value-error";

const UTC_TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/;

export type DomainTimestamp = Readonly<{
  value: string;
  toString(): string;
  toJSON(): string;
}>;

export function createDomainTimestamp(value: string): DomainTimestamp {
  const match =
    typeof value === "string" ? UTC_TIMESTAMP_PATTERN.exec(value) : null;

  if (match === null) {
    throw new DomainValueError(
      "Domain timestamp must be a valid UTC ISO 8601 timestamp.",
    );
  }

  const timestampWithoutFraction = match[1];
  const fractionalSeconds = match[2] ?? "";

  if (timestampWithoutFraction === undefined) {
    throw new DomainValueError(
      "Domain timestamp must be a valid UTC ISO 8601 timestamp.",
    );
  }

  const canonicalValue = `${timestampWithoutFraction}.${fractionalSeconds.padEnd(3, "0")}Z`;
  const millisecondsSinceEpoch = Date.parse(canonicalValue);

  if (
    !Number.isFinite(millisecondsSinceEpoch) ||
    new Date(millisecondsSinceEpoch).toISOString() !== canonicalValue
  ) {
    throw new DomainValueError(
      "Domain timestamp must be a valid UTC ISO 8601 timestamp.",
    );
  }

  return Object.freeze({
    value: canonicalValue,
    toString: (): string => canonicalValue,
    toJSON: (): string => canonicalValue,
  });
}

export function createDomainTimestampFromDate(value: Date): DomainTimestamp {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new DomainValueError("Domain timestamp requires a valid date.");
  }

  return createDomainTimestamp(value.toISOString());
}
