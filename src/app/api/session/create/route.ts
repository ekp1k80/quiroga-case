// src/app/api/session/create/route.ts
import { NextResponse } from "next/server";
import { getTemporalCode, isTemporalCodeValid, createSession, createUser, setUserPlaySession } from "@/lib/firestoreModels";
import { newSessionId, setSessionCookie } from "@/lib/sessionCookie";
import { ensureRtdbPlaySession, addPlayerToPlaySession } from "@/lib/rtdbPlaySession";

type Res = { ok: boolean; sessionId?: string; userId?: string; playSessionId?: string; error?: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const nameRaw = typeof body?.name === "string" ? body.name : "";
  const name = nameRaw.trim();

  if (!code) return NextResponse.json({ ok: false, error: "code requerido" } satisfies Res, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "name requerido" } satisfies Res, { status: 400 });

  const doc = await getTemporalCode(code);
  if (!doc) return NextResponse.json({ ok: false, error: "code inválido" } satisfies Res, { status: 403 });
  if (!isTemporalCodeValid(doc)) return NextResponse.json({ ok: false, error: "code expirado" } satisfies Res, { status: 403 });

  const { playSessionId } = await ensureRtdbPlaySession(code);

  const sessionId = newSessionId();
  const userId = sessionId;

  await createUser(userId, name);
  await createSession(sessionId, userId);

  // ✅ clave
  await setUserPlaySession(userId, playSessionId);

  // ✅ RTDB join
  await addPlayerToPlaySession(playSessionId, userId, name);

  await setSessionCookie(sessionId);

  return NextResponse.json({ ok: true, sessionId, userId, playSessionId } satisfies Res);
}
