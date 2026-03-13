import { NextRequest } from "next/server";
import { timingSafeEqual, randomBytes } from "crypto";

/**
 * Timing-safe comparison of two strings.
 * Prevents timing attacks on password verification.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const buf = Buffer.from(a);
    timingSafeEqual(buf, buf);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * In-memory session store for admin tokens.
 * Tokens are random, not derived from the password.
 * Resets on server restart — acceptable for single-admin use.
 */
const sessionStore = new Map<string, { expiresAt: number }>();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createAdminSession(): string {
  const token = randomBytes(32).toString("hex");
  sessionStore.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function isValidSession(token: string): boolean {
  const session = sessionStore.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return false;
  }
  return true;
}

export function revokeAdminSession(token: string): void {
  sessionStore.delete(token);
}

/**
 * Check if a request is authorized for admin access.
 * Validates the admin_token cookie against the session store.
 */
export function isAdminAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken && isValidSession(cookieToken)) return true;
  return false;
}
