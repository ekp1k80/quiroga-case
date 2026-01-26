import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebaseAdmin";

import { getSessionIdFromCookie } from "@/lib/sessionCookie";
import { getSession, getUser, touchSession, applyProgressPatch } from "@/lib/firestoreModels";

import { scoreQr3Answers } from "@/data/finalQr3Quiz.answers.server";
import { QR3_PASS_SCORE } from "@/data/finalQr3Quiz.public";

import { markQr3GroupDoneIfCorrect } from "@/lib/rtdbPlaySession";

type SubmitBody = {
  playSessionId: string;
  answers: Record<string, string>;
};

function findGroupIdForUser(
  groups: Record<string, { playerIds?: string[] }> | undefined,
  userId: string
): { groupId: string; playerIds: string[] } | null {
  if (!groups) return null;

  for (const [gid, g] of Object.entries(groups)) {
    const ids = Array.isArray(g.playerIds) ? g.playerIds : [];
    if (ids.includes(userId)) return { groupId: gid, playerIds: ids };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    // --- auth ---
    const sessionId = await getSessionIdFromCookie();
    if (!sessionId) return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });

    const session = await getSession(sessionId);
    if (!session || session.revoked) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }

    await touchSession(sessionId);

    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ ok: false, error: "No user" }, { status: 401 });

    // --- input ---
    const body = (await req.json()) as SubmitBody;
    const { playSessionId, answers } = body;

    if (!playSessionId || typeof playSessionId !== "string") {
      return NextResponse.json({ ok: false, error: "Missing playSessionId" }, { status: 400 });
    }
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ ok: false, error: "Missing answers" }, { status: 400 });
    }

    // --- rtdb: leer playSession (shape actual) ---
    const snap = await rtdb().ref(`playSessions/${playSessionId}`).get();
    const state = snap.val() as
      | {
          phase?: "lobby" | "running" | "done";
          qr3?: {
            groups?: Record<
              string,
              {
                idx?: number;
                playerIds?: string[];
                status?: "active" | "done";
                score?: number;
                rank?: number;
              }
            >;
          };
        }
      | null;

    if (!state) return NextResponse.json({ ok: false, error: "PlaySession not found" }, { status: 404 });
    if (state.phase !== "running") {
      return NextResponse.json({ ok: false, error: "PlaySession not running" }, { status: 409 });
    }

    const found = findGroupIdForUser(state.qr3?.groups, user.id);
    if (!found) return NextResponse.json({ ok: false, error: "User has no group" }, { status: 409 });

    const { groupId, playerIds } = found;
    if (playerIds.length < 3) {
      return NextResponse.json({ ok: false, error: "Invalid group" }, { status: 409 });
    }

    // --- score server-only ---
    const score = scoreQr3Answers(answers);

    // --- marcar done en RTDB (y posiblemente phase done si allDone) ---
    const res = await markQr3GroupDoneIfCorrect({
      playSessionId,
      groupId,
      userId: user.id,
      score,
      passScore: QR3_PASS_SCORE,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error ?? "Submit failed" }, { status: 500 });
    }

    // --- si el grupo terminó, avanzar storyNode de TODO el grupo en Firestore ---
    let advanced: { from: string; to: string } | undefined;

    if (res.done) {
      // Avanza a todos, usando tu helper existente.
      // applyProgressPatch ya evita retroceso por storyReached().
      await Promise.all(
        playerIds.map((uid) =>
          applyProgressPatch(uid as any, "qr3" as any, {
            storyNode: "hector-mom-final-call" as any,
          })
        )
      );

      // advanced solo para el caller (útil para UI)
      if (user.storyNode === "qr3") {
        advanced = { from: "qr3", to: "hector-mom-final-call" };
      }
    }

    return NextResponse.json(
      {
        ok: true,
        groupId,
        score,
        done: Boolean(res.done),
        allDone: Boolean((res as any).allDone),
        advanced,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
