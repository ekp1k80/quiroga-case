"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";

type Res = {
  ok: boolean;
  user?: { id: string; name: string; storyNode: string; flags: string[]; tags: string[] };
  error?: string;
};

export default function DebugImpersonatePage() {
  const [name, setName] = useState("");
  const [storyNode, setStoryNode] = useState("qr3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Res["user"] | null>(null);

  const trimmed = useMemo(() => name.trim(), [name]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const r = await fetch("/api/debug/session/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed, storyNode }),
      });
      const j = (await r.json()) as Res;

      if (!r.ok || !j.ok) throw new Error(j.error ?? "Error");

      setCreated(j.user ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrap>
      <Card>
        <Title>Debug · Impersonate</Title>
        <Sub>
          Crea un user+session (cookie) para testear múltiples jugadores en incógnito.
        </Sub>

        <Label>Nombre</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Jugador 1"
          disabled={busy}
          maxLength={32}
        />

        <Label style={{ marginTop: 12 }}>StoryNode inicial</Label>
        <Input
          value={storyNode}
          onChange={(e) => setStoryNode(e.target.value)}
          placeholder="qr3"
          disabled={busy}
        />

        {error ? <ErrorBox>{error}</ErrorBox> : null}

        <Row>
          <Btn disabled={busy || trimmed.length < 2} onClick={submit}>
            {busy ? "Creando…" : "Crear sesión"}
          </Btn>

          <BtnGhost
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Ir al juego
          </BtnGhost>
        </Row>

        {created ? (
          <OkBox>
            <div><b>Listo.</b></div>
            <div>ID: {created.id}</div>
            <div>Nombre: {created.name}</div>
            <div>StoryNode: {created.storyNode}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              Ahora abrí <b>/</b> (o recargá el juego) en esta misma pestaña.
            </div>
          </OkBox>
        ) : null}
      </Card>
    </Wrap>
  );
}

const Wrap = styled.div`
  min-height: 100svh;
  display: grid;
  place-items: center;
  background: #000;
  color: #fff;
  padding: 16px;
`;

const Card = styled.div`
  width: min(560px, 96vw);
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  padding: 16px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 16px;
`;

const Sub = styled.div`
  margin-top: 6px;
  opacity: 0.8;
  font-size: 13px;
`;

const Label = styled.div`
  margin-top: 14px;
  font-weight: 900;
  font-size: 12px;
  opacity: 0.85;
`;

const Input = styled.input`
  width: 100%;
  margin-top: 8px;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  outline: none;
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

const ErrorBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,120,120,0.35);
  background: rgba(255,120,120,0.12);
  font-size: 13px;
`;

const OkBox = styled.div`
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(140,255,180,0.35);
  background: rgba(140,255,180,0.12);
  font-size: 13px;
`;
