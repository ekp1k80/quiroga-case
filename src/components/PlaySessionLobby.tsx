// src/components/PlaySessionLobby.tsx
"use client";

import React, { useMemo, useEffect } from "react";
import styled from "styled-components";
import { useRtdbValue } from "@/hooks/useRtdbValue";

type LobbyState = {
  code?: string;
  pphase?: "lobby" | "grouping" | "running" | "done";
  players?: Record<string, { name: string; joinedAt: number }>;
};

/**
 * Lobby inicial (antes del juego).
 * Va en CharacterCreation flow / gate inicial.
 */
export default function PlaySessionLobby({
  playSessionId,
}: {
  playSessionId: string;
}) {
  const { value: state, error } = useRtdbValue<LobbyState>(`playSessions/${playSessionId}`);

	console.log("PlaySessionLobby state")
	console.log(state)

  const players = useMemo(() => {
    const m = state?.players ?? {};
    return Object.entries(m)
      .map(([userId, p]) => ({ userId, ...p }))
      .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
  }, [state?.players]);


  return (
    <Wrap>
      <Card>
        <Title>Lobby</Title>
        <Sub>Esperando a que el admin inicie la sesión…</Sub>

        {error ? <Err>{error}</Err> : null}

        <Section>
          <Label>Jugadores conectados</Label>
          <List>
            {players.length ? (
              players.map((p) => (
                <Item key={p.userId}>
                  <Dot /> {p.name}
                </Item>
              ))
            ) : (
              <Muted>—</Muted>
            )}
          </List>
        </Section>

        <Foot>
          <Pill>{state?.phase === "running" ? "Iniciando…" : "En lobby"}</Pill>
          <Small>Si se corta, recargá y vuelve a enganchar.</Small>
        </Foot>
      </Card>
    </Wrap>
  );
}

// styles
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
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  padding: 16px;
  color: #fff;
`;
const Title = styled.div`font-weight: 900; font-size: 18px;`;
const Sub = styled.div`opacity: 0.75; margin-top: 6px;`;
const Err = styled.div`margin-top: 10px; color: #ffb6b6; font-weight: 800;`;
const Section = styled.div`margin-top: 14px;`;
const Label = styled.div`font-weight: 900; margin-bottom: 8px;`;
const List = styled.div`display: grid; gap: 8px;`;
const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 14px;
  background: rgba(0,0,0,0.25);
`;
const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(140,255,180,0.95);
`;
const Muted = styled.div`opacity: 0.7;`;
const Foot = styled.div`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;
const Pill = styled.div`
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.08);
  font-weight: 900;
  font-size: 12px;
`;
const Small = styled.div`opacity: 0.6; font-size: 12px;`;
