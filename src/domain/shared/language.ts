import { DomainValueError } from "@/domain/shared/domain-value-error";

export type SerializedLanguage = Readonly<{
  code: string;
  sourceLabel?: string;
}>;

export type Language = Readonly<{
  code: string;
  sourceLabel?: string;
  toJSON(): SerializedLanguage;
}>;

function canonicalizeLanguageCode(code: string): string {
  if (typeof code !== "string" || code.length === 0) {
    throw new DomainValueError("Language must be a valid BCP 47 code.");
  }

  try {
    const [canonicalCode] = Intl.getCanonicalLocales([code]);

    if (canonicalCode === undefined) {
      throw new DomainValueError("Language must be a valid BCP 47 code.");
    }

    return canonicalCode;
  } catch (error: unknown) {
    if (error instanceof DomainValueError) {
      throw error;
    }

    throw new DomainValueError("Language must be a valid BCP 47 code.");
  }
}

export function createLanguage(code: string, sourceLabel?: string): Language {
  const canonicalCode = canonicalizeLanguageCode(code);

  if (sourceLabel !== undefined && sourceLabel.trim().length === 0) {
    throw new DomainValueError(
      "Language source label must contain a visible value when provided.",
    );
  }

  return Object.freeze({
    code: canonicalCode,
    ...(sourceLabel === undefined ? {} : { sourceLabel }),
    toJSON: (): SerializedLanguage =>
      sourceLabel === undefined
        ? { code: canonicalCode }
        : { code: canonicalCode, sourceLabel },
  });
}
