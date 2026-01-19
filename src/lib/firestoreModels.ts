import { db, FieldValue } from "./firebaseAdmin";

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
  level: string; // "1", "2", etc.
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
};

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

  const doc: UserDoc = {
    name: name?.trim() || "Jugador",
    level: "1",
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
  return { id: snap.id, ...(snap.data() as any) } as UserDoc & { id: string };
}

export async function setUserLevel(userId: string, level: string) {
  const ref = db().collection("users").doc(userId);
  await ref.set(
    {
      level,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
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
