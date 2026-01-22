// src/components/CharacterCreation.tsx
"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import QrScanner from "@/components/QrScanner";

type CreateSessionRes = { ok: boolean; sessionId?: string; userId?: string; error?: string };

type Props = {
  /**
   * Llamado cuando la sesión se creó OK (cookie ya seteada en el server).
   * Ideal: el orquestador hace fetchUser/doBoot después.
   */
  onCreated: () => void | Promise<void>;

  /**
   * Opcional: para cerrar si lo renderizás en modal/overlay.
   */
  onClose?: () => void;
};

export default function CharacterCreation({ onCreated, onClose }: Props) {
  const [step, setStep] = useState<"name" | "qr">("name");
  const [name, setName] = useState("");

  const trimmedName = useMemo(() => name.trim(), [name]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(code: string) {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, name: trimmedName }),
      });

      const data = (await res.json().catch(() => null)) as CreateSessionRes | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? `Error (${res.status})`);
        setBusy(false);
        return;
      }

      await onCreated();
    } catch (e: any) {
      setError(e?.message ?? "Error");
      setBusy(false);
    }
  }

  return (
    <Shell>
      <Card>
        <HeaderRow>
          <Title>Creación de personaje</Title>
          {onClose ? (
            <CloseBtn onClick={onClose} aria-label="Cerrar">
              ✕
            </CloseBtn>
          ) : null}
        </HeaderRow>

        {step === "name" ? (
          <>
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Federico"
              maxLength={32}
              autoFocus
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmedName.length >= 2) {
                  setError(null);
                  setStep("qr");
                }
              }}
            />

            <Hint>Después vas a escanear un QR para crear la sesión.</Hint>

            {error ? <ErrorText>{error}</ErrorText> : null}

            <Row>
              <Button
                disabled={busy || trimmedName.length < 2}
                onClick={() => {
                  setError(null);
                  setStep("qr");
                }}
              >
                Continuar
              </Button>
            </Row>
          </>
        ) : (
          <>
            <Hint>Escaneá el QR para crear tu sesión.</Hint>

            {error ? <ErrorText>{error}</ErrorText> : null}
            {busy ? <Hint>Creando sesión…</Hint> : null}

            <ScannerWrap>
              <QrScanner
                onClose={() => setStep("name")}
                stopOnSuccess={true}
                onCode={async (code) => {
                  // si todavía está creando sesión, ignoramos
                  if (busy) return;
                  await submit(code);
                }}
              />
            </ScannerWrap>

            <Row>
              <Ghost
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setStep("name");
                }}
              >
                Volver
              </Ghost>
            </Row>
          </>
        )}
      </Card>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100svh;
  background: #000;
  color: #fff;
  display: grid;
  place-items: center;
  padding: 16px;
`;

const Card = styled.div`
  width: min(520px, 92vw);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 18px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 18px;
  margin-bottom: 12px;
`;

const CloseBtn = styled.button`
  margin-top: -6px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border-radius: 999px;
  width: 34px;
  height: 34px;
  font-size: 18px;
  cursor: pointer;
`;

const Label = styled.div`
  font-weight: 800;
  opacity: 0.9;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  border-radius: 12px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  outline: none;
`;

const Hint = styled.div`
  opacity: 0.75;
  font-size: 13px;
  margin-top: 10px;
`;

const ErrorText = styled.div`
  margin-top: 10px;
  color: #ffb3b3;
  font-weight: 800;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;
  justify-content: flex-end;
`;

const Button = styled.button`
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Ghost = styled(Button)`
  background: rgba(255, 255, 255, 0.06);
`;

const ScannerWrap = styled.div`
  margin-top: 12px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
`;
