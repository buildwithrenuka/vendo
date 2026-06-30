import { addDays, nowIso } from "./utils";
import { hashSessionToken, randomToken, timingSafeEqual } from "./crypto";
import { findUserById, mapUser } from "./users";
import type { User } from "@vendo/shared";

const SESSION_COOKIE = "vendo_session";
const SESSION_DAYS = 30;

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}

export async function createSession(
  db: D1Database,
  userId: string,
  secret: string,
): Promise<string> {
  const rawToken = randomToken(32);
  const sessionId = crypto.randomUUID();
  const tokenHash = await hashSessionToken(rawToken, secret);
  const expiresAt = addDays(new Date(), SESSION_DAYS).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)")
    .bind(sessionId, userId, tokenHash, expiresAt)
    .run();

  return `${sessionId}.${rawToken}`;
}

export async function getSessionUser(
  db: D1Database,
  cookieValue: string | null,
  secret: string,
): Promise<User | null> {
  if (!cookieValue) return null;

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex === -1) return null;

  const sessionId = cookieValue.slice(0, dotIndex);
  const rawToken = cookieValue.slice(dotIndex + 1);
  if (!sessionId || !rawToken) return null;

  const session = await db
    .prepare("SELECT user_id, token_hash FROM sessions WHERE id = ? AND expires_at > ?")
    .bind(sessionId, nowIso())
    .first<{ user_id: string; token_hash: string }>();

  if (!session) return null;

  const tokenHash = await hashSessionToken(rawToken, secret);
  const valid = await timingSafeEqual(tokenHash, session.token_hash);
  if (!valid) return null;

  const user = await findUserById(db, session.user_id);
  if (!user) return null;

  return mapUser(user);
}

export async function destroySession(db: D1Database, cookieValue: string | null): Promise<void> {
  if (!cookieValue) return;
  const sessionId = cookieValue.split(".")[0];
  if (!sessionId) return;
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

export function buildSessionCookie(token: string, secure: boolean): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `vendo_session=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function buildClearSessionCookie(): string {
  return "vendo_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
}
