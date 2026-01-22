// src/app/api/progress/files-seen/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession, applyProgressPatch } from "@/lib/firestoreModels";
import { FILES_SEEN_GATES } from "@/data/progressGates";

type Req = {
  packId?: string;
  seenAll?: boolean;
  fileIds?: string[]; // ids vistos (si no usás seenAll)
};

type Res = {
  ok: boolean;
  blocked?: boolean;
  message?: string;
  advanced?: { from: string; to: string };
  error?: string;
};

export async function POST(req: Request) {
  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json<Res>({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const packId = String(body.packId ?? "").trim();
  if (!packId) return NextResponse.json<Res>({ ok: false, error: "Missing packId" }, { status: 400 });

  const seenAll = !!body.seenAll;
  const fileIds = Array.isArray(body.fileIds) ? body.fileIds.map(String) : [];

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json<Res>({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json<Res>({ ok: false, error: "Invalid session" }, { status: 401 });
  await touchSession(sessionId);

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json<Res>({ ok: false, error: "No user" }, { status: 404 });

  const gate = FILES_SEEN_GATES.find((g) => g.whenStoryNode === user.storyNode && g.packId === packId);
  if (!gate) {
    return NextResponse.json<Res>({
      ok: false,
      blocked: true,
      message: "No corresponde marcar archivos vistos en este momento.",
    });
  }

  // Validación de requeridos
  if (gate.requiredFileIds.length === 0) {
    if (!seenAll) {
      return NextResponse.json<Res>({
        ok: false,
        blocked: true,
        message: "Falta confirmar 'seenAll'.",
      });
    }
  } else {
    const seen = new Set(fileIds);
    const missing = gate.requiredFileIds.filter((id) => !seen.has(id));
    if (missing.length) {
      return NextResponse.json<Res>({
        ok: false,
        blocked: true,
        message: "Todavía no viste todo.",
      });
    }
  }

  const from = user.storyNode;
  const to = gate.advanceTo;

  await applyProgressPatch(session.userId, user.storyNode, {
    storyNode: to,
    addFlags: gate.addFlags,
    addTags: gate.addTags,
  });

  return NextResponse.json<Res>({
    ok: true,
    advanced: { from, to },
  });
}
