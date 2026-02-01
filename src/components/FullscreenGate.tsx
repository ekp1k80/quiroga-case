// src/components/FullscreenGate.tsx
"use client";

import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";

type Props = {
  title?: string;
  subtitle?: string;
  onReady: () => void;
};

export default function FullscreenGate({
  title = "Tap para continuar",
  subtitle = "Activa pantalla completa y audio",
  onReady,
}: Props) {
  const { enter } = useFullscreen();
  const { unlockNow } = useSoundUnlock();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleTap = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);

    try {
      // enter puede fallar/no-op si ya estás fullscreen, no pasa nada.
      try {
        // await enter();
      } catch {}

      // esto SÍ necesita gesto del usuario
      await unlockNow();

      onReady();
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo activar audio/pantalla completa.");
      setBusy(false);
    }
  }, [busy, enter, unlockNow, onReady]);

  return (
    <Full>
      <Card onClick={handleTap} role="button" aria-label="Activar pantalla completa y audio">
        <H1>{busy ? "Activando…" : title}</H1>
        <P>{subtitle}</P>
        {err ? <Err>{err}</Err> : null}
        <Hint>{busy ? "Un segundo…" : "(toca la pantalla)"}</Hint>
      </Card>
    </Full>
  );
}

const Full = styled.div`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100svh;
  background: #000;
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
`;

const Card = styled.div`
  width: min(560px, 96vw);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  padding: 18px;
  cursor: pointer;
  user-select: none;
  text-align: center;
`;

const H1 = styled.div`
  font-weight: 950;
  font-size: 16px;
`;

const P = styled.div`
  margin-top: 10px;
  opacity: 0.8;
  font-size: 13px;
`;

const Hint = styled.div`
  margin-top: 14px;
  opacity: 0.65;
  font-size: 12px;
`;

const Err = styled.div`
  margin-top: 12px;
  color: rgba(255, 120, 120, 0.95);
  font-weight: 800;
  font-size: 12px;
`;
