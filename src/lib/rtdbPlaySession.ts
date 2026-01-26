// src/lib/rtdbPlaySession.ts
import { rtdb } from "@/lib/firebaseAdmin";

/**
 * RTDB schema (mínimo, final):
 *
 * playSessionsByCode/{TEMPORAL_CODE} = { playSessionId, createdAt }
 *
 * playSessions/{playSessionId} = {
 *   code: string,
 *   createdAt: number,
 *   phase: "lobby" | "running" | "done",
 *   startedAt?: number,
 *   lockedAt?: number,
 *   players: {
 *     [userId]: { name: string, joinedAt: number }
 *   },
 *
 *   // ✅ final puzzle (qr3) incremental, NO espera a todos:
 *   qr3?: {
 *     present?: { [userId]: { name: string, at: number } },  // llegó a qr3
 *     groups?: {
 *       [groupId]: {
 *         idx: number,
 *         playerIds: string[],
 *         status: "active" | "done",
 *         score?: number,
 *         finishedAt?: number,
 *         rank?: number,
 *         lastSubmittedBy?: string,
 *         lastSubmittedAt?: number
 *       }
 *     }
 *   },
 *
 *   winner?: { groupId: string, finishedAt: number },
 *   allDoneAt?: number
 * }
 */

function nowMs() {
  return Date.now();
}

