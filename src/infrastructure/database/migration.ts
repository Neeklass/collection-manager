export type SqliteMigration = {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
};
