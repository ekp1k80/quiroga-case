// src\app\api\packs\[packId]\route.ts
import { NextResponse } from "next/server";
import { getR2SignedUrl } from "@/lib/r2SignedUrl";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession } from "@/lib/firestoreModels";
import { PACKS } from "@/data/packs";
import { canAccess } from "@/data/levels";

export async function GET(_req: Request, ctx: { params: Promise<{ packId: string }> }) {
  const { packId } = await ctx.params;

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  if (!session.userId || typeof session.userId !== "string" || session.userId.trim() === "") {
    return NextResponse.json({ ok: false, error: "Session missing userId" }, { status: 500 });
  }

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  const pack = PACKS[packId];
  if (!pack) return NextResponse.json({ ok: false, error: "Pack not found" }, { status: 404 });

  const progress = { storyNode: user.storyNode, flags: user.flags ?? [], tags: user.tags ?? [] };
  if (!canAccess(progress, pack.requires ?? null)) {
    return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  }

  // ✅ firmar concurrente
  const files = await Promise.all(
    pack.files.map(async (f) => {
      const url = await getR2SignedUrl(f.key, 60 * 10);

      if (f.type === "audio") {
        return { id: f.id, type: f.type, title: f.title, url, viz: f.viz ?? null, notShowFileViewer: f.notShowFileViewer ?? false };
      }
      if (f.type === "img") {
        return {
          id: f.id,
          type: f.type,
          title: f.title,
          url,
          alt: f.alt ?? null,
          width: f.width ?? null,
          height: f.height ?? null,
          notShowFileViewer: f.notShowFileViewer ?? false
        };
      }
      return { id: f.id, type: f.type, title: f.title, url, notShowFileViewer: f.notShowFileViewer ?? false };
    })
  );

  await touchSession(sessionId);

  return NextResponse.json({ ok: true, packId: pack.id, files });
}
