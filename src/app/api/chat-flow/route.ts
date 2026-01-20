// src/app/api/chat-flow/route.ts
import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import {
  getSession,
  getUser,
  touchSession,
  getPuzzleProgress,
  upsertPuzzleProgress,
  applyProgressPatch,
  upsertUserSubmissionField,
  markUserSubmissionCompleted,
} from "@/lib/firestoreModels";
import { canAccess } from "@/data/levels";
import { FieldValue } from "@/lib/firebaseAdmin";
import { PUZZLE_FLOWS } from "@/data/puzzles";
import { puzzleKey } from "@/data/puzzles/puzzleFlows";

type Req = { packId?: string; puzzleId?: string; input?: string };

type ResChoice = { id: string; label: string };

// ✅ Mensajes tipados: texto o referencia a un archivo del pack
type ApiMsg = string | { type: "packFile"; fileId: string; caption?: string };

type Res = {
  ok: boolean;
  messages: ApiMsg[];
  blocked?: boolean;
  done?: boolean;
  effects?: Record<string, any>;
  choices?: ResChoice[];
  error?: string;
  debug?: any;
};

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

function stepChoices(step: any): ResChoice[] | undefined {
  if (!step?.choices || !Array.isArray(step.choices) || step.choices.length === 0) return undefined;
  return step.choices.map((c: any) => ({ id: String(c.id), label: String(c.label) }));
}

function toApiMsgs(x: any): ApiMsg[] {
  if (!x) return ["—"];
  if (Array.isArray(x)) return x as ApiMsg[];
  return [x as ApiMsg];
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

  const rawInput = (body.input ?? "").trim();
  const input = norm(rawInput);

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

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json<Res>({ ok: false, messages: [], error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) {
    return NextResponse.json<Res>({ ok: false, messages: [], error: "Invalid session" }, { status: 401 });
  }
  await touchSession(sessionId);

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json<Res>({ ok: false, messages: [], error: "No user" }, { status: 404 });

  const playerProgress = {
    storyNode: user.storyNode,
    flags: user.flags ?? [],
    tags: user.tags ?? [],
  };

  if (!canAccess(playerProgress, cfg.requires ?? null)) {
    return NextResponse.json<Res>({
      ok: false,
      blocked: true,
      messages: [cfg.blockedMessage],
    });
  }

  const progress = await getPuzzleProgress(session.userId, packId, puzzleId);
  const stepIndex = progress?.step ?? 0;
  const solved = !!progress?.solved;

  if (solved) {
    const lastStep = cfg.steps[cfg.steps.length - 1];
    return NextResponse.json<Res>({
      ok: true,
      done: true,
      messages: ["Esto ya fue completado."],
      effects: lastStep?.effectsOnDone ?? undefined,
      choices: undefined,
    });
  }

  const step = cfg.steps[stepIndex];

  // init
  if (!rawInput) {
    if (!progress) {
      await upsertPuzzleProgress(session.userId, packId, puzzleId, { step: 0, solved: false });
    }
    return NextResponse.json<Res>({
      ok: true,
      messages: toApiMsgs(step?.prompt),
      choices: stepChoices(step),
    });
  }

  if (!step) {
    await upsertPuzzleProgress(session.userId, packId, puzzleId, { solved: true, step: cfg.steps.length });
    await markUserSubmissionCompleted(session.userId, packId, puzzleId);
    return NextResponse.json<Res>({ ok: true, done: true, messages: ["Secuencia completada."], choices: undefined });
  }

  // ✅ Caso A: step con choices + choiceReplies
  if (step.choices?.length && step.choiceReplies) {
    const reply = step.choiceReplies?.[input];

    if (!reply) {
      return NextResponse.json<Res>({
        ok: false,
        messages: step.badMessages?.length ? step.badMessages : ["Elegí una opción válida."],
        choices: stepChoices(step),
      });
    }

    const saveField = step.effectsOnDone?.saveField;
    if (saveField) {
      await upsertUserSubmissionField(session.userId, packId, puzzleId, saveField, input);
    }

    const advance = reply.advance === true;

    if (!advance) {
      return NextResponse.json<Res>({
        ok: true,
        done: false,
        messages: reply.messages,
        choices: stepChoices(step),
      });
    }

    const nextStepIndex = stepIndex + 1;
    const isLast = nextStepIndex >= cfg.steps.length;

    if (!isLast) {
      await upsertPuzzleProgress(session.userId, packId, puzzleId, { step: nextStepIndex, solved: false });

      const next = cfg.steps[nextStepIndex];
      return NextResponse.json<Res>({
        ok: true,
        done: false,
        messages: [...reply.messages, ...toApiMsgs(next?.prompt)],
        choices: stepChoices(next),
      });
    }

    await upsertPuzzleProgress(session.userId, packId, puzzleId, {
      step: nextStepIndex,
      solved: true,
      solvedAt: FieldValue.serverTimestamp(),
    });

    await markUserSubmissionCompleted(session.userId, packId, puzzleId);
    await applyProgressPatch(session.userId, user.storyNode, cfg.onSuccess);

    return NextResponse.json<Res>({
      ok: true,
      done: true,
      messages: reply.messages,
      effects: step.effectsOnDone,
      choices: undefined,
    });
  }

  // ✅ Caso B: step texto libre
  const isOk = step.check(input);

  if (!isOk) {
    return NextResponse.json<Res>({
      ok: false,
      messages: step.badMessages,
      choices: stepChoices(step),
    });
  }

  const saveField = step.effectsOnDone?.saveField;
  if (saveField) {
    // guardamos rawInput (no normalized) para no perder formato
    await upsertUserSubmissionField(session.userId, packId, puzzleId, saveField, rawInput);
  }

  const nextStepIndex = stepIndex + 1;
  const isLast = nextStepIndex >= cfg.steps.length;

  if (!isLast) {
    await upsertPuzzleProgress(session.userId, packId, puzzleId, { step: nextStepIndex, solved: false });

    const next = cfg.steps[nextStepIndex];
    return NextResponse.json<Res>({
      ok: true,
      done: false,
      messages: [...step.okMessages, ...toApiMsgs(next?.prompt)],
      choices: stepChoices(next),
    });
  }

  await upsertPuzzleProgress(session.userId, packId, puzzleId, {
    step: nextStepIndex,
    solved: true,
    solvedAt: FieldValue.serverTimestamp(),
  });

  await markUserSubmissionCompleted(session.userId, packId, puzzleId);
  await applyProgressPatch(session.userId, user.storyNode, cfg.onSuccess);

  return NextResponse.json<Res>({
    ok: true,
    done: true,
    messages: step.okMessages,
    effects: step.effectsOnDone,
    choices: undefined,
  });
}
