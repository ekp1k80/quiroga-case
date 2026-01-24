// src\lib\firestoreModels.ts
import { STORY_FLOW, StoryNode, storyReached } from "@/data/levels";
import { db, FieldValue } from "./firebaseAdmin";
import { ProgressPatch } from "@/data/puzzles/puzzleFlows";
import { QR3_FINAL_QUIZ } from "@/data/final/qr3FinalQuiz";

export type TemporalCodeDoc = {
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  hardValid: boolean;
};

export type SessionDoc = {
  userId: string;
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  lastSeenAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  revoked?: boolean;
};

export type UserDoc = {
  name: string;

  // ✅ nuevo
  storyNode: StoryNode;

  // ✅ opcional (para guiños / accesos sin avanzar historia)
  flags?: string[];
  tags?: string[];

  // 🧯 legacy (opcional por migración; podés remover luego)
  level?: string;

  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
};

const DEFAULT_STORY_NODE: StoryNode = STORY_FLOW[0].name;

// Si querés mapear level num viejo a un story node, podés hacer algo mejor.
// Por ahora: si hay level viejo pero no storyNode, caés al default.
function normalizeUserDoc(raw: any): UserDoc {
  const storyNode =
    (raw?.storyNode as StoryNode) ??
    DEFAULT_STORY_NODE;

  return {
    ...raw,
    storyNode,
    flags: Array.isArray(raw?.flags) ? raw.flags : [],
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
  } as UserDoc;
}

export async function createTemporalCode(code: string, hardValid: boolean) {
  const ref = db().collection("temporalCodes").doc(code);
  const doc: TemporalCodeDoc = {
    createdAt: FieldValue.serverTimestamp(),
    hardValid,
  };
  await ref.set(doc);
}

export async function getTemporalCode(code: string) {
  const ref = db().collection("temporalCodes").doc(code);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as TemporalCodeDoc;
}

export function isTemporalCodeValid(
  doc: TemporalCodeDoc,
  nowMs = Date.now(),
  maxAgeMs = 10 * 60 * 1000
) {
  if (doc.hardValid) return true;

  const createdAt = doc.createdAt as any;
  const createdMs =
    typeof createdAt?.toMillis === "function"
      ? createdAt.toMillis()
      : null;

  // Si todavía no resolvió el serverTimestamp (caso raro), lo consideramos inválido
  if (!createdMs) return false;

  return nowMs - createdMs <= maxAgeMs;
}

export async function createUser(userId: string, name: string) {
  const ref = db().collection("users").doc(userId);
  const now = FieldValue.serverTimestamp();

  const doc: Partial<UserDoc> = {
    name: name?.trim() || "Jugador",
    storyNode: DEFAULT_STORY_NODE,
    flags: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc, { merge: true });
}

