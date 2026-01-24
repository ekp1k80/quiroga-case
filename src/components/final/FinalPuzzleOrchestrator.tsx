"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { QR3_FINAL_QUIZ, type Qr3FinalQuizAnswers } from "@/data/final/qr3FinalQuiz";

type UserLike = {
  id: string;
  name: string;
  storyNode: string;
  flags: string[];
  tags: string[];
};

type ApiState = {
  ok: boolean;
  advanced?: { from: string; to: string } | null;
  state?: {
    session: {
      storyNode: string;
      state: "open" | "locked" | "final";
      totalPlayers: number;
      totalGroups: number;
      doneGroups: number;
      threshold: number;
      totalQuestions: number;
    };
    players: Array<{
      id: string;
      userId: string;
      name?: string | null;
      groupId?: string | null;
      groupIndex?: number | null;
    }>;
    groups: Array<{
      id: string;
      index: number;
      state: "active" | "done";
      memberUserIds: string[];
      rank?: number | null;
      score?: number | null;
    }>;
  };
  error?: string;
};

type SubmitRes = {
  ok: boolean;
  passed?: boolean;
  score?: number;
  threshold?: number;
  error?: string;
};

type Props = {
  user: UserLike; // ✅ ahora sí, sin adivinar
  onAdvanced?: (advanced: { from: string; to: string }) => void;
};

