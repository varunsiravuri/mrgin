// Unified data layer for auth + demo-trading persistence.
//
// • If a Postgres connection string is set (DATABASE_URL or SUPABASE_DB_URL),
//   all data is stored in that cloud database — e.g. a Supabase project, so
//   every signed-in user's credentials, positions, orders and history live in
//   the cloud and follow them across devices.
// • Otherwise it falls back to a local SQLite file (./.data/mrgin.db) so the
//   app still runs out-of-the-box in local dev with zero setup.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  created_at: number;
}

export interface SessionRow {
  user_id: string;
  expires_at: number;
}

export interface Store {
  backend: "postgres" | "sqlite";
  getUserByEmail(email: string): Promise<UserRow | undefined>;
  getUserById(id: string): Promise<UserRow | undefined>;
  createUser(u: UserRow): Promise<void>;
  setUserPassword(id: string, hash: string): Promise<void>;
  createSession(token: string, userId: string, createdAt: number, expiresAt: number): Promise<void>;
  deleteSession(token: string): Promise<void>;
  getSession(token: string): Promise<SessionRow | undefined>;
  getDemoState(userId: string): Promise<string | null>;
  saveDemoState(userId: string, data: string, updatedAt: number): Promise<void>;
}

const CONN = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";

// Cache the initialized store (and its init) across hot reloads.
declare global {
  // eslint-disable-next-line no-var
  var __mrginStore: Promise<Store> | undefined;
}

export function getStore(): Promise<Store> {
  if (!globalThis.__mrginStore) {
    globalThis.__mrginStore = CONN ? createPostgresStore(CONN) : createSqliteStore();
  }
  return globalThis.__mrginStore;
}

// ── Postgres (Supabase / any cloud Postgres) ──────────────────────────────────
async function createPostgresStore(connectionString: string): Promise<Store> {
  const { Pool } = await import("pg");
  const isLocal = /(@|\/\/)(localhost|127\.0\.0\.1)/.test(connectionString);
  const pool = new Pool({
    connectionString,
    // Hosted providers (Supabase, Neon, RDS…) require TLS.
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at    BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      expires_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS demo_state (
      user_id    TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `);

  const num = (v: unknown) => (typeof v === "string" ? Number(v) : (v as number));

  return {
    backend: "postgres",
    async getUserByEmail(email) {
      const r = await pool.query("SELECT id, email, password_hash, created_at FROM users WHERE email = $1", [email]);
      const row = r.rows[0];
      return row ? { ...row, created_at: num(row.created_at) } : undefined;
    },
    async getUserById(id) {
      const r = await pool.query("SELECT id, email, password_hash, created_at FROM users WHERE id = $1", [id]);
      const row = r.rows[0];
      return row ? { ...row, created_at: num(row.created_at) } : undefined;
    },
    async createUser(u) {
      await pool.query("INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)",
        [u.id, u.email, u.password_hash, u.created_at]);
    },
    async setUserPassword(id, hash) {
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, id]);
    },
    async createSession(token, userId, createdAt, expiresAt) {
      await pool.query("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)",
        [token, userId, createdAt, expiresAt]);
    },
    async deleteSession(token) {
      await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    },
    async getSession(token) {
      const r = await pool.query("SELECT user_id, expires_at FROM sessions WHERE token = $1", [token]);
      const row = r.rows[0];
      return row ? { user_id: row.user_id, expires_at: num(row.expires_at) } : undefined;
    },
    async getDemoState(userId) {
      const r = await pool.query("SELECT data FROM demo_state WHERE user_id = $1", [userId]);
      return r.rows[0]?.data ?? null;
    },
    async saveDemoState(userId, data, updatedAt) {
      await pool.query(`
        INSERT INTO demo_state (user_id, data, updated_at) VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      `, [userId, data, updatedAt]);
    },
  };
}

// ── SQLite fallback (local dev) ───────────────────────────────────────────────
async function createSqliteStore(): Promise<Store> {
  const dir = join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(join(dir, "mrgin.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS demo_state (
      user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL
    );
  `);

  return {
    backend: "sqlite",
    async getUserByEmail(email) {
      return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
    },
    async getUserById(id) {
      return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
    },
    async createUser(u) {
      db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
        .run(u.id, u.email, u.password_hash, u.created_at);
    },
    async setUserPassword(id, hash) {
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, id);
    },
    async createSession(token, userId, createdAt, expiresAt) {
      db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
        .run(token, userId, createdAt, expiresAt);
    },
    async deleteSession(token) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    },
    async getSession(token) {
      return db.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token) as SessionRow | undefined;
    },
    async getDemoState(userId) {
      const row = db.prepare("SELECT data FROM demo_state WHERE user_id = ?").get(userId) as { data: string } | undefined;
      return row?.data ?? null;
    },
    async saveDemoState(userId, data, updatedAt) {
      db.prepare(`
        INSERT INTO demo_state (user_id, data, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      `).run(userId, data, updatedAt);
    },
  };
}
