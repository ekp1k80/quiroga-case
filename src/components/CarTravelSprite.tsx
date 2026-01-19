"use client";

import React, { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";

type Props = {
  // Sprites
  cruiseSrc: string;                 // 1 frame normal
  accelFrames: [string, string];     // 2 frames acelerando

  // Timing
  accelAfterMs: number;              // cuándo acelera desde que se ve (ms)
  cruiseLoopMs?: number;             // cuánto tarda en cruzar la pantalla en cruise
  accelExitMs?: number;              // cuánto tarda en salir en accel
  accelFrameMs?: number;             // alternancia de 2 frames en accel

  // Callbacks
  onStart?: () => void;
  onFinished?: () => void;

  // Layout
  widthPx?: number;
  yVh?: number;
  startXVw?: number; // ej -35
  endXVw?: number;   // ej 120
};

type Phase = "cruise" | "accel" | "done";

function preloadImages(urls: string[]) {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${u}`));
          img.src = u;
        })
    )
  );
}

export default function CarTravel({
  cruiseSrc,
  accelFrames,

  accelAfterMs,
  cruiseLoopMs = 4500,
  accelExitMs = 900,
  accelFrameMs = 120,

  onStart,
  onFinished,

  widthPx = 260,
  yVh = 60,
  startXVw = -35,
  endXVw = 120,
}: Props) {
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("cruise");
  const [accelFrame, setAccelFrame] = useState<0 | 1>(0);

  const accelTimerRef = useRef<number | null>(null);
  const accelExitTimerRef = useRef<number | null>(null);
  const accelFrameTimerRef = useRef<number | null>(null);

  // Llamás onStart al montar (audio unlock afuera)
  useEffect(() => {
    onStart?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload: no mostramos hasta cargar (evita destellos)
  useEffect(() => {
    let alive = true;
    setReady(false);
    setPhase("cruise");
    setAccelFrame(0);

    preloadImages([cruiseSrc, accelFrames[0], accelFrames[1]])
      .then(() => {
        if (!alive) return;
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setReady(false);
      });

    return () => {
      alive = false;
    };
  }, [cruiseSrc, accelFrames]);

  // Programar aceleración (empieza cuando ya está ready)
  useEffect(() => {
    if (!ready) return;
    if (accelAfterMs <= 0) return;

    accelTimerRef.current = window.setTimeout(() => {
      setPhase("accel");
    }, accelAfterMs);

    return () => {
      if (accelTimerRef.current != null) window.clearTimeout(accelTimerRef.current);
      accelTimerRef.current = null;
    };
  }, [ready, accelAfterMs]);

  // Al entrar en accel:
  // - alternar 2 frames
  // - programar salida + onFinished
  useEffect(() => {
    if (!ready) return;

    // limpiar timers previos
    if (accelExitTimerRef.current != null) window.clearTimeout(accelExitTimerRef.current);
    accelExitTimerRef.current = null;

    if (accelFrameTimerRef.current != null) window.clearInterval(accelFrameTimerRef.current);
    accelFrameTimerRef.current = null;

    if (phase !== "accel") return;

    setAccelFrame(0);

    accelFrameTimerRef.current = window.setInterval(() => {
      setAccelFrame((f) => (f === 0 ? 1 : 0));
    }, Math.max(50, accelFrameMs));

    accelExitTimerRef.current = window.setTimeout(() => {
      setPhase("done");
      onFinished?.();
    }, accelExitMs);

    return () => {
      if (accelExitTimerRef.current != null) window.clearTimeout(accelExitTimerRef.current);
      accelExitTimerRef.current = null;

      if (accelFrameTimerRef.current != null) window.clearInterval(accelFrameTimerRef.current);
      accelFrameTimerRef.current = null;
    };
  }, [ready, phase, accelExitMs, accelFrameMs, onFinished]);

  useEffect(() => {
    return () => {
      if (accelTimerRef.current != null) window.clearTimeout(accelTimerRef.current);
      if (accelExitTimerRef.current != null) window.clearTimeout(accelExitTimerRef.current);
      if (accelFrameTimerRef.current != null) window.clearInterval(accelFrameTimerRef.current);
    };
  }, []);

  if (!ready || phase === "done") return null;

  const src = phase === "accel" ? accelFrames[accelFrame] : cruiseSrc;

  return (
    <Stage>
      <Sprite
        $phase={phase}
        $wPx={widthPx}
        $yVh={yVh}
        $startXVw={startXVw}
        $endXVw={endXVw}
        $cruiseLoopMs={cruiseLoopMs}
        $accelExitMs={accelExitMs}
      >
        <img src={src} alt="" draggable={false} />
      </Sprite>
    </Stage>
  );
}

/* ================= styles ================= */

const Stage = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
`;

const cruiseMove = (startXVw: number, endXVw: number, yVh: number) => keyframes`
  from { transform: translate(${startXVw}vw, ${yVh}vh); }
  to   { transform: translate(${endXVw}vw, ${yVh}vh); }
`;

const accelExit = (currentXVw: number, endXVw: number, yVh: number) => keyframes`
  from { transform: translate(${currentXVw}vw, ${yVh}vh); opacity: 1; }
  to   { transform: translate(${endXVw}vw, ${yVh}vh); opacity: 0; }
`;

// “ruta”: vibración chica sin levitar (pies del auto no importan tanto)
const roadBob = keyframes`
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(0px) rotate(0.2deg); }
  50%  { transform: translateY(1px) rotate(0deg); }
  75%  { transform: translateY(0px) rotate(-0.2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const accelShake = keyframes`
  0%   { transform: translateY(0px) rotate(0deg); }
  20%  { transform: translateY(1px) rotate(0.6deg); }
  40%  { transform: translateY(0px) rotate(-0.6deg); }
  60%  { transform: translateY(1px) rotate(0.4deg); }
  80%  { transform: translateY(0px) rotate(-0.4deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const Sprite = styled.div<{
  $phase: Phase;
  $wPx: number;
  $yVh: number;
  $startXVw: number;
  $endXVw: number;
  $cruiseLoopMs: number;
  $accelExitMs: number;
}>`
  position: absolute;
  left: 0;
  top: 0;
  width: ${({ $wPx }) => $wPx}px;
  will-change: transform, opacity;
  transform-origin: bottom center;

  ${({ $phase, $startXVw, $endXVw, $yVh, $cruiseLoopMs }) =>
    $phase === "cruise" &&
    css`
      /* Move infinito izquierda→derecha */
      animation: ${cruiseMove($startXVw, $endXVw, $yVh)} ${$cruiseLoopMs}ms linear infinite;
    `}

  ${({ $phase, $endXVw, $yVh, $accelExitMs }) =>
    $phase === "accel" &&
    css`
      /* En accel: congelamos donde “esté” visualmente no es trivial con CSS puro,
         así que hacemos una salida rápida desde startXVw. En práctica se ve bien
         si startXVw está fuera (entra y acelera cerca de mitad). */
      animation: ${cruiseMove(-10, $endXVw, $yVh)} ${$accelExitMs}ms linear forwards;
      opacity: 1;
    `}

  /* Bobbing overlay via pseudo-element no: lo hacemos con wrapper interno */
  img {
    width: 100%;
    height: auto;
    display: block;
    image-rendering: pixelated;
    user-select: none;
    pointer-events: none;

    ${({ $phase }) =>
      $phase === "cruise"
        ? css`
            animation: ${roadBob} 700ms linear infinite;
          `
        : css`
            animation: ${accelShake} 220ms linear infinite;
          `}
  }
`;
