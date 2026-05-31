import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStore, type UserRow } from "./store";

export const SESSION_COOKIE = "mrgin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type User = UserRow;

// ── Password hashing (scrypt, no native dep) ────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}

// ── Users ────────────────────────────────────────────────────────────────────
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return (await getStore()).getUserByEmail(normalizeEmail(email));
}

export async function createUser(email: string, passwordHash: string | null): Promise<User> {
  const user: User = { id: randomUUID(), email: normalizeEmail(email), password_hash: passwordHash, created_at: Date.now() };
  await (await getStore()).createUser(user);
  return user;
}

export async function setUserPassword(id: string, passwordHash: string): Promise<void> {
  await (await getStore()).setUserPassword(id, passwordHash);
}

// ── Sessions ───────────────────────────────────────────────────────────────
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  await (await getStore()).createSession(token, userId, now, now + SESSION_TTL_MS);
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await (await getStore()).deleteSession(token);
}

/** Read the current user from the session cookie (server components / route handlers). */
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = await getStore();
  const session = await store.getSession(token);
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    await store.deleteSession(token);
    return null;
  }
  return (await store.getUserById(session.user_id)) ?? null;
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

// ── Per-user demo-trading state ──────────────────────────────────────────────
export async function getDemoState(userId: string): Promise<unknown | null> {
  const raw = await (await getStore()).getDemoState(userId);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function saveDemoState(userId: string, state: unknown): Promise<void> {
  await (await getStore()).saveDemoState(userId, JSON.stringify(state), Date.now());
}
