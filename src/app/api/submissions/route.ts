// src/app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import {
  getSession,
  getUser,
  touchSession,
  getUserSubmission,
} from "@/lib/firestoreModels";

type Res = {
  ok: boolean;
  packId?: string;
  puzzleId?: string;

  // raw flat map (debug / opcional)
  payloadFlat?: Record<string, any>;

  // ✅ bonito (nested)
  payload?: Record<string, any>;

  completedAt?: any;
  updatedAt?: any;

  error?: string;
};

function setNested(obj: any, path: string, value: any) {
  const parts = path.split(".").filter(Boolean);
  if (!parts.length) return;

  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];

    // last
    if (i === parts.length - 1) {
      cur[key] = value;
      return;
    }

    // keep going
    if (cur[key] == null || typeof cur[key] !== "object" || Array.isArray(cur[key])) {
      cur[key] = {};
    }
    cur = cur[key];
  }
}

function toNestedPayload(flat: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(flat ?? {})) {
    setNested(out, k, v);
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const packId = (url.searchParams.get("packId") ?? "").trim();
  const puzzleId = (url.searchParams.get("puzzleId") ?? "").trim();
  const includeFlat = (url.searchParams.get("flat") ?? "").trim() === "1";

  if (!packId || !puzzleId) {
    return NextResponse.json<Res>(
      { ok: false, error: "Missing packId/puzzleId" },
      { status: 400 }
    );
  }

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return NextResponse.json<Res>({ ok: false, error: "No session" }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session || session.revoked) {
    return NextResponse.json<Res>({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  const user = await getUser(session.userId);
  if (!user) {
    return NextResponse.json<Res>({ ok: false, error: "No user" }, { status: 404 });
  }

  const submission = await getUserSubmission(session.userId, packId, puzzleId);
  const flat = (submission?.payload ?? {}) as Record<string, any>;
  const nested = toNestedPayload(flat);

  await touchSession(sessionId);

  return NextResponse.json<Res>({
    ok: true,
    packId,
    puzzleId,
    payload: nested,
    payloadFlat: includeFlat ? flat : undefined,
    completedAt: submission?.completedAt ?? null,
    updatedAt: submission?.updatedAt ?? null,
  });
}