export default function FinalPuzzleOrchestrator({ user, onAdvanced }: Props) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ApiState["state"] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Qr3FinalQuizAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  const pollRef = useRef<number | null>(null);

  const me = useMemo(() => {
    if (!state?.players?.length) return null;
    return state.players.find((p) => p.userId === user.id) ?? null;
  }, [state, user.id]);

  const myGroup = useMemo(() => {
    if (!state?.groups?.length) return null;
    if (!me?.groupId) return null;
    return state.groups.find((g) => g.id === me.groupId) ?? null;
  }, [state, me?.groupId]);

  const sessionState = state?.session?.state ?? "open";

  const groupsSorted = useMemo(() => {
    if (!state?.groups) return [];
    return [...state.groups].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }, [state]);

  const fetchState = async () => {
    try {
      const r = await fetch("/api/final/qr3/state", { cache: "no-store" });
      const j = (await r.json()) as ApiState;

      if (!r.ok || !j.ok) throw new Error(j.error ?? "Error");

      if (j.advanced && onAdvanced) onAdvanced(j.advanced);

      setState(j.state ?? null);
      setLoading(false);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando estado");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();

    pollRef.current = window.setInterval(() => {
      fetchState();
    }, 1200);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const join = async () => {
    if (joining) return;
    setJoining(true);
    setErr(null);
    try {
      const r = await fetch("/api/final/qr3/join", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "Join failed");
      setJoined(true);
      await fetchState();
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo unir");
    } finally {
      setJoining(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const r = await fetch("/api/final/qr3/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const j = (await r.json()) as SubmitRes;
      if (!r.ok || !j.ok) throw new Error(j.error ?? "Submit failed");

      setLastScore(typeof j.score === "number" ? j.score : null);
      setPassed(!!j.passed);

      if (!j.passed) {
        setSubmitError(`No alcanza. Puntaje: ${j.score}/${j.threshold}`);
      } else {
        await fetchState();
      }
    } catch (e: any) {
      setSubmitError(e?.message ?? "Error enviando");
    } finally {
      setSubmitting(false);
    }
  };

  const canShowQuiz = sessionState === "locked" && myGroup && myGroup.state === "active";
  const showWaiting = sessionState === "locked" && myGroup && myGroup.state === "done";
  const showFinal = sessionState === "final";

  if (loading) {
    return (
      <Wrap>
        <Card>
          <Title>Resolviendo…</Title>
          <Sub>Conectando al final del caso.</Sub>
        </Card>
      </Wrap>
    );
  }

  if (err) {
    return (
      <Wrap>
        <Card>
          <Title>Error</Title>
          <Sub>{err}</Sub>
          <Row>
            <Btn onClick={fetchState}>Reintentar</Btn>
          </Row>
        </Card>
      </Wrap>
    );
  }

  // Lobby (join manual)
  if (sessionState === "open") {
    const n = state?.players?.length ?? 0;
    const falta = Math.max(0, 3 - n);

    return (
      <Wrap>
        <Card>
          <Title>Final del caso</Title>
          <Sub>
            Jugadores conectados: <b>{n}</b>.{" "}
            {falta > 0 ? `Faltan ${falta} para arrancar.` : `Listo para formar grupos.`}
          </Sub>

          <Section>
            <Label>Conectados</Label>
            <List>
              {(state?.players ?? []).map((p) => (
                <li key={p.id}>{p.name || "Jugador"}</li>
              ))}
            </List>
          </Section>

          <Row>
            <Btn onClick={join} disabled={joining}>
              {joining ? "Uniéndome…" : joined || !!me ? "Unido" : "Unirme"}
            </Btn>
            <BtnGhost onClick={fetchState}>Actualizar</BtnGhost>
          </Row>

          <Hint>Cuando se cierre la sesión, empieza automáticamente por grupos.</Hint>
        </Card>
      </Wrap>
    );
  }

  // Locked pero todavía sin mi player (ej: no join)
  if (sessionState === "locked" && !me) {
    return (
      <Wrap>
        <Card>
          <Title>Sesión cerrada</Title>
          <Sub>La sesión ya está bloqueada. Si no estabas unido, no vas a poder entrar.</Sub>

          <Section>
            <Label>Estado de grupos</Label>
            <Groups>
              {groupsSorted.map((g) => (
                <GroupRow key={g.id}>
                  <span>Grupo {g.index}</span>
                  <span>{g.state === "done" ? "Listo" : "En progreso"}</span>
                </GroupRow>
              ))}
            </Groups>
          </Section>

          <Hint>Para debug, usá la página /debug/impersonate (abajo) en incógnito.</Hint>
        </Card>
      </Wrap>
    );
  }

  // Quiz
  if (canShowQuiz && myGroup) {
    return (
      <Wrap>
        <CardWide>
          <TopBar>
            <div>
              <Title>Grupo {myGroup.index}</Title>
              <Sub>
                {user.name} · Progreso global: {state?.session?.doneGroups ?? 0}/
                {state?.session?.totalGroups ?? 0} grupos listos.
              </Sub>
            </div>
            <Pill>En progreso</Pill>
          </TopBar>

          <Quiz>
            {QR3_FINAL_QUIZ.questions.map((q, i) => {
              const selected = answers[q.id] ?? "";
              return (
                <QBlock key={q.id}>
                  <QTitle>
                    {i + 1}. {q.prompt}
                  </QTitle>
                  <Choices>
                    {q.choices.map((c) => (
                      <ChoiceBtn
                        key={c.id}
                        $active={selected === c.id}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                      >
                        <ChoiceKey>{c.id.toUpperCase()}</ChoiceKey>
                        <span>{c.label}</span>
                      </ChoiceBtn>
                    ))}
                  </Choices>
                </QBlock>
              );
            })}
          </Quiz>

          {submitError ? <ErrorBox>{submitError}</ErrorBox> : null}
          {passed && lastScore != null ? <OkBox>Correcto. Puntaje: {lastScore}</OkBox> : null}

          <Row>
            <Btn onClick={submit} disabled={submitting}>
              {submitting ? "Enviando…" : "Submit (por grupo)"}
            </Btn>
            <BtnGhost onClick={fetchState}>Actualizar</BtnGhost>
          </Row>
        </CardWide>
      </Wrap>
    );
  }

  // Waiting
  if (showWaiting && myGroup) {
    const rank = myGroup.rank ?? null;

    return (
      <Wrap>
        <Card>
          <Title>Tu grupo terminó</Title>
          <Sub>{rank ? `Ranking parcial: #${rank}` : "Esperando ranking…"}</Sub>

          <Section>
            <Label>Estado de grupos</Label>
            <Groups>
              {groupsSorted.map((g) => (
                <GroupRow key={g.id}>
                  <span>Grupo {g.index}</span>
                  <span>{g.state === "done" ? `Listo${g.rank ? ` (#${g.rank})` : ""}` : "En progreso"}</span>
                </GroupRow>
              ))}
            </Groups>
          </Section>

          <Hint>Esperando a los otros grupos…</Hint>
        </Card>
      </Wrap>
    );
  }

  // Final
  if (showFinal) {
    return (
      <Wrap>
        <Card>
          <Title>Completado</Title>
          <Sub>Todos los grupos terminaron. Avanzando…</Sub>
        </Card>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Card>
        <Title>Estado</Title>
        <Sub>Sin estado renderizable.</Sub>
      </Card>
    </Wrap>
  );
}

/* ===================== styles ===================== */

const Wrap = styled.div`
  width: 100%;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: #000;
  color: #fff;
`;

const Card = styled.div`
  width: min(560px, 96vw);
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  padding: 16px;
`;

const CardWide = styled(Card)`
  width: min(980px, 96vw);
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 16px;
`;

const Sub = styled.div`
  margin-top: 6px;
  opacity: 0.8;
  font-size: 13px;
  line-height: 1.35;
`;

const Row = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  border-radius: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.10);
  color: #fff;
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const BtnGhost = styled(Btn)`
  background: transparent;
`;

const Section = styled.div`
  margin-top: 14px;
`;

const Label = styled.div`
  font-weight: 900;
  font-size: 12px;
  opacity: 0.85;
`;

const List = styled.ul`
  margin: 8px 0 0;
  padding-left: 18px;
  opacity: 0.85;
  font-size: 13px;
`;

const Groups = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 8px;
`;

const GroupRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.20);
  font-size: 13px;
  opacity: 0.9;
`;

const Hint = styled.div`
  margin-top: 12px;
  opacity: 0.65;
  font-size: 12px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
`;

const Pill = styled.div`
  border-radius: 999px;
  padding: 7px 10px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  font-size: 12px;
  opacity: 0.9;
  font-weight: 900;
`;

const Quiz = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 14px;
`;

const QBlock = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.20);
  padding: 12px;
`;

const QTitle = styled.div`
  font-weight: 900;
  font-size: 13px;
  line-height: 1.35;
`;

const Choices = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 8px;
`;

const ChoiceBtn = styled.button<{ $active: boolean }>`
  display: flex;
  gap: 10px;
  align-items: center;
  text-align: left;

  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: ${(p) => (p.$active ? "rgba(140,255,180,0.14)" : "rgba(255,255,255,0.06)")};
  color: #fff;

  cursor: pointer;
  font-size: 13px;
  line-height: 1.35;
`;

const ChoiceKey = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 900;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.25);
`;

const ErrorBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,120,120,0.35);
  background: rgba(255,120,120,0.12);
  font-size: 13px;
`;

const OkBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(140,255,180,0.35);
  background: rgba(140,255,180,0.12);
  font-size: 13px;
`;
