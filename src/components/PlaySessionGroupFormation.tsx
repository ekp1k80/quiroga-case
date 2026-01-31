// src/components/PlaySessionGroupFormation.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRtdbValue } from "@/hooks/useRtdbValue";

type State = {
  phase?: "lobby" | "grouping" | "running" | "done";
  players?: Record<string, { name: string; joinedAt: number }>;
  grouping?: { groupSize: number; startedAt: number; endsAt: number };
  groups?: Record<string, { idx: number; playerIds: string[] }>;
  qr3?: { groups?: Record<string, { idx: number; playerIds: string[] }> };
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
}

export default function PlaySessionGroupFormation(props: {
  playSessionId: string;
  userId: string;
}) {
  const { playSessionId, userId } = props;

  const { value: state, error } = useRtdbValue<State>(`playSessions/${playSessionId}`);

  const playersById = useMemo(() => state?.players ?? {}, [state?.players]);

  const groups = useMemo(() => {
    const g = state?.groups ?? {};
    const entries = Object.entries(g).map(([groupId, gg]) => ({ groupId, ...gg }));
    if (entries.length) return entries.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));

	const fallback = state?.qr3?.groups ?? {};
    return Object.entries(fallback)
      .map(([groupId, gg]) => ({ groupId, ...gg }))
      .sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
  }, [state?.groups, state?.qr3?.groups]);

  const myGroup = useMemo(() => {
    for (const g of groups) {
      const ids = Array.isArray((g as any).playerIds) ? (g as any).playerIds : [];
      if (ids.includes(userId)) return g as any;
    }
    return null;
  }, [groups, userId]);

  const endsAt = state?.grouping?.endsAt ?? null;

	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
	const t = setInterval(() => setNow(Date.now()), 500);
	return () => clearInterval(t);
	}, []);

	const remainingMs = endsAt ? Math.max(0, endsAt - now) : 0;

  const myMembers = useMemo(() => {
		const ids: string[] = Array.isArray(myGroup?.playerIds) ? myGroup.playerIds : [];
		return ids.map((uid) => ({
			userId: uid,
			name: playersById[uid]?.name ?? "Jugador",
		}));
	}, [myGroup, playersById]);

  return (
    <Wrap>
      <Card>
        <Title>Armen equipos</Title>
        <Sub>
          Este es un ratito para que nadie quede colgado: organizate con tu grupo antes de arrancar.
        </Sub>

        {error ? <Err>{error}</Err> : null}

        <Timer>
          <TimerLabel>Cuenta regresiva</TimerLabel>
          <TimerValue>{endsAt ? formatMs(remainingMs) : "—"}</TimerValue>
          <TimerHint>
            {remainingMs > 0 ? "Busquen a su grupo en persona." : "Listo. Esperá a que comience el juego."}
          </TimerHint>
        </Timer>

        <Section>
          <Label>Tu grupo</Label>

          {myGroup ? (
            <>
              <GroupTitle>Equipo {myGroup.idx}</GroupTitle>
              <List>
                {myMembers.map((m) => (
                  <Item key={m.userId}>
                    <Dot /> {m.name}
                  </Item>
                ))}
              </List>
            </>
          ) : (
            <Muted>
              Aún no estás asignado a un grupo. Si esto persiste, avisale al admin.
            </Muted>
          )}
        </Section>

        <Foot>
          <Pill>{state?.phase === "grouping" ? "Armando grupos" : "—"}</Pill>
          <Small>Si se corta, recargá y vuelve a enganchar.</Small>
        </Foot>
      </Card>
    </Wrap>
  );
}

const Wrap = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
`;

const Card = styled.div`
  width: min(520px, 92vw);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 20, 20, 0.75);
  border-radius: 18px;
  padding: 18px;
  color: #fff;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
`;

const Sub = styled.p`
  margin: 8px 0 0;
  opacity: 0.78;
  line-height: 1.35;
`;

const Err = styled.div`
  margin-top: 10px;
  color: #ffb3b3;
  font-size: 13px;
`;

const Timer = styled.div`
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const TimerLabel = styled.div`
  opacity: 0.75;
  font-size: 12px;
`;

const TimerValue = styled.div`
  font-weight: 800;
  font-size: 28px;
  margin-top: 4px;
`;

const TimerHint = styled.div`
  margin-top: 6px;
  opacity: 0.75;
  font-size: 12px;
`;

const Section = styled.div`
  margin-top: 14px;
`;

const Label = styled.div`
  font-weight: 700;
  margin-bottom: 8px;
`;

const GroupTitle = styled.div`
  font-weight: 800;
  margin-bottom: 8px;
  opacity: 0.9;
`;

const List = styled.div`
  display: grid;
  gap: 8px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
`;

const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.7);
  display: inline-block;
`;

const Muted = styled.div`
  opacity: 0.65;
`;

const Foot = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 8px;
`;

const Pill = styled.div`
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
`;

const Small = styled.div`
  font-size: 12px;
  opacity: 0.6;
`;
