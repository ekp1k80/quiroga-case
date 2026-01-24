// src/app/api/session/create/route.ts
import { NextResponse } from "next/server";
import {
  getTemporalCode,
  isTemporalCodeValid,
  createSession,
  createUser,
} from "@/lib/firestoreModels";
import { newSessionId, setSessionCookie } from "@/lib/sessionCookie";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const nameRaw = typeof body?.name === "string" ? body.name : "";
  const name = nameRaw.trim();

  if (!code) {
    return NextResponse.json({ ok: false, error: "code requerido" }, { status: 400 });
  }

  // Validación simple de nombre
  if (!name) {
    return NextResponse.json({ ok: false, error: "name requerido" }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "name muy corto" }, { status: 400 });
  }
  if (name.length > 32) {
    return NextResponse.json({ ok: false, error: "name muy largo" }, { status: 400 });
  }

  const doc = await getTemporalCode(code);
  if (!doc) {
    return NextResponse.json({ ok: false, error: "code inválido" }, { status: 403 });
  }

  if (!isTemporalCodeValid(doc)) {
    return NextResponse.json({ ok: false, error: "code expirado" }, { status: 403 });
  }

  const sessionId = newSessionId();
  const userId = sessionId; // simplificación: userId = sessionId

  await createUser(userId, name);
  await createSession(sessionId, userId);
  await setSessionCookie(sessionId);

  return NextResponse.json({ ok: true, sessionId, userId });
}
