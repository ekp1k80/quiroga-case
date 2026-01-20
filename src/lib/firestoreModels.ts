// src\lib\firestoreModels.ts
import { STORY_FLOW, StoryNode, storyReached } from "@/data/levels";
import { db, FieldValue } from "./firebaseAdmin";
import { ProgressPatch } from "@/data/puzzles/puzzleFlows";

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