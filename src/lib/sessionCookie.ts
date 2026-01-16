import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "caso_session";

export async function getSessionIdFromCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(sessionId: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function newSessionId() {
  return crypto.randomUUID();
}
