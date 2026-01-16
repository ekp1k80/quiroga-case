import { NextResponse } from "next/server";
import { getTemporalCode, isTemporalCodeValid, createSession, createUser } from "@/lib/firestoreModels";
import { newSessionId, setSessionCookie } from "@/lib/sessionCookie";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = body?.code;

  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ ok: false, error: "code requerido" }, { status: 400 });
  }

  const doc = await getTemporalCode(code.trim().toUpperCase());
  if (!doc) {
    return NextResponse.json({ ok: false, error: "code inválido" }, { status: 403 });
  }

  if (!isTemporalCodeValid(doc)) {
    return NextResponse.json({ ok: false, error: "code expirado" }, { status: 403 });
  }

  const sessionId = newSessionId();
  const userId = sessionId; // simplificación: userId = sessionId

  await createUser(userId, "Jugador"); // level "1"
  await createSession(sessionId, userId);
  await setSessionCookie(sessionId);

  return NextResponse.json({ ok: true, sessionId, userId });
}
