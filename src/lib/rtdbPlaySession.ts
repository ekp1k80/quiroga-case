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
 *   phase: "lobby" | "grouping" | "running" | "done",
 *   startedAt?: number,
 *   lockedAt?: number,
 *
 *   players: {
 *     [userId]: { name: string, joinedAt: number }
 *   },
 *
 *   grouping?: {
 *     groupSize: number,
 *     startedAt: number,
 *     endsAt: number
 *   },
 *
 *   groups?: {
 *     [groupId]: { idx: number, playerIds: string[] }
 *   },
 *
 *   // qr3 mantiene scoring/ranking
 *   qr3?: {
 *     present?: { [userId]: { name: string, at: number } },
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

type Phase = "lobby" | "grouping" | "running" | "done";

function nowMs() {
  return Date.now();
}

function newPlaySessionId() {
  return `ps_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function nextGroupId(idx: number) {
  return `g${idx}`;
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

  const tx = await byCodeRef.transaction((cur: any) => {
    if (cur?.playSessionId) return cur;
    return { playSessionId: newPlaySessionId(), createdAt: nowMs() };
  });

  if (!tx.committed) throw new Error("No se pudo asegurar playSession (tx abortada)");

  const val = tx.snapshot.val() as { playSessionId: string };
  const playSessionId = val.playSessionId;

  const sessionRef = rtdb().ref(`playSessions/${playSessionId}`);
  const snap = await sessionRef.get();

  if (!snap.exists()) {
    await sessionRef.set({
      code,
      createdAt: nowMs(),
      phase: "lobby" as Phase,
      players: {},
      groups: {},
      qr3: { present: {}, groups: {} },
    });
  } else {
    const cur = snap.val() as any;
    if (!cur?.code) await sessionRef.child("code").set(code);
    if (!cur?.createdAt) await sessionRef.child("createdAt").set(nowMs());
    if (!cur?.phase) await sessionRef.child("phase").set("lobby");
    if (!cur?.players) await sessionRef.child("players").set({});
    if (!cur?.groups) await sessionRef.child("groups").set({});
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
 * - Idempotente.
 */
export async function addPlayerToPlaySession(playSessionId: string, userId: string, name: string) {
  if (!playSessionId) throw new Error("playSessionId requerido");
  if (!userId) throw new Error("userId requerido");

  const ref = rtdb().ref(`playSessions/${playSessionId}`);

  const phaseSnap = await ref.child("phase").get();
  const phase = phaseSnap.val() as Phase | null;
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

/* =========================================================
   ✅ GROUPING (fase intermedia antes del juego)
   ========================================================= */

function clampInt(n: any, def: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return Math.trunc(x);
}

function formatGroupErr(msg: string) {
  return `No se pudieron crear grupos: ${msg}`;
}

/**
 * Computa cantidad de grupos g y tamaños:
 * - cada grupo entre [minSize..groupSize]
 * - suma = n
 * - g mínimo posible (para maximizar tamaño promedio)
 */
function computeGroupSizesGeneral(n: number, groupSize: number, minSize = 3) {
  if (n < minSize) return [];

  const minG = Math.ceil(n / groupSize);
  const maxG = Math.floor(n / minSize);
  if (minG > maxG) return [];

  let g = minG;
  while (g <= maxG) {
    if (n <= groupSize * g) break;
    g++;
  }
  if (g > maxG) return [];

  const sizes = Array.from({ length: g }, () => minSize);
  let rest = n - minSize * g;

  for (let i = 0; i < rest; i++) {
    const idx = i % g;
    if (sizes[idx] >= groupSize) {
      let placed = false;
      for (let j = 0; j < g; j++) {
        if (sizes[j] < groupSize) {
          sizes[j]++;
          placed = true;
          break;
        }
      }
      if (!placed) return [];
    } else {
      sizes[idx]++;
    }
  }

  return sizes;
}

type PlayerRow = { userId: string; name: string; joinedAt: number };

function buildGroupsFromPlayers(opts: {
  players: PlayerRow[];
  groupSize: number;
  fixedByUserId?: Record<string, number>;
}) {
  const { players, groupSize, fixedByUserId } = opts;

  const n = players.length;
  if (n < 3) throw new Error(formatGroupErr("mínimo 3 jugadores"));
  if (groupSize < 3) throw new Error(formatGroupErr("groupSize mínimo es 3"));
  if (groupSize > 30) throw new Error(formatGroupErr("groupSize demasiado grande"));

  const playerIdsOrdered = players
    .slice()
    .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
    .map((p) => p.userId);

  const fixed = fixedByUserId ?? {};
  const fixedBuckets = new Map<number, string[]>();

  for (const uid of playerIdsOrdered) {
    const gnum = fixed[uid];
    if (!gnum || !Number.isFinite(gnum) || gnum <= 0) continue;
    const key = Math.trunc(gnum);
    const arr = fixedBuckets.get(key) ?? [];
    arr.push(uid);
    fixedBuckets.set(key, arr);
  }

  const clusters = Array.from(fixedBuckets.entries())
    .map(([groupNum, userIds]) => ({ groupNum, userIds }))
    .filter((c) => c.userIds.length > 0);

  for (const c of clusters) {
    if (c.userIds.length > groupSize) {
      throw new Error(formatGroupErr(`el grupo fijo #${c.groupNum} tiene ${c.userIds.length} personas y excede el tamaño ${groupSize}`));
    }
  }

  const clusterCount = clusters.length;

  const minG = Math.ceil(n / groupSize);
  const maxG = Math.floor(n / 3);
  const startG = Math.max(minG, clusterCount);

  let g = -1;
  for (let cand = startG; cand <= maxG; cand++) {
    if (n <= groupSize * cand) {
      g = cand;
      break;
    }
  }
  if (g === -1) {
    throw new Error(formatGroupErr("no existe partición válida (revisá tamaño de grupo o cantidad de grupos fijos)"));
  }

  const sizes = computeGroupSizesGeneral(n, groupSize, 3);
  if (!sizes.length) throw new Error(formatGroupErr("no se pudieron calcular tamaños de grupos"));

  if (sizes.length !== g) {
    const sizes2 = Array.from({ length: g }, () => 3);
    let rest = n - 3 * g;
    for (let i = 0; i < rest; i++) sizes2[i % g]++;
    for (const sz of sizes2) if (sz > groupSize) throw new Error(formatGroupErr("no se pudo distribuir respetando el tamaño máximo"));
    return finalizeGrouping(playerIdsOrdered, clusters, sizes2);
  }

  return finalizeGrouping(playerIdsOrdered, clusters, sizes);
}

