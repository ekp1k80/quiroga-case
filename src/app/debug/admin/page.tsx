// src/app/debug/admin/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRtdbValue } from "@/hooks/useRtdbValue";

type PlaySessionState = {
  code?: string;
  phase?: "lobby" | "grouping" | "running" | "done";
  players?: Record<string, { name: string; joinedAt: number }>;
  grouping?: { groupSize: number; startedAt: number; endsAt: number };
  groups?: Record<string, { idx: number; playerIds: string[] }>;
};

export default function DebugAdminPage() {
  const [codeInput, setCodeInput] = useState("");
  const [playSessionId, setPlaySessionId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [groupSize, setGroupSize] = useState<number>(3);

  const [fixedGroupNumByUserId, setFixedGroupNumByUserId] = useState<Record<string, string>>({});

  const normalizedCode = codeInput.trim().toUpperCase();

  const { value: state, error } = useRtdbValue<PlaySessionState>(
    playSessionId ? `playSessions/${playSessionId}` : null
  );

  const players = useMemo(() => {
    const m = state?.players ?? {};
    return Object.entries(m)
      .map(([userId, p]) => ({ userId, name: p.name, joinedAt: p.joinedAt }))
      .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
  }, [state?.players]);

  useEffect(() => {
    setFixedGroupNumByUserId((prev) => {
      const next = { ...prev };
      for (const p of players) {
        if (next[p.userId] === undefined) next[p.userId] = "";
      }
      return next;
    });
  }, [players]);

  useEffect(() => {
    if (state?.grouping?.groupSize && !Number.isNaN(state.grouping.groupSize)) {
      setGroupSize(state.grouping.groupSize);
    }
  }, [state?.grouping?.groupSize]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [players, search]);

  const phase = state?.phase ?? (playSessionId ? "lobby" : undefined);

  async function ensureByCode() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/play-session/ensure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No se pudo cargar sesión");
      setPlaySessionId(j.playSessionId);
      setMsg(`OK: sesión cargada (${j.playSessionId})`);
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
      setPlaySessionId("");
    } finally {
      setBusy(false);
    }
  }

  async function createGroups() {
    if (!playSessionId) return;
    if (!window.confirm("¿Crear grupos y pasar a la fase de armado de equipos?")) return;

    setBusy(true);
    setMsg(null);
    try {
      const fixedByUserId: Record<string, number> = {};
      for (const [uid, v] of Object.entries(fixedGroupNumByUserId)) {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) fixedByUserId[uid] = Math.trunc(n);
      }

      const r = await fetch("/api/admin/play-session/create-groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playSessionId, groupSize, fixedByUserId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No se pudieron crear grupos");
      setMsg("OK: grupos creados");
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  async function startSession() {
    if (!playSessionId) return;
    if (!window.confirm("¿Iniciar la sesión ahora?")) return;

    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/play-session/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playSessionId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No se pudo iniciar");
      setMsg("OK: sesión iniciada");
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  const totalPlayers = players.length;

  const groupsPreview = useMemo(() => {
    const g = state?.groups ?? {};
    const byId = Object.entries(g).map(([groupId, gg]) => ({ groupId, ...gg }));
    return byId.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
  }, [state?.groups]);

  const playerNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of players) m[p.userId] = p.name;
    return m;
  }, [players]);

  return (
    <div style={{ padding: 18, maxWidth: 980 }}>
      <h2>Admin (local)</h2>
      <p style={{ opacity: 0.75 }}>Cargar por temporalCode, armar grupos y luego iniciar sesión.</p>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="TEMPORAL CODE (ej: ABC123)"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button
          onClick={ensureByCode}
          disabled={!normalizedCode || busy}
          style={{ padding: "10px 14px", borderRadius: 10 }}
        >
          {busy ? "Cargando…" : "Cargar"}
        </button>
      </div>

      {playSessionId ? (
        <div style={{ marginTop: 10, opacity: 0.8 }}>
          <div>playSessionId: <code>{playSessionId}</code></div>
          <div>phase: <b>{phase}</b></div>
        </div>
      ) : null}

      {msg ? <div style={{ marginTop: 12 }}>{msg}</div> : null}
      {error ? <div style={{ marginTop: 12, color: "crimson" }}>{error}</div> : null}

      {playSessionId ? (
        <>
          <hr style={{ margin: "18px 0" }} />

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ opacity: 0.85 }}>
              Jugadores: <b>{totalPlayers}</b>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ opacity: 0.85 }}>Tamaño por grupo</span>
              <input
                type="number"
                min={3}
                max={30}
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                disabled={busy || phase !== "lobby"}
                style={{ width: 90, padding: 8, borderRadius: 10, border: "1px solid #ccc" }}
              />
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador…"
              style={{ flex: 1, minWidth: 220, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 10, background: "#fafafa", borderBottom: "1px solid #eee", display: "flex" }}>
              <div style={{ flex: 1, fontWeight: 600 }}>Jugador</div>
              <div style={{ width: 160, fontWeight: 600, textAlign: "right" }}>Grupo fijo (#)</div>
            </div>

            {filteredPlayers.length ? (
              filteredPlayers.map((p) => (
                <div
                  key={p.userId}
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ opacity: 0.6, fontSize: 12 }}>
                      {p.userId}
                    </div>
                  </div>

                  <div style={{ width: 160, display: "flex", justifyContent: "flex-end" }}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={fixedGroupNumByUserId[p.userId] ?? ""}
                      onChange={(e) =>
                        setFixedGroupNumByUserId((prev) => ({ ...prev, [p.userId]: e.target.value }))
                      }
                      disabled={busy || phase !== "lobby"}
                      style={{
                        width: 120,
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid #ccc",
                        textAlign: "right",
                      }}
                      placeholder="—"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 12, opacity: 0.7 }}>—</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {phase === "lobby" ? (
              <button
                onClick={createGroups}
                disabled={busy || totalPlayers < 3}
                style={{ flex: 1, padding: 12, borderRadius: 12 }}
              >
                {busy ? "Procesando…" : "Crear grupos"}
              </button>
            ) : phase === "grouping" ? (
              <button
                onClick={startSession}
                disabled={busy}
                style={{ flex: 1, padding: 12, borderRadius: 12 }}
              >
                {busy ? "Iniciando…" : "Iniciar sesión"}
              </button>
            ) : (
              <button disabled style={{ flex: 1, padding: 12, borderRadius: 12, opacity: 0.6 }}>
                {phase === "running" ? "Sesión en curso" : "Sesión finalizada"}
              </button>
            )}
          </div>

          {groupsPreview.length ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: "12px 0" }}>Grupos</h3>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {groupsPreview.map((g) => (
                  <div key={g.groupId} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      Equipo {g.idx}
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {g.playerIds.map((uid) => (
                        <div key={uid} style={{ opacity: 0.9 }}>
                          • {playerNameById[uid] ?? uid}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
