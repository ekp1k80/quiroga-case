// src/app/api/progress/storytelling-done/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession, applyProgressPatch } from "@/lib/firestoreModels";
import { STORYTELLING_DONE_GATES } from "@/data/progressGates";

type Req = { sceneId?: string };

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

  const sceneId = String(body.sceneId ?? "").trim();
  if (!sceneId) return NextResponse.json<Res>({ ok: false, error: "Missing sceneId" }, { status: 400 });

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json<Res>({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json<Res>({ ok: false, error: "Invalid session" }, { status: 401 });
  await touchSession(sessionId);

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json<Res>({ ok: false, error: "No user" }, { status: 404 });

  const gate = STORYTELLING_DONE_GATES.find((g) => g.whenStoryNode === user.storyNode && g.sceneId === sceneId);
  if (!gate) {
    return NextResponse.json<Res>({
      ok: false,
      blocked: true,
      message: "Esta escena no corresponde al progreso actual.",
    });
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