function finalizeGrouping(
  playerIdsOrdered: string[],
  clusters: Array<{ groupNum: number; userIds: string[] }>,
  sizes: number[]
) {
  const groupSlots = sizes.map((target, i) => ({
    idx: i + 1,
    target,
    playerIds: [] as string[],
  }));

  const used = new Set<string>();

  const clustersSorted = clusters
    .slice()
    .sort((a, b) => (b.userIds.length - a.userIds.length) || (a.groupNum - b.groupNum));

  for (const c of clustersSorted) {
    let bestIndex = -1;
    let bestRemaining = -1;

    for (let i = 0; i < groupSlots.length; i++) {
      const g = groupSlots[i];
      const remaining = g.target - g.playerIds.length;
      if (remaining >= c.userIds.length) {
        if (remaining > bestRemaining) {
          bestRemaining = remaining;
          bestIndex = i;
        }
      }
    }

    if (bestIndex === -1) {
      throw new Error(formatGroupErr(`no hay lugar para el grupo fijo #${c.groupNum}`));
    }

    const targetGroup = groupSlots[bestIndex];
    for (const uid of c.userIds) {
      if (used.has(uid)) continue;
      targetGroup.playerIds.push(uid);
      used.add(uid);
    }
  }

  const remainingPlayers = playerIdsOrdered.filter((uid) => !used.has(uid));

  let cursor = 0;
  for (const g of groupSlots) {
    while (g.playerIds.length < g.target && cursor < remainingPlayers.length) {
      g.playerIds.push(remainingPlayers[cursor]);
      used.add(remainingPlayers[cursor]);
      cursor++;
    }
  }

  const leftover = remainingPlayers.slice(cursor);
  if (leftover.length) {
    throw new Error(formatGroupErr("sobraron jugadores sin asignar (bug de distribución)"));
  }

  if (used.size !== playerIdsOrdered.length) {
    throw new Error(formatGroupErr("no se asignaron todos los jugadores (bug de consistencia)"));
  }

  const groupsObj: Record<string, { idx: number; playerIds: string[] }> = {};
  for (const g of groupSlots) {
    const gid = nextGroupId(g.idx);
    groupsObj[gid] = { idx: g.idx, playerIds: g.playerIds };
  }

  return groupsObj;
}

/**
 * Admin: crea grupos y pasa phase -> grouping.
 * - SOLO desde lobby
 * - Bloquea late joins (lockedAt)
 * - Guarda groups (global) y espeja en qr3.groups (para no romper QR3)
 * - Arranca un countdown (endsAt) para el armado presencial
 */
