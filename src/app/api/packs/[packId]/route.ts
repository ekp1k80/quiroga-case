import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession } from "@/lib/firestoreModels";
import { PACKS } from "@/data/packs";

export async function GET(_req: Request, ctx: { params: Promise<{ packId: string }> }) {
  const { packId } = await ctx.params;

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  if (!session.userId || typeof session.userId !== "string" || session.userId.trim() === "") {
    return NextResponse.json({ ok: false, error: "Session missing userId" }, { status: 500 });
  }

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  const pack = PACKS[packId];
  if (!pack) return NextResponse.json({ ok: false, error: "Pack not found" }, { status: 404 });

  const userLevelNum = Number.parseInt(user.level, 10);
  if (!Number.isFinite(userLevelNum) || userLevelNum < pack.minLevel) {
    return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  }

  // ✅ devolver keys + viz (solo para audios)
  const files = pack.files.map((f) => {
    if (f.type === "audio") {
      return {
        id: f.id,
        type: f.type,
        title: f.title,
        key: f.key,
        viz: f.viz ?? null, // opcional, pero estable para el frontend
      };
    }

    // doc
    return {
      id: f.id,
      type: f.type,
      title: f.title,
      key: f.key,
    };
  });

  await touchSession(sessionId);

  return NextResponse.json({
    ok: true,
    packId: pack.id,
    files,
  });
}
