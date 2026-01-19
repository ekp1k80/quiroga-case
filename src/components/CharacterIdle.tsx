"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";

type Props = {
  size?: number;

  idleSrc: string;
  blinkSrc: string;
  mouthOpenSrc: string;
  blinkMouthOpenSrc: string;

  talking?: boolean;
  enableBlink?: boolean;
  enableBreathing?: boolean;

  // tuning
  tickMs?: number; // frecuencia del loop lógico (recomendado 40-80ms)
  talkFrameMs?: number; // alternancia boca
  blinkEveryMs?: [number, number]; // random
  blinkDurationMs?: number; // duración blink
};

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

type FrameKey = "idle" | "blink" | "mouth" | "blinkMouth";

export default function MartinIdle({
  size = 96,

  idleSrc,
  blinkSrc,
  mouthOpenSrc,
  blinkMouthOpenSrc,

  talking = false,
  enableBlink = true,
  enableBreathing = true,

  tickMs = 50,
  talkFrameMs = 200,
  blinkEveryMs = [1800, 4200],
  blinkDurationMs = 110,
}: Props) {
  const [frameKey, setFrameKey] = useState<FrameKey>("idle");

  // Estado interno del “motor” (refs => no se desincronizan)
  const nextBlinkAtRef = useRef<number>(0);
  const blinkUntilRef = useRef<number>(0);

  const talkPhaseRef = useRef<0 | 1>(0); // 0=closed, 1=open
  const nextTalkFlipAtRef = useRef<number>(0);

  const initSchedule = () => {
    const now = Date.now();

    // blink
    const [minB, maxB] = blinkEveryMs;
    nextBlinkAtRef.current = now + randInt(minB, maxB);
    blinkUntilRef.current = 0;

    // talk
    talkPhaseRef.current = 0;
    nextTalkFlipAtRef.current = now + talkFrameMs;
  };

  // init una vez
  useEffect(() => {
    initSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // si cambian params importantes, reprogramamos para que no quede raro
  useEffect(() => {
    initSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talkFrameMs, blinkDurationMs, blinkEveryMs[0], blinkEveryMs[1]]);

  useEffect(() => {
    let mounted = true;

    const id = window.setInterval(() => {
      if (!mounted) return;
      const now = Date.now();

      // 1) TALK: alternar boca si corresponde
      if (talking) {
        if (now >= nextTalkFlipAtRef.current) {
          talkPhaseRef.current = talkPhaseRef.current === 0 ? 1 : 0;
          nextTalkFlipAtRef.current = now + talkFrameMs;
        }
      } else {
        // si no está hablando, forzamos boca cerrada
        talkPhaseRef.current = 0;
      }

      // 2) BLINK: decidir inicio/fin
      if (!enableBlink) {
        blinkUntilRef.current = 0;
      } else {
        const isBlinking = now < blinkUntilRef.current;

        if (!isBlinking && now >= nextBlinkAtRef.current) {
          // empieza blink
          blinkUntilRef.current = now + blinkDurationMs;

          // programar próximo blink (random)
          const [minB, maxB] = blinkEveryMs;
          nextBlinkAtRef.current = now + randInt(minB, maxB);
        }
      }

      const isBlinkingNow = now < blinkUntilRef.current;
      const mouthOpenNow = talking && talkPhaseRef.current === 1;

      // 3) Elegir frame resultante
      let nextKey: FrameKey;
      if (isBlinkingNow && mouthOpenNow) nextKey = "blinkMouth";
      else if (isBlinkingNow) nextKey = "blink";
      else if (mouthOpenNow) nextKey = "mouth";
      else nextKey = "idle";

      // 4) setState solo si cambia (evita renders al pedo)
      setFrameKey((prev) => (prev === nextKey ? prev : nextKey));
    }, Math.max(16, tickMs));

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [
    talking,
    enableBlink,
    tickMs,
    talkFrameMs,
    blinkEveryMs,
    blinkDurationMs,
  ]);

  const currentSrc = useMemo(() => {
    switch (frameKey) {
      case "blinkMouth":
        return blinkMouthOpenSrc;
      case "blink":
        return blinkSrc;
      case "mouth":
        return mouthOpenSrc;
      default:
        return idleSrc;
    }
  }, [frameKey, idleSrc, blinkSrc, mouthOpenSrc, blinkMouthOpenSrc]);

  return (
    <BreathWrap $breath={enableBreathing}>
      <img
        src={currentSrc}
        alt="Martín idle"
        width={size}
        height={size}
        draggable={false}
        style={{
          imageRendering: "pixelated",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </BreathWrap>
  );
}

/* ===== breathing (CSS) ===== */

const breathe = keyframes`
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(1.02); }
  100% { transform: scaleY(1); }
`;

const BreathWrap = styled.div<{ $breath: boolean }>`
  display: inline-block;
  transform-origin: bottom center;

  ${({ $breath }) =>
    $breath &&
    css`
      animation: ${breathe} 1000ms ease-in-out infinite;
    `}
`;