export async function adminCreateGroups(opts: {
  playSessionId: string;
  groupSize: number;
  fixedByUserId?: Record<string, number>;
  countdownMs?: number;
}) {
  const playSessionId = opts.playSessionId;
  const groupSize = clampInt(opts.groupSize, 3);
  const countdownMs = clampInt(opts.countdownMs, 3 * 60 * 1000);

  if (!playSessionId) throw new Error("playSessionId requerido");

  const ref = rtdb().ref(`playSessions/${playSessionId}`);
  const snap = await ref.get();
  if (!snap.exists()) throw new Error("playSession no existe");

  const cur = snap.val() as any;
  const phase = (cur?.phase ?? "lobby") as Phase;

  if (phase !== "lobby") {
    throw new Error("La sesión no está en lobby");
  }

  const playersObj = (cur?.players ?? {}) as Record<string, { name: string; joinedAt: number }>;
  const players: PlayerRow[] = Object.entries(playersObj).map(([userId, p]) => ({
    userId,
    name: p?.name ?? "Jugador",
    joinedAt: p?.joinedAt ?? 0,
  }));

  const fixedRaw = opts.fixedByUserId ?? {};
  const fixed: Record<string, number> = {};
  for (const [uid, v] of Object.entries(fixedRaw)) {
    const n = clampInt(v, 0);
    if (n > 0) fixed[uid] = n;
  }

  for (const uid of Object.keys(fixed)) {
    if (!playersObj[uid]) {
      throw new Error(formatGroupErr(`usuario ${uid} no existe en la sesión (refrescá la lista)`));
    }
  }

  const groups = buildGroupsFromPlayers({ players, groupSize, fixedByUserId: fixed });

  const startedAt = nowMs();
  const endsAt = startedAt + Math.max(30_000, Math.min(countdownMs, 10 * 60 * 1000));

  const tx = await ref.transaction((state: any) => {
    if (!state) return state;

    const ph = (state.phase ?? "lobby") as Phase;
    if (ph !== "lobby") return;

    state.phase = "grouping";
    state.lockedAt = nowMs();
    state.grouping = { groupSize, startedAt, endsAt };

    state.groups = groups;

    state.qr3 = state.qr3 ?? {};
    state.qr3.present = state.qr3.present ?? {};
    state.qr3.groups = state.qr3.groups ?? {};

    state.qr3.groups = {};
    for (const [gid, g] of Object.entries(groups)) {
      state.qr3.groups[gid] = {
        idx: (g as any).idx,
        playerIds: (g as any).playerIds,
        status: "active",
      };
    }

    return state;
  });

  if (!tx.committed) {
    throw new Error("No se pudieron crear los grupos (¿ya no está en lobby?)");
  }

  return { ok: true };
}

/**
 * Admin "Start" real del juego:
 * - grouping -> running
 */
export async function adminStartPlaySession(playSessionId: string) {
  const ref = rtdb().ref(`playSessions/${playSessionId}`);

  const result = await ref.transaction((cur: any) => {
    if (!cur) return cur;

    const phase = (cur.phase ?? "lobby") as Phase;
    if (phase !== "grouping") return;

    const playersObj = cur.players ?? {};
    const playerIds = Object.keys(playersObj);
    if (playerIds.length < 3) return;

    const groupsObj = cur.groups ?? {};
    const groupCount = Object.keys(groupsObj).length;
    if (groupCount < 1) return;

    cur.phase = "running";
    cur.startedAt = nowMs();

    cur.qr3 = cur.qr3 ?? { present: {}, groups: {} };
    cur.qr3.present = cur.qr3.present ?? {};
    cur.qr3.groups = cur.qr3.groups ?? {};

    return cur;
  });

  if (!result.committed) {
    throw new Error("No se pudo iniciar (¿faltan grupos, falta mínimo o no está en grouping?)");
  }

  return true;
}

export async function getPlaySessionState(playSessionId: string) {
  const snap = await rtdb().ref(`playSessions/${playSessionId}`).get();
  return snap.val();
}

/* =========================================================
   ✅ QR3: presencia (sin armar grupos acá)
   ========================================================= */

export async function joinQr3AndMaybeGroup(opts: {
  playSessionId: string;
  userId: string;
  name: string;
}) {
  const { playSessionId, userId, name } = opts;
  const baseRef = rtdb().ref(`playSessions/${playSessionId}`);

  const phaseSnap = await baseRef.child("phase").get();
  const phase = phaseSnap.val() as Phase | null;
  if (phase !== "running" && phase !== "done") {
    throw new Error("La sesión todavía no está en running.");
  }

  const res = await baseRef.child("qr3").transaction((cur: any) => {
    cur = cur ?? {};
    cur.present = cur.present ?? {};
    cur.groups = cur.groups ?? {};

    if (!cur.present[userId]) {
      cur.present[userId] = { name: name.trim() || "Jugador", at: nowMs() };
    }

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
 * ✅ Submit por grupo (QR3) (tu implementación actual queda igual)
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

  const doneRes = await groupRef.transaction((cur: any) => {
    if (!cur) return cur;
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