function newPlaySessionId() {
  return `ps_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

/**
 * ✅ Atómico: 1 playSessionId por code aun con concurrencia.
 * El code NO es igual al playSessionId.
 */
export async function ensureRtdbPlaySession(
  codeRaw: string
): Promise<{ code: string; playSessionId: string }> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) throw new Error("code requerido");

  const byCodeRef = rtdb().ref(`playSessionsByCode/${code}`);

  // 1) transaction: si existe, lo reutiliza; si no, crea playSessionId
  const tx = await byCodeRef.transaction((cur: any) => {
    if (cur?.playSessionId) return cur;
    return { playSessionId: newPlaySessionId(), createdAt: nowMs() };
  });

  if (!tx.committed) throw new Error("No se pudo asegurar playSession (tx abortada)");

  const val = tx.snapshot.val() as { playSessionId: string };
  const playSessionId = val.playSessionId;

  // 2) crear doc de sesión si falta (idempotente)
  const sessionRef = rtdb().ref(`playSessions/${playSessionId}`);
  const snap = await sessionRef.get();

  if (!snap.exists()) {
    await sessionRef.set({
      code,
      createdAt: nowMs(),
      phase: "lobby",
      players: {},
      qr3: { present: {}, groups: {} },
    });
  } else {
    const cur = snap.val() as any;
    // asegurar mínimos (sin romper)
    if (!cur?.code) await sessionRef.child("code").set(code);
    if (!cur?.createdAt) await sessionRef.child("createdAt").set(nowMs());
    if (!cur?.phase) await sessionRef.child("phase").set("lobby");
    if (!cur?.players) await sessionRef.child("players").set({});
    if (!cur?.qr3) await sessionRef.child("qr3").set({ present: {}, groups: {} });
    else {
      if (!cur.qr3.present) await sessionRef.child("qr3/present").set({});
      if (!cur.qr3.groups) await sessionRef.child("qr3/groups").set({});
    }
  }

  return { code, playSessionId };
}

/**
 * Lobby inicial (admin aún no dio Play).
 * - NO permite late join cuando phase != lobby.
 * - Idempotente (si refresca, no rompe).
 */
export async function addPlayerToPlaySession(playSessionId: string, userId: string, name: string) {
  if (!playSessionId) throw new Error("playSessionId requerido");
  if (!userId) throw new Error("userId requerido");

  const ref = rtdb().ref(`playSessions/${playSessionId}`);

  const phaseSnap = await ref.child("phase").get();
  const phase = phaseSnap.val() as string | null;
  if (phase && phase !== "lobby") {
    throw new Error("La sesión ya empezó (locked)");
  }

  const playerRef = ref.child(`players/${userId}`);
  const existing = (await playerRef.get()).val() as any;
  if (existing?.joinedAt) return;

  await playerRef.set({
    name: name?.trim() || "Jugador",
    joinedAt: nowMs(),
  });
}

/**
 * Admin "Play" del lobby inicial:
 * - setea phase=running y bloquea nuevos joins.
 * - NO crea grupos de qr3 (se crean al llegar a qr3, incremental).
 */
export async function adminStartPlaySession(playSessionId: string) {
  const ref = rtdb().ref(`playSessions/${playSessionId}`);

  const result = await ref.transaction((cur: any) => {
    if (!cur) return cur;
    if (cur.phase && cur.phase !== "lobby") return; // abort

    const playersObj = cur.players ?? {};
    const playerIds = Object.keys(playersObj);
    if (playerIds.length < 3) return; // abort (mínimo para jugar)

    cur.phase = "running";
    cur.startedAt = nowMs();
    cur.lockedAt = nowMs();

    // asegurar qr3
    cur.qr3 = cur.qr3 ?? { present: {}, groups: {} };
    cur.qr3.present = cur.qr3.present ?? {};
    cur.qr3.groups = cur.qr3.groups ?? {};

    return cur;
  });

  if (!result.committed) {
    throw new Error("No se pudo iniciar (falta mínimo o ya iniciada)");
  }

  return true;
}

export async function getPlaySessionState(playSessionId: string) {
  const snap = await rtdb().ref(`playSessions/${playSessionId}`).get();
  return snap.val();
}

/* =========================================================
   ✅ QR3 incremental groups (NO espera a todos)
   ========================================================= */

/**
 * Regla de tamaños (para “unassigned” en el momento):
 * - Base: grupos de 3
 * - Si N%3 == 1 o 2 => resto se agrega al ÚLTIMO grupo (queda 4 o 5)
 * - Nunca grupo < 3
 */
function computeGroupSizes(n: number) {
  // grupos de 3; si sobra 1 o 2, se agrega al ÚLTIMO grupo (4 o 5)
  if (n < 3) return [];
  const k = Math.floor(n / 3);
  const r = n % 3;

  if (r === 0) return Array.from({ length: k }, () => 3);
  if (k === 0) return [n]; // n=3,4,5
  const sizes = Array.from({ length: k }, () => 3);
  sizes[sizes.length - 1] = 3 + r; // último grupo 4 o 5
  return sizes;
}

function nextGroupId(idx: number) {
  return `g${idx}`;
}

/**
 * Marca al jugador como presente en QR3 y arma grupos cuando se pueda.
 * NO espera a que estén todos los jugadores del juego.
 */
export async function joinQr3AndMaybeGroup(opts: {
  playSessionId: string;
  userId: string;
  name: string;
}) {
  const { playSessionId, userId, name } = opts;
  const baseRef = rtdb().ref(`playSessions/${playSessionId}`);

  // guardrail: solo si el juego ya arrancó desde el lobby inicial
  const phaseSnap = await baseRef.child("phase").get();
  const phase = phaseSnap.val() as string | null;
  if (phase !== "running") {
    throw new Error("La sesión todavía no está en running (esperá el Play del inicio).");
  }

  // transacción: set presencia + (re)calcular grupos con los presentes actuales
  const res = await baseRef.child("qr3").transaction((cur: any) => {
    cur = cur ?? {};

    cur.present = cur.present ?? {};
    cur.groups = cur.groups ?? {};

    // 1) presencia (idempotente)
    if (!cur.present[userId]) {
      cur.present[userId] = { name: name.trim() || "Jugador", at: nowMs() };
    }

    // 2) si ya está en algún grupo, no rehacemos nada (estabilidad)
    const alreadyInGroup = Object.values(cur.groups).some((g: any) =>
      Array.isArray(g?.playerIds) && g.playerIds.includes(userId)
    );
    if (alreadyInGroup) return cur;

    // 3) lista de presentes ordenada por llegada
    const presentIds = Object.entries(cur.present)
      .map(([uid, v]: any) => ({ uid, at: v?.at ?? 0 }))
      .sort((a, b) => a.at - b.at)
      .map((x) => x.uid);

    if (presentIds.length < 3) return cur;

    // 4) NO tocamos grupos ya creados (para no reshufflear). Solo agregamos NUEVOS grupos completos.
    // calculamos cuántos jugadores ya están asignados en groups:
    const assigned = new Set<string>();
    for (const g of Object.values(cur.groups)) {
      const ids: string[] = Array.isArray((g as any).playerIds) ? (g as any).playerIds : [];
      ids.forEach((id) => assigned.add(id));
    }

    const unassigned = presentIds.filter((id) => !assigned.has(id));
    if (unassigned.length < 3) return cur;

    // Creamos grupos NUEVOS solo con los unassigned disponibles:
    // - armamos bloques de 3, y si el resto final es 1 o 2, se lo agregamos al último grupo nuevo.
    const sizes = computeGroupSizes(unassigned.length);
    if (!sizes.length) return cur;

    // idx base = cantidad de grupos existentes + 1
    const existingCount = Object.keys(cur.groups).length;
    let offset = 0;

    sizes.forEach((sz, i) => {
      const ids = unassigned.slice(offset, offset + sz);
      offset += sz;

      // solo crear si el grupo tiene >=3 (por computeGroupSizes ya se cumple)
      if (ids.length >= 3) {
        const idx = existingCount + i + 1;
        const gid = nextGroupId(idx);
        cur.groups[gid] = {
          idx,
          playerIds: ids,
          status: "active",
        };
      }
    });

    return cur;
  });

  if (!res.committed) throw new Error("No se pudo registrar en qr3.");

  return { ok: true };
}

export async function getMyQr3Group(playSessionId: string, userId: string) {
  const snap = await rtdb().ref(`playSessions/${playSessionId}/qr3/groups`).get();
  const groups = (snap.val() ?? {}) as Record<string, any>;

  for (const [groupId, g] of Object.entries(groups)) {
    const ids: string[] = Array.isArray((g as any).playerIds) ? (g as any).playerIds : [];
    if (ids.includes(userId)) return { groupId, group: g };
  }
  return null;
}

export async function findMyQr3Group(playSessionId: string, userId: string) {
  const snap = await rtdb().ref(`playSessions/${playSessionId}/qr3/groups`).get();
  const groups = (snap.val() ?? {}) as Record<string, any>;

  for (const [groupId, g] of Object.entries(groups)) {
    const ids: string[] = Array.isArray((g as any).playerIds) ? (g as any).playerIds : [];
    if (ids.includes(userId)) return { groupId, group: g };
  }

  return null;
}

/**
 * ✅ Submit por grupo (QR3):
 * - Guarda lastSubmittedBy/At + score (permite reintentos).
 * - Si pasa passScore y el grupo estaba active -> lo marca done una sola vez.
 * - Recalcula ranks (por finishedAt asc).
 * - Cuando TODOS los grupos creados hasta ese momento están done => phase done + allDoneAt.
 *
 * Nota: "todos los grupos" acá son los grupos de qr3 existentes, no “todos los players del juego”.
 * Esto encaja con tu diseño de que la competencia es por llegar primero y armar grupo primero.
 */
export async function markQr3GroupDoneIfCorrect(opts: {
  playSessionId: string;
  groupId: string;
  userId: string;
  score: number;
  passScore: number;
}) {
  const { playSessionId, groupId, userId, score, passScore } = opts;

  const sessionRef = rtdb().ref(`playSessions/${playSessionId}`);
  const groupRef = sessionRef.child(`qr3/groups/${groupId}`);

  const submitAt = nowMs();

  // 1) update grupo (atómico)
  const doneRes = await groupRef.transaction((cur: any) => {
    if (!cur) return cur;

    // ya terminó: solo reflejamos submit “visual”? (lo dejamos quieto)
    if (cur.status === "done") return cur;

    cur.lastSubmittedBy = userId;
    cur.lastSubmittedAt = submitAt;
    cur.score = score;

    if (score >= passScore) {
      cur.status = "done";
      cur.finishedAt = submitAt;
    } else {
      cur.status = "active";
    }

    return cur;
  });

  if (!doneRes.committed) {
    return { ok: false, error: "No se pudo guardar submit" };
  }

  const updated = doneRes.snapshot.val() as any;
  if (updated?.status !== "done") {
    return { ok: true, done: false, score };
  }

  // 2) recalcular ranks + global (best-effort)
  const groupsSnap = await sessionRef.child("qr3/groups").get();
  const groups = (groupsSnap.val() ?? {}) as Record<string, any>;

  const finished = Object.entries(groups)
    .filter(([, g]) => g?.status === "done" && typeof g?.finishedAt === "number")
    .sort((a, b) => (a[1].finishedAt ?? 0) - (b[1].finishedAt ?? 0));

  const updates: Record<string, any> = {};

  finished.forEach(([gid], i) => {
    updates[`qr3/groups/${gid}/rank`] = i + 1;
  });

  if (finished.length > 0) {
    const [firstGid, firstG] = finished[0];
    updates["winner"] = { groupId: firstGid, finishedAt: firstG.finishedAt };
  }

  const allDone =
    Object.keys(groups).length > 0 &&
    Object.values(groups).every((g: any) => g?.status === "done");

  if (allDone) {
    updates["phase"] = "done";
    updates["allDoneAt"] = nowMs();
  }

  if (Object.keys(updates).length) {
    await sessionRef.update(updates);
  }

  return { ok: true, done: true, score, allDone };
}
