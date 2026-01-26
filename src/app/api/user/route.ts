// src/app/api/user/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, updateUserName, touchSession } from "@/lib/firestoreModels";

export async function GET() {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  await touchSession(sessionId);

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      storyNode: user.storyNode,
      flags: user.flags ?? [],
      tags: user.tags ?? [],
      playSessionId: user.playSessionId ?? null
    },
  });
}

export async function POST(req: Request) {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = body?.name;

  if (typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ ok: false, error: "name requerido" }, { status: 400 });
  }

  await updateUserName(session.userId, name);
  await touchSession(sessionId);

  return NextResponse.json({ ok: true });
}
