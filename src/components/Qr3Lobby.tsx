// src/components/Qr3Lobby.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRtdbValue } from "@/hooks/useRtdbValue";

type Qr3State = {
  present?: Record<string, { name: string; at: number }>;
  groups?: Record<string, { idx: number; playerIds: string[]; status: "active" | "done" }>;
};

export default function Qr3Lobby({
  user,
  playSessionId,
}: {
  user: { id: string; name: string };
  playSessionId: string;
}) {
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  // join UNA vez (server write)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/qr3/join", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playSessionId }),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No se pudo unir a QR3");
        if (!cancelled) setJoined(true);
      } catch (e: any) {
        if (!cancelled) setJoinErr(e?.message ?? "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playSessionId]);

  // leer QR3 en tiempo real (RTDB client)
  const { value: qr3, error } = useRtdbValue<Qr3State>(`playSessions/${playSessionId}/qr3`);

  const present = qr3?.present ?? {};
  const groups = qr3?.groups ?? {};

  const presentCount = Object.keys(present).length;

  const myGroupId = useMemo(() => {
    for (const [gid, g] of Object.entries(groups)) {
      const ids = Array.isArray((g as any).playerIds) ? (g as any).playerIds : [];
      if (ids.includes(user.id)) return gid;
    }
    return null;
  }, [groups, user.id]);

  // importante: acá NO es "faltan todos", es "faltan para que exista un grupo"
  const missingForFirstGroup = Math.max(0, 3 - presentCount);

  return (
    <Wrap>
      <Card>
        <Title>Escuela</Title>
        <Sub>Esperá un momento…</Sub>

        {joinErr ? <Warn>{joinErr}</Warn> : null}
        {error ? <Warn>{error}</Warn> : null}

        <Row>
          <Pill>En QR3: {presentCount}</Pill>
          <Pill>{joined ? "Registrado" : "Registrando…"}</Pill>
        </Row>

        {!myGroupId ? (
          <Hint>
            {missingForFirstGroup > 0 ? (
              <>
                Faltan <b>{missingForFirstGroup}</b> para que arranque el primer grupo.
              </>
            ) : (
              <>Ya hay mínimo. Te asignan grupo apenas haya cupo.</>
            )}
          </Hint>
        ) : (
          <Hint>
            Grupo asignado: <b>{myGroupId}</b>. Entrando al puzzle…
          </Hint>
        )}
      </Card>
    </Wrap>
  );
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 18px;
`;
const Card = styled.div`
  width: min(560px, 94vw);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  padding: 16px;
  color: #fff;
`;
const Title = styled.div`font-weight: 900; font-size: 16px;`;
const Sub = styled.div`opacity: 0.75; margin-top: 6px;`;
const Warn = styled.div`margin-top: 10px; color: #ffd7d7; font-weight: 800; font-size: 13px;`;
const Row = styled.div`display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;`;
const Pill = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.2);
  font-weight: 800;
  font-size: 12px;
`;
const Hint = styled.div`margin-top: 12px; opacity: 0.85; font-size: 13px;`;