export async function updateUserName(userId: string, name: string) {
  const ref = db().collection("users").doc(userId);
  await ref.set(
    {
      name: name.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUser(userId: string) {
  const snap = await db().collection("users").doc(userId).get();
  if (!snap.exists) return null;

  const data = snap.data() as any;
  const normalized = normalizeUserDoc({ id: snap.id, ...data });

  return normalized as UserDoc & { id: string };
}

export async function setUserStoryNode(userId: string, storyNode: StoryNode) {
  const ref = db().collection("users").doc(userId);
  await ref.set(
    {
      storyNode,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// Helpers opcionales (flags/tags)
export async function addUserFlag(userId: string, flag: string) {
  const ref = db().collection("users").doc(userId);
  await ref.set(
    {
      flags: FieldValue.arrayUnion(flag),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function addUserTag(userId: string, tag: string) {
  const ref = db().collection("users").doc(userId);
  await ref.set(
    {
      tags: FieldValue.arrayUnion(tag),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function applyProgressPatch(
  userId: string,
  currentStoryNode: StoryNode,
  patch?: ProgressPatch
) {
  if (!patch) return;

  const ref = db().collection("users").doc(userId);

  const update: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Avanzar historia: nunca retroceder
  if (patch.storyNode && storyReached(patch.storyNode, currentStoryNode)) {
    update.storyNode = patch.storyNode;
  }

  if (patch.addFlags?.length) update.flags = FieldValue.arrayUnion(...patch.addFlags);
  if (patch.addTags?.length) update.tags = FieldValue.arrayUnion(...patch.addTags);

  // Si no hay nada para actualizar (solo updatedAt), igual es ok, pero si querés evitá el write.
  await ref.set(update, { merge: true });
}

export async function createSession(sessionId: string, userId: string) {
  const ref = db().collection("sessions").doc(sessionId);
  const now = FieldValue.serverTimestamp();

  const doc: SessionDoc = {
    userId,
    createdAt: now,
    lastSeenAt: now,
    revoked: false,
  };

  await ref.set(doc);
}

export async function getSession(sessionId: string) {
  const snap = await db().collection("sessions").doc(sessionId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as SessionDoc & { id: string };
}

export async function touchSession(sessionId: string) {
  const ref = db().collection("sessions").doc(sessionId);
  await ref.set({ lastSeenAt: FieldValue.serverTimestamp() }, { merge: true });
}

export type PuzzleProgressDoc = {
  packId: string;
  puzzleId: string;
  step: number; // 0-based
  solved?: boolean;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  solvedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
};

function progressDocId(packId: string, puzzleId: string) {
  return `${packId}__${puzzleId}`;
}

export async function getPuzzleProgress(userId: string, packId: string, puzzleId: string) {
  const ref = db()
    .collection("users")
    .doc(userId)
    .collection("puzzleProgress")
    .doc(progressDocId(packId, puzzleId));

  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as PuzzleProgressDoc & { id: string };
}

export async function upsertPuzzleProgress(
  userId: string,
  packId: string,
  puzzleId: string,
  patch: Partial<PuzzleProgressDoc>
) {
  const ref = db()
    .collection("users")
    .doc(userId)
    .collection("puzzleProgress")
    .doc(progressDocId(packId, puzzleId));

  await ref.set(
    {
      packId,
      puzzleId,
      updatedAt: FieldValue.serverTimestamp(),
      ...patch,
    },
    { merge: true }
  );
}

// lib/firestoreModels.ts (agregar al final)

export type QrClaimDoc = {
  code: string;
  claimedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  packId?: string;
  meta?: any;
};

export async function getQrClaim(userId: string, code: string) {
  const ref = db().collection("users").doc(userId).collection("qrClaims").doc(code);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as QrClaimDoc & { id: string };
}

export async function createQrClaim(userId: string, code: string, patch?: Partial<QrClaimDoc>) {
  const ref = db().collection("users").doc(userId).collection("qrClaims").doc(code);
  await ref.set(
    {
      code,
      claimedAt: FieldValue.serverTimestamp(),
      ...patch,
    },
    { merge: true }
  );
}

// --- User submissions (persistente por usuario) ---

export type UserSubmissionDoc = {
  packId: string;
  puzzleId: string;
  payload: Record<string, any>;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
};

function submissionDocId(packId: string, puzzleId: string) {
  return `${packId}__${puzzleId}`;
}

export async function getUserSubmission(userId: string, packId: string, puzzleId: string) {
  const ref = db()
    .collection("users")
    .doc(userId)
    .collection("submissions")
    .doc(submissionDocId(packId, puzzleId));

  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as UserSubmissionDoc & { id: string };
}

/**
 * Guarda un campo de forma acumulativa:
 * payload["qr2.fecha_hecho"] = "..."
 *
 * Nota: usamos payload como flat map, es simple y estable.
 */
export async function upsertUserSubmissionField(
  userId: string,
  packId: string,
  puzzleId: string,
  fieldPath: string,
  value: any
) {
  if (!fieldPath?.trim()) return;

  const ref = db()
    .collection("users")
    .doc(userId)
    .collection("submissions")
    .doc(submissionDocId(packId, puzzleId));

  await ref.set(
    {
      packId,
      puzzleId,
      payload: { [fieldPath]: value },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function markUserSubmissionCompleted(userId: string, packId: string, puzzleId: string) {
  const ref = db()
    .collection("users")
    .doc(userId)
    .collection("submissions")
    .doc(submissionDocId(packId, puzzleId));

  await ref.set(
    {
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export type PlaySessionState = "open" | "locked" | "final";

export type PlaySessionDoc = {
  storyNode: string; // "qr3"
  state: PlaySessionState;

  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;

  lockedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;

  totalPlayers: number;
  totalGroups: number;
  doneGroups: number;

  threshold: number;
  totalQuestions: number;
};

export type PlaySessionPlayerDoc = {
  userId: string;   // en debug: es el debugPlayerId
  name: string;

  joinedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;

  groupId?: string | null;
  groupIndex?: number | null;
};

export type PlaySessionGroupDoc = {
  index: number; // 1..G
  state: "active" | "done";

  memberUserIds: string[];

  score?: number | null;

  finishedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  rank?: number | null;
};

function playSessionIdForNode(storyNode: string) {
  return `final__${storyNode}`;
}

function groupDocId(index: number) {
  return `g${String(index).padStart(2, "0")}`;
}

function computeGroupSizes(n: number): number[] {
  // grupos de 3, y el "resto" (1 o 2) se agrega al ÚLTIMO grupo
  // nunca grupo < 3
  if (n < 3) return [];
  const base = Math.floor(n / 3);
  const rem = n % 3;

  if (rem === 0) {
    return Array.from({ length: base }, () => 3);
  }

  // rem 1 o 2: mantenemos base-1 grupos de 3, y el último se queda con 3+rem
  // Ej:
  // n=4 => base=1 rem=1 => [4]
  // n=5 => [5]
  // n=7 => base=2 rem=1 => [3,4]
  // n=8 => [3,5]
  // n=10 => [3,3,4]
  // n=11 => [3,3,5]
  if (base === 1) return [3 + rem];

  const out: number[] = [];
  for (let i = 0; i < base - 1; i++) out.push(3);
  out.push(3 + rem);
  return out;
}

export async function ensurePlaySession(storyNode: string) {
  const sid = playSessionIdForNode(storyNode);
  const ref = db().collection("playSessions").doc(sid);
  const snap = await ref.get();

  if (snap.exists) return { id: snap.id, ...(snap.data() as any) } as PlaySessionDoc & { id: string };

  const now = FieldValue.serverTimestamp();
  const doc: PlaySessionDoc = {
    storyNode,
    state: "open",
    createdAt: now,
    updatedAt: now,
    totalPlayers: 0,
    totalGroups: 0,
    doneGroups: 0,
    threshold: QR3_FINAL_QUIZ.threshold,
    totalQuestions: QR3_FINAL_QUIZ.questions.length,
  };

  await ref.set(doc, { merge: true });
  const created = await ref.get();
  return { id: created.id, ...(created.data() as any) } as PlaySessionDoc & { id: string };
}

export async function joinPlaySessionDebug(opts: { storyNode: string; userId: string; name: string }) {
  const { storyNode, userId, name } = opts;
  const sid = playSessionIdForNode(storyNode);

  const sessionRef = db().collection("playSessions").doc(sid);
  const playerRef = sessionRef.collection("players").doc(userId);

  await db().runTransaction(async (tx) => {
    const sesSnap = await tx.get(sessionRef);
    if (!sesSnap.exists) {
      const now = FieldValue.serverTimestamp();
      tx.set(
        sessionRef,
        {
          storyNode,
          state: "open",
          createdAt: now,
          updatedAt: now,
          totalPlayers: 0,
          totalGroups: 0,
          doneGroups: 0,
          threshold: QR3_FINAL_QUIZ.threshold,
          totalQuestions: QR3_FINAL_QUIZ.questions.length,
        } satisfies PlaySessionDoc,
        { merge: true }
      );
    }

    const ses = (sesSnap.exists ? (sesSnap.data() as any) : null) as PlaySessionDoc | null;
    if (ses?.state && ses.state !== "open") {
      // sesión cerrada: no entra nadie nuevo (regla)
      throw new Error("La sesión ya comenzó (locked).");
    }

    const plSnap = await tx.get(playerRef);
    if (plSnap.exists) {
      // ya está unido: no duplicar
      tx.set(sessionRef, { updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }

    tx.set(
      playerRef,
      {
        userId,
        name: name?.trim() || "Jugador",
        joinedAt: FieldValue.serverTimestamp(),
        groupId: null,
        groupIndex: null,
      } satisfies PlaySessionPlayerDoc,
      { merge: true }
    );

    tx.set(
      sessionRef,
      {
        totalPlayers: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function lockAndCreateGroupsIfReady(opts: { storyNode: string }) {
  const { storyNode } = opts;
  const sid = playSessionIdForNode(storyNode);

  const sessionRef = db().collection("playSessions").doc(sid);
  const playersCol = sessionRef.collection("players");
  const groupsCol = sessionRef.collection("groups");

  await db().runTransaction(async (tx) => {
    const sesSnap = await tx.get(sessionRef);
    if (!sesSnap.exists) return;
    const ses = sesSnap.data() as any as PlaySessionDoc;

    if (ses.state !== "open") return;

    // Traemos jugadores dentro de la tx (limitado pero ok para debug)
    const playersSnap = await tx.get(playersCol);
    const players = playersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Array<
      PlaySessionPlayerDoc & { id: string }
    >;

    const n = players.length;
    if (n < 3) return;

    // ✅ lock: ya no entra nadie, y creamos grupos YA (sin pausa)
    const sizes = computeGroupSizes(n);
    if (!sizes.length) return;

    // ordenar por joinedAt (si falta resolved timestamp, por id)
    players.sort((a, b) => {
      const am = (a.joinedAt as any)?.toMillis?.() ?? 0;
      const bm = (b.joinedAt as any)?.toMillis?.() ?? 0;
      if (am !== bm) return am - bm;
      return a.id.localeCompare(b.id);
    });

    let cursor = 0;
    const groupIds: string[] = [];

    for (let i = 0; i < sizes.length; i++) {
      const groupIndex = i + 1;
      const size = sizes[i];
      const slice = players.slice(cursor, cursor + size);
      cursor += size;

      const gid = groupDocId(groupIndex);
      groupIds.push(gid);

      tx.set(
        groupsCol.doc(gid),
        {
          index: groupIndex,
          state: "active",
          memberUserIds: slice.map((p) => p.userId),
          score: null,
          finishedAt: null,
          rank: null,
        } satisfies PlaySessionGroupDoc,
        { merge: true }
      );

      for (const p of slice) {
        tx.set(
          playersCol.doc(p.userId),
          { groupId: gid, groupIndex },
          { merge: true }
        );
      }
    }

    tx.set(
      sessionRef,
      {
        state: "locked",
        lockedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        totalPlayers: n,
        totalGroups: sizes.length,
        doneGroups: 0,
        threshold: QR3_FINAL_QUIZ.threshold,
        totalQuestions: QR3_FINAL_QUIZ.questions.length,
      },
      { merge: true }
    );
  });
}

export async function getFinalPlaySessionState(storyNode: string) {
  const sid = playSessionIdForNode(storyNode);
  const sessionRef = db().collection("playSessions").doc(sid);

  const sesSnap = await sessionRef.get();
  if (!sesSnap.exists) return null;

  const [playersSnap, groupsSnap] = await Promise.all([
    sessionRef.collection("players").get(),
    sessionRef.collection("groups").get(),
  ]);

  const session = { id: sesSnap.id, ...(sesSnap.data() as any) } as PlaySessionDoc & { id: string };

  const players = playersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Array<
    PlaySessionPlayerDoc & { id: string }
  >;

  const groups = groupsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Array<
    PlaySessionGroupDoc & { id: string }
  >;

  // orden estable
  groups.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  return { session, players, groups };
}

export async function markFinalGroupDone(opts: { storyNode: string; groupId: string; score: number }) {
  const { storyNode, groupId, score } = opts;
  const sid = playSessionIdForNode(storyNode);

  const sessionRef = db().collection("playSessions").doc(sid);
  const groupRef = sessionRef.collection("groups").doc(groupId);

  await db().runTransaction(async (tx) => {
    const sesSnap = await tx.get(sessionRef);
    if (!sesSnap.exists) throw new Error("Session missing");
    const ses = sesSnap.data() as any as PlaySessionDoc;

    const gSnap = await tx.get(groupRef);
    if (!gSnap.exists) throw new Error("Group missing");
    const g = gSnap.data() as any as PlaySessionGroupDoc;

    if (g.state === "done") return;

    // rank = doneGroups + 1
    const nextRank = (ses.doneGroups ?? 0) + 1;

    tx.set(
      groupRef,
      {
        state: "done",
        score,
        finishedAt: FieldValue.serverTimestamp(),
        rank: nextRank,
      },
      { merge: true }
    );

    const newDone = nextRank;
    const total = ses.totalGroups ?? 0;
    const isFinal = total > 0 && newDone >= total;

    tx.set(
      sessionRef,
      {
        doneGroups: newDone,
        updatedAt: FieldValue.serverTimestamp(),
        ...(isFinal ? { state: "final" as const } : {}),
      },
      { merge: true }
    );
  });
}
