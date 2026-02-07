// src/components/Qr3FinalPuzzle.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRtdbValue } from "@/hooks/useRtdbValue";
import { QR3_PASS_SCORE, QR3_QUESTIONS_PUBLIC } from "@/data/finalQr3Quiz.public";

type PlaySessionState = {
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
};

type Props = {
  user: { id: string; name: string; storyNode: string; flags: string[]; tags: string[]; playSessionId?: string };
  onAllDone?: () => void;
};

export default function Qr3FinalPuzzle({ user, onAllDone }: Props) {
  const playSessionId = user.playSessionId ?? null;

  const { value: state, error } = useRtdbValue<PlaySessionState>(
    playSessionId ? `playSessions/${playSessionId}` : "__invalid__"
  );

  const phase = (state?.phase ?? "lobby") as "lobby" | "running" | "done";
  const groups = state?.qr3?.groups ?? {};

  const myGroup = useMemo(() => {
    for (const [gid, g] of Object.entries(groups)) {
      const ids: string[] = Array.isArray(g?.playerIds) ? (g.playerIds as string[]) : [];
      if (ids.includes(user.id)) return { groupId: gid, group: g };
    }
    return null;
  }, [groups, user.id]);

  const allGroups = useMemo(() => {
    return Object.entries(groups).map(([gid, gg]) => ({
      groupId: gid,
      idx: gg?.idx ?? "?",
      status: gg?.status ?? "active",
      rank: gg?.rank ?? null,
      score: gg?.score ?? null,
      size: Array.isArray(gg?.playerIds) ? gg.playerIds.length : 0,
    }));
  }, [groups]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setSubmitErr(null);
    setSubmitOk(null);

    try {
      const r = await fetch("/api/qr3/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers, playSessionId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No se pudo enviar");

      if (j.done) {
        setSubmitOk(`Correcto. Puntaje ${j.score}/${QR3_QUESTIONS_PUBLIC.length}.`);
      } else {
        setSubmitErr(`Puntaje ${j.score}/${QR3_QUESTIONS_PUBLIC.length}. No alcanza (${QR3_PASS_SCORE} mínimo).`);
      }
    } catch (e: any) {
      setSubmitErr(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  // ✅ returns recién acá abajo
  if (!playSessionId) {
    return (
      <Center>
        <Card>
          <Title>Final</Title>
          <Hint>Falta playSessionId en el usuario.</Hint>
        </Card>
      </Center>
    );
  }

  if (phase === "lobby") {
    return (
      <Center>
        <Card>
          <Title>Final</Title>
          <Hint>Esperá a que inicie la sesión.</Hint>
          {error ? <Warn>{error}</Warn> : null}
        </Card>
      </Center>
    );
  }

  if (!myGroup) {
    return (
      <Center>
        <Card>
          <Title>Final</Title>
          <Hint>Asignando grupo…</Hint>
          {error ? <Warn>{error}</Warn> : null}
        </Card>
      </Center>
    );
  }

  const g = myGroup.group;
  const groupStatus = g?.status ?? "active";
  const groupRank = g?.rank;
  const groupScore = g?.score;

  if (groupStatus === "done") {
    return (
      <Center>
        <Card>
          <Title>Tu grupo terminó</Title>
          <Row>
            <Pill>Grupo #{g?.idx ?? "?"}</Pill>
            {typeof groupRank === "number" ? <Pill>Rank #{groupRank}</Pill> : <Pill>Rank: —</Pill>}
            {typeof groupScore === "number" ? <Pill>Score {groupScore}</Pill> : null}
          </Row>

          <Hint>Esperando a los otros grupos…</Hint>

          <List>
            {allGroups
              .slice()
              .sort((a, b) => Number(a.idx) - Number(b.idx))
              .map((x) => (
                <Item key={x.groupId}>
                  <Dot />
                  <span>
                    Grupo {x.idx} ({x.size})
                  </span>
                  <Small>{x.status === "done" ? `listo${x.rank ? ` · #${x.rank}` : ""}` : "en progreso"}</Small>
                </Item>
              ))}
          </List>

          {error ? <Warn>{error}</Warn> : null}
        </Card>
      </Center>
    );
  }

  return (
    <Wrap>
      <Card>
        <Title>Final Puzzle</Title>

        <Row>
          <Pill>Grupo #{g?.idx ?? "?"}</Pill>
          <Pill>Integrantes: {Array.isArray(g?.playerIds) ? g.playerIds.length : "?"}</Pill>
        </Row>

        <Hint>Se responde por choiceId.</Hint>

        <Form>
          {QR3_QUESTIONS_PUBLIC.map((q) => (
            <QBlock key={q.id}>
              <QText>{q.text}</QText>
              <Choices>
                {q.choices.map((c) => {
                  const checked = answers[q.id] === c.id;
                  return (
                    <ChoiceBtn
                      key={c.id}
                      $active={checked}
                      onClick={() => setAnswers((p) => ({ ...p, [q.id]: c.id }))}
                      type="button"
                    >
                      <ChoiceKey>{c.id.toUpperCase()}</ChoiceKey>
                      <span>{c.label}</span>
                    </ChoiceBtn>
                  );
                })}
              </Choices>
            </QBlock>
          ))}
        </Form>

        {submitErr ? <Warn>{submitErr}</Warn> : null}
        {submitOk ? <Ok>{submitOk}</Ok> : null}

        <Button onClick={submit} disabled={busy}>
          {busy ? "Enviando…" : "Submit"}
        </Button>

        {error ? <Warn>{error}</Warn> : null}
      </Card>
    </Wrap>
  );
}

/* styles (igual que antes) */
const Center = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
`;
const Wrap = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 14px;
  display: grid;
  place-items: start center;
`;
const Card = styled.div`
  width: min(860px, 96vw);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  padding: 16px;
  color: #fff;
`;
const Title = styled.div`font-weight: 900; font-size: 16px;`;
const Hint = styled.div`margin-top: 10px; opacity: 0.85; font-size: 13px;`;
const Row = styled.div`display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;`;
const Pill = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.2);
  font-weight: 800;
  font-size: 12px;
`;
const Form = styled.div`margin-top: 12px; display: grid; gap: 12px;`;
const QBlock = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  border-radius: 14px;
  padding: 12px;
`;
const QText = styled.div`font-weight: 900; font-size: 13px; line-height: 1.35;`;
const Choices = styled.div`margin-top: 10px; display: grid; gap: 8px;`;
const ChoiceBtn = styled.button<{ $active: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, ${(p) => (p.$active ? 0.26 : 0.12)});
  background: rgba(255, 255, 255, ${(p) => (p.$active ? 0.12 : 0.06)});
  color: #fff;
  cursor: pointer;
  text-align: left;
`;
const ChoiceKey = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.2);
`;
const Button = styled.button`
  margin-top: 14px;
  width: 100%;
  border-radius: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  font-weight: 900;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
const List = styled.div`margin-top: 12px; display: grid; gap: 8px;`;
const Item = styled.div`display: flex; align-items: center; gap: 10px; opacity: 0.95;`;
const Dot = styled.div`width: 7px; height: 7px; border-radius: 999px; background: rgba(255, 255, 255, 0.75);`;
const Small = styled.span`opacity: 0.75; font-size: 12px;`;
const Warn = styled.div`margin-top: 10px; color: #ffd7d7; opacity: 0.95; font-size: 13px;`;
const Ok = styled.div`margin-top: 10px; color: #d7ffe5; opacity: 0.95; font-size: 13px;`;
