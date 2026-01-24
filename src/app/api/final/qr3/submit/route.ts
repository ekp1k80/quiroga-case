import { NextResponse } from "next/server";
import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, getFinalPlaySessionState, markFinalGroupDone } from "@/lib/firestoreModels";
import { QR3_FINAL_QUIZ, scoreAnswers, type Qr3FinalQuizAnswers } from "@/data/final/qr3FinalQuiz";

type Body = {
  answers: Qr3FinalQuizAnswers; // questionId -> choiceId
};

export async function POST(req: Request) {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session || session.revoked) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  const user = await getUser(session.userId);
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  if ((user.storyNode as any) !== "qr3") {
    return NextResponse.json({ ok: false, error: "Not in qr3" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const answers = body?.answers ?? {};
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ ok: false, error: "Missing answers" }, { status: 400 });
  }

  const state = await getFinalPlaySessionState("qr3" as any);
  if (!state) return NextResponse.json({ ok: false, error: "Session missing" }, { status: 404 });

  const player = state.players.find((p) => p.userId === user.id);
  if (!player) return NextResponse.json({ ok: false, error: "Not joined" }, { status: 400 });
  if (!player.groupId) return NextResponse.json({ ok: false, error: "No group yet" }, { status: 400 });

  const group = state.groups.find((g) => g.id === player.groupId);
  if (!group) return NextResponse.json({ ok: false, error: "Group not found" }, { status: 404 });

  // ✅ Validación: por choiceId, no por strings.
  // Aseguramos que cada answer sea uno de los ids válidos para esa pregunta.
  for (const q of QR3_FINAL_QUIZ.questions) {
    const choiceId = answers[q.id];
    if (typeof choiceId !== "string") {
      return NextResponse.json({ ok: false, error: `Missing answer for ${q.id}` }, { status: 400 });
    }
    const ok = q.choices.some((c) => c.id === choiceId);
    if (!ok) {
      return NextResponse.json({ ok: false, error: `Invalid choice for ${q.id}` }, { status: 400 });
    }
  }

  const score = scoreAnswers(answers);
  const passed = score >= QR3_FINAL_QUIZ.threshold;

  if (!passed) {
    return NextResponse.json({
      ok: true,
      passed: false,
      score,
      threshold: QR3_FINAL_QUIZ.threshold,
    });
  }

  // ✅ Marcar grupo como done, rank por orden de finalización
  await markFinalGroupDone({ storyNode: "qr3" as any, groupId: group.id, score });

  return NextResponse.json({
    ok: true,
    passed: true,
    score,
    threshold: QR3_FINAL_QUIZ.threshold,
  });
}
