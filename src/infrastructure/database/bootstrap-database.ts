import type { ApplicationClock } from "@/application/ports/application-clock";
import { createDomainTimestampFromDate } from "@/domain/shared/domain-timestamp";
import type { ApplicationConfiguration } from "@/infrastructure/configuration/application-configuration";
import type { SqliteDatabase } from "@/infrastructure/database/sqlite-database";

export const DEFAULT_LOCAL_COLLECTION_ID =
  "20000000-0000-4000-8000-000000000001";
export const DEFAULT_LOCAL_COLLECTION_NAME = "Local collection";

export type SeededConditionGrade = Readonly<{
  id: string;
  code: string;
  displayName: string;
  displayOrder: number;
}>;

export const SEEDED_CONDITION_GRADES: readonly SeededConditionGrade[] =
  Object.freeze([
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000001",
      code: "mint",
      displayName: "Mint",
      displayOrder: 10,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000002",
      code: "near_mint",
      displayName: "Near Mint",
      displayOrder: 20,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000003",
      code: "near_mint_minus",
      displayName: "Near Mint Minus",
      displayOrder: 30,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000004",
      code: "excellent",
      displayName: "Excellent",
      displayOrder: 40,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000005",
      code: "good",
      displayName: "Good",
      displayOrder: 50,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000006",
      code: "lightly_played",
      displayName: "Lightly Played",
      displayOrder: 60,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000007",
      code: "played",
      displayName: "Played",
      displayOrder: 70,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000008",
      code: "poor",
      displayName: "Poor",
      displayOrder: 80,
    }),
    Object.freeze({
      id: "10000000-0000-4000-8000-000000000009",
      code: "unknown",
      displayName: "Unknown",
      displayOrder: 90,
    }),
  ]);

export type DatabaseBootstrapResult = Readonly<{
  conditionGradesCreated: number;
  collectionCreated: boolean;
}>;

export class DatabaseBootstrapError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DatabaseBootstrapError";
  }
}

export function bootstrapDatabase(
  database: SqliteDatabase,
  configuration: Pick<
    ApplicationConfiguration,
    "defaultLanguageCode" | "defaultCurrencyCode"
  >,
  clock: ApplicationClock,
): DatabaseBootstrapResult {
  let conditionGradesCreated = 0;
  let collectionCreated = false;

  try {
    const timestamp = createDomainTimestampFromDate(clock.now()).value;
    const insertConditionGrade = database.prepare<
      [string, string, string, number, string, string]
    >(
      `
        INSERT INTO condition_grades (
          id,
          code,
          display_name,
          display_order,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `,
    );
    const insertDefaultCollection = database.prepare<
      [string, string, string, string, string, string]
    >(
      `
        INSERT INTO collections (
          id,
          name,
          default_language_code,
          default_currency_code,
          created_at,
          updated_at
        )
        SELECT ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM collections)
      `,
    );

    database.runInTransaction(() => {
      SEEDED_CONDITION_GRADES.forEach((conditionGrade) => {
        conditionGradesCreated += insertConditionGrade.run(
          conditionGrade.id,
          conditionGrade.code,
          conditionGrade.displayName,
          conditionGrade.displayOrder,
          timestamp,
          timestamp,
        ).changes;
      });

      collectionCreated =
        insertDefaultCollection.run(
          DEFAULT_LOCAL_COLLECTION_ID,
          DEFAULT_LOCAL_COLLECTION_NAME,
          configuration.defaultLanguageCode,
          configuration.defaultCurrencyCode,
          timestamp,
          timestamp,
        ).changes === 1;
    });
  } catch (error: unknown) {
    throw new DatabaseBootstrapError(
      "Database bootstrap could not be completed. Existing condition identifiers, codes, or display order may conflict with the fixed local seed data; no bootstrap changes were applied.",
      { cause: error },
    );
  }

  return Object.freeze({
    conditionGradesCreated,
    collectionCreated,
  });
}
