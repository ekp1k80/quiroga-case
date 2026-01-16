import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession } from "@/lib/firestoreModels";

export async function GET() {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: true, loggedIn: false });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json({ ok: true, loggedIn: false });

  const userId = (session as any).userId;
  if (typeof userId !== "string" || userId.trim() === "") {
    console.error("Session doc missing userId", { sessionId, session });
    // en vez de 500, tratamos como no logueado (más amigable para testing)
    return NextResponse.json({ ok: true, loggedIn: false });
  }

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ ok: true, loggedIn: false });

  await touchSession(sessionId);

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    user: { name: user.name, level: user.level },
  });
}
