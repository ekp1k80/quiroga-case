// src/app/api/qr/claim/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import {
  getSession,
  getUser,
  touchSession,
  getQrClaim,
  createQrClaim,
  applyProgressPatch,
} from "@/lib/firestoreModels";
import { canAccess } from "@/data/levels";
import { QR_REWARDS, normCode } from "@/data/qrRewards";

type Req = { code?: string };

type Res = {
  ok: boolean;

  message?: string;
  urls?: { type: "image" | "audio" | "page"; url: string; label?: string }[];
  effects?: Record<string, any>;

  blocked?: boolean;
  alreadyClaimed?: boolean;

  error?: string;
  advanced?: { from: string; to: string };
};

export async function POST(req: Request) {
  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json<Res>({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const code = normCode(body.code ?? "");
  if (!code) {
    return NextResponse.json<Res>({ ok: false, error: "Missing code" }, { status: 400 });
  }

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json<Res>({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) {
    return NextResponse.json<Res>({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  await touchSession(sessionId);

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json<Res>({ ok: false, error: "No user" }, { status: 404 });

  const reward = QR_REWARDS[code];
  if (!reward) {
    return NextResponse.json<Res>({ ok: false, error: "Invalid code" }, { status: 404 });
  }

  // gating real (story/flags/tags)
  if (reward.requires) {
    const playerProgress = {
      storyNode: user.storyNode,
      flags: user.flags ?? [],
      tags: user.tags ?? [],
    };

    if (!canAccess(playerProgress, reward.requires)) {
      return NextResponse.json<Res>({
        ok: false,
        blocked: true,
        message: "Todavía no. Te falta completar pasos previos.",
      });
    }
  }

  if (reward.oneTime) {
    const existing = await getQrClaim(session.userId, code);
    if (existing) {
      return NextResponse.json<Res>({
        ok: false,
        alreadyClaimed: true,
        message: "Este QR ya fue usado en esta cuenta.",
        urls: reward.urls ?? [],
        effects: reward.effects ?? {},
      });
    }
  }

  // aplicar progreso (server decide)
  if (reward.onClaim) {
    await applyProgressPatch(session.userId, user.storyNode, reward.onClaim);
  }

  if (reward.oneTime) {
    await createQrClaim(session.userId, code, { meta: { claimedAt: Date.now() } });
  }

  return NextResponse.json<Res>({
    ok: true,
    message: reward.message ?? "OK.",
    urls: reward.urls ?? [],
    effects: reward.effects ?? {},
    advanced: reward.onClaim?.storyNode ? { from: user.storyNode, to: reward.onClaim?.storyNode } : undefined
  });
}
