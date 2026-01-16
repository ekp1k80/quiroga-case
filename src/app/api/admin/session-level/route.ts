import { NextResponse } from "next/server";
import { getSession, setUserLevel } from "@/lib/firestoreModels";

function isAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const h = req.headers.get("x-admin-secret");
  return h === secret;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  const level = body?.level;

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return NextResponse.json({ ok: false, error: "sessionId requerido" }, { status: 400 });
  }
  if (typeof level !== "string" || !level.trim()) {
    return NextResponse.json({ ok: false, error: "level requerido" }, { status: 400 });
  }

  const session = await getSession(sessionId.trim());
  if (!session) return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });

  await setUserLevel(session.userId, level.trim());

  return NextResponse.json({ ok: true });
}
