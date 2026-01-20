import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession, getQrClaim, createQrClaim } from "@/lib/firestoreModels";
import { QR_REWARDS, normCode } from "@/data/qrRewards";

type Req = { code?: string };

type Res = {
  ok: boolean;

  message?: string;
  urls?: { type: "image" | "audio" | "page"; url: string; label?: string }[];
  effects?: Record<string, any>;

  levelUp?: { from: number; to: number };

  blocked?: boolean;
  alreadyClaimed?: boolean;

  error?: string;
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

  // Auth por sesión
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
    // no reveles info; solo “inválido”
    return NextResponse.json<Res>({ ok: false, error: "Invalid code" }, { status: 404 });
  }

  const currentLevel = Number(user.level ?? "0") || 0;

  // gating por nivel
  if (reward.requiredLevel != null && currentLevel < reward.requiredLevel) {
    return NextResponse.json<Res>({
      ok: false,
      blocked: true,
      message: "Todavía no. Te falta completar pasos previos.",
    });
  }

  // oneTime por usuario
  if (reward.oneTime) {
    const existing = await getQrClaim(session.userId, code);
    if (existing) {
      return NextResponse.json<Res>({
        ok: false,
        alreadyClaimed: true,
        message: "Este QR ya fue usado en esta cuenta.",
        urls: reward.urls,
        effects: reward.effects,
      });
    }
  }

//   // Level up idempotente
//   let levelUp: Res["levelUp"] | undefined;
//   if (reward.setLevelTo != null) {
//     const target = reward.setLevelTo;
//     if (currentLevel < target) {
//       await setUserLevel(session.userId, String(target));
//       levelUp = { from: currentLevel, to: target };
//     }
//   }

//   // guardar claim si corresponde
//   if (reward.oneTime) {
//     await createQrClaim(session.userId, code, { meta: { levelUp } });
//   }

  return NextResponse.json<Res>({
    ok: true,
    message: reward.message ?? "OK.",
    urls: reward.urls ?? [],
    effects: reward.effects ?? {},
    // levelUp,
  });
}
