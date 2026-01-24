import { NextResponse } from "next/server";
import { createSession, createUser, setUserStoryNode } from "@/lib/firestoreModels";
import { newSessionId, setSessionCookie } from "@/lib/sessionCookie";

type Body = { name?: string; storyNode?: string };

function isDev() {
  return process.env.NODE_ENV !== "production";
}

export async function POST(req: Request) {
  if (!isDev()) {
    return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const nameRaw = typeof body?.name === "string" ? body!.name : "";
  const storyNodeRaw = typeof body?.storyNode === "string" ? body!.storyNode : "";

  const name = nameRaw.trim();
  const storyNode = (storyNodeRaw.trim() || "qr3") as any;

  if (!name || name.length < 2 || name.length > 32) {
    return NextResponse.json({ ok: false, error: "Nombre inválido" }, { status: 400 });
  }

  const sessionId = newSessionId();
  const userId = sessionId; // igual que tu create normal

  await createUser(userId, name);
  await setUserStoryNode(userId, storyNode);
  await createSession(sessionId, userId);
  await setSessionCookie(sessionId);

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      name,
      storyNode,
      flags: [],
      tags: [],
    },
  });
}
