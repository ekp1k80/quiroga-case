// src/app/api/qr3/join/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser } from "@/lib/firestoreModels";
import { joinQr3AndMaybeGroup, getMyQr3Group } from "@/lib/rtdbPlaySession";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const playSessionId = typeof body?.playSessionId === "string" ? body.playSessionId : "";

  if (!playSessionId) return NextResponse.json({ ok: false, error: "playSessionId requerido" }, { status: 400 });

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  await joinQr3AndMaybeGroup({ playSessionId, userId: session.userId, name: user.name });

  const mine = await getMyQr3Group(playSessionId, session.userId);
  return NextResponse.json({ ok: true, myGroup: mine ?? null });
}
