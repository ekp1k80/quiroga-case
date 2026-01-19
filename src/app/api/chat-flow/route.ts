import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import {
  getSession,
  getUser,
  touchSession,
  setUserLevel,
  getPuzzleProgress,
  upsertPuzzleProgress,
} from "@/lib/firestoreModels";
import { PUZZLE_FLOWS, puzzleKey } from "@/data/puzzleFlows";

type Req = { packId?: string; puzzleId?: string; input?: string };

type Res = {
  ok: boolean;
  messages: string[];
  blocked?: boolean;
  done?: boolean;
  levelUp?: { from: number; to: number };
  effects?: Record<string, any>;
  error?: string;

  // debug opcional (solo dev)
  debug?: any;
};

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json<Res>({ ok: false, messages: [], error: "Invalid JSON" }, { status: 400 });
  }

  const packId = (body.packId ?? "").trim();
  const puzzleId = (body.puzzleId ?? "").trim();
  const input = norm(body.input ?? "");

  if (!packId || !puzzleId) {
    return NextResponse.json<Res>({ ok: false, messages: [], error: "Missing packId/puzzleId" }, { status: 400 });
  }

  const cfg = PUZZLE_FLOWS[puzzleKey(packId, puzzleId)];
  if (!cfg) {
    return NextResponse.json<Res>(
      {
        ok: false,
        messages: [],
        error: "Unknown puzzle",
        debug:
          process.env.NODE_ENV !== "production"
            ? { received: { packId, puzzleId }, available: Object.keys(PUZZLE_FLOWS) }
            : undefined,
      },
      { status: 404 }
    );
  }

  // sesión
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json<Res>({ ok: false, messages: [], error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) {
    return NextResponse.json<Res>({ ok: false, messages: [], error: "Invalid session" }, { status: 401 });
  }
  await touchSession(sessionId);

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json<Res>({ ok: false, messages: [], error: "No user" }, { status: 404 });

  const level = Number(user.level ?? "0") || 0;

  // gating por nivel
  if (level < cfg.requiredLevel) {
    return NextResponse.json<Res>({
      ok: false,
      blocked: true,
      messages: [cfg.blockedMessage],
    });
  }

  // progreso
  const progress = await getPuzzleProgress(session.userId, packId, puzzleId);
  const stepIndex = progress?.step ?? 0;
  const solved = !!progress?.solved;

  // si ya está resuelto
  if (solved) {
    return NextResponse.json<Res>({
      ok: true,
      done: true,
      messages: ["Esto ya fue completado."],
      effects: cfg.steps[cfg.steps.length - 1]?.effectsOnDone ?? undefined,
    });
  }

  const step = cfg.steps[stepIndex];

  // init: sin input -> prompt actual
  if (!input) {
    if (!progress) {
      await upsertPuzzleProgress(session.userId, packId, puzzleId, { step: 0, solved: false });
    }
    return NextResponse.json<Res>({
      ok: true,
      messages: [step?.prompt ?? "—"],
    });
  }

  // validar step
  if (!step) {
    // algo se desfasó: marcamos solved para no loop infinito
    await upsertPuzzleProgress(session.userId, packId, puzzleId, { solved: true, step: cfg.steps.length });
    return NextResponse.json<Res>({ ok: true, done: true, messages: ["Secuencia completada."] });
  }

  const isOk = step.check(input);

  if (!isOk) {
    return NextResponse.json<Res>({
      ok: false,
      messages: step.badMessages,
    });
  }

  const nextStepIndex = stepIndex + 1;
  const isLast = nextStepIndex >= cfg.steps.length;

  if (!isLast) {
    await upsertPuzzleProgress(session.userId, packId, puzzleId, { step: nextStepIndex, solved: false });

    return NextResponse.json<Res>({
      ok: true,
      done: false,
      messages: [...step.okMessages, cfg.steps[nextStepIndex].prompt],
    });
  }

  // último paso: solved + level up
  await upsertPuzzleProgress(session.userId, packId, puzzleId, {
    step: nextStepIndex,
    solved: true,
    solvedAt: (await import("@/lib/firebaseAdmin")).FieldValue.serverTimestamp(),
  });

  let levelUp: Res["levelUp"] | undefined;
  if (level < cfg.successLevel) {
    await setUserLevel(session.userId, String(cfg.successLevel));
    levelUp = { from: level, to: cfg.successLevel };
  }

  return NextResponse.json<Res>({
    ok: true,
    done: true,
    messages: step.okMessages,
    levelUp,
    effects: step.effectsOnDone,
  });
}
