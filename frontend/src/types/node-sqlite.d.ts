// Minimal ambient types for Node's built-in SQLite (node:sqlite).
// The installed @types/node (v20) predates these declarations.
declare module "node:sqlite" {
  type SQLiteParam = string | number | bigint | null | Uint8Array;

  interface StatementSync {
    run(...params: SQLiteParam[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: SQLiteParam[]): unknown;
    all(...params: SQLiteParam[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
