"use client";

import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

let __seq = 0;

export default function FullScreenLoader({
  messages,
  intervalMs = 1700,
  minVisibleMs = 900,
  onMinMessagesReached,
  debugTag,
}: {
  messages: string[];
  intervalMs?: number;
  minVisibleMs?: number;
  onMinMessagesReached?: () => void;
  debugTag?: string;
}) {
  const idRef = useRef(0);
  if (idRef.current === 0) idRef.current = ++__seq;

  const debug = process.env.NODE_ENV !== "production";
  const log = (...args: any[]) => {
    if (debug) console.log(`[FullScreenLoader#${idRef.current}${debugTag ? `:${debugTag}` : ""}]`, ...args);
  };

  const safeMessages = messages?.length ? messages : ["Cargando…"];

  const [idx, setIdx] = useState(0);
  const [shownCount, setShownCount] = useState(0);

  const firedRef = useRef(false);
  const mountedAtRef = useRef(0);
  const timersRef = useRef<{ interval?: number; minVisible?: number }>({});

  useEffect(() => {
    log("MOUNT", { t: now(), intervalMs, minVisibleMs, count: safeMessages.length, safeMessages });
    return () => log("UNMOUNT", { t: now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reset internal state on messages change
    if (timersRef.current.interval) window.clearInterval(timersRef.current.interval);
    if (timersRef.current.minVisible) window.clearTimeout(timersRef.current.minVisible);
    timersRef.current = {};

    firedRef.current = false;
    mountedAtRef.current = now();
    setIdx(0);
    setShownCount(1);

    log("RESET", { t: now(), first: safeMessages[0] });

    // gate de tiempo mínimo visible
    timersRef.current.minVisible = window.setTimeout(() => {
      log("MIN_VISIBLE_OK", { t: now() });
      // si ya mostramos suficiente, cerramos ahora
      if (!firedRef.current && shownCount >= safeMessages.length) {
        firedRef.current = true;
        log("DONE (minVisible satisfied)", { t: now() });
        onMinMessagesReached?.();
      }
    }, Math.max(0, minVisibleMs));

    // si hay más de 1 mensaje, rotamos con interval
    if (safeMessages.length > 1) {
      timersRef.current.interval = window.setInterval(() => {
        setIdx((prev) => {
          const next = Math.min(prev + 1, safeMessages.length - 1);
          return next;
        });
        setShownCount((c) => {
          const nextC = c + 1;
          log("TICK", { t: now(), shownCount: nextC });
          return nextC;
        });
      }, Math.max(600, intervalMs));
    }

    return () => {
      if (timersRef.current.interval) window.clearInterval(timersRef.current.interval);
      if (timersRef.current.minVisible) window.clearTimeout(timersRef.current.minVisible);
      timersRef.current = {};
      log("CLEANUP", { t: now() });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMessages.join("||"), intervalMs, minVisibleMs]);

  // cuando alcanzamos el total de mensajes, esperamos a que se cumpla minVisibleMs (si no se cumplió aún)
  useEffect(() => {
    if (firedRef.current) return;
    if (shownCount < safeMessages.length) return;

    const elapsed = now() - mountedAtRef.current;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    if (remaining <= 0) {
      firedRef.current = true;
      log("DONE (all messages shown)", { t: now(), elapsed });
      onMinMessagesReached?.();
      return;
    }

    log("DONE pending minVisible", { t: now(), elapsed, remaining });
    const t = window.setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      log("DONE (after remaining)", { t: now() });
      onMinMessagesReached?.();
    }, remaining);

    return () => window.clearTimeout(t);
  }, [shownCount, safeMessages.length, minVisibleMs, onMinMessagesReached]);

  return (
    <FullScreen>
      <TipCard>
        <TipTitle>Consejo del barrio</TipTitle>
        <TipText key={`${idx}-${safeMessages[idx]}`}>{safeMessages[idx] ?? "Cargando…"}</TipText>
        <TipMeta>
          Mostradas: {Math.min(shownCount, safeMessages.length)}/{safeMessages.length}
          <Blink />
        </TipMeta>
      </TipCard>
    </FullScreen>
  );
}

const FullScreen = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  display: grid;
  place-items: center;
`;

const TipCard = styled.div`
  width: min(640px, 92vw);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 20px 18px;
  text-align: left;
`;

const TipTitle = styled.div`
  font-weight: 900;
  letter-spacing: 0.02em;
  opacity: 0.9;
  margin-bottom: 10px;
`;

const TipText = styled.div`
  font-weight: 900;
  font-size: 18px;
  line-height: 1.25;
  margin-bottom: 14px;
`;

const TipMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.7;
  font-size: 12px;
`;

const Blink = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  display: inline-block;
  animation: b 900ms ease-in-out infinite;

  @keyframes b {
    0%,
    100% {
      opacity: 0.15;
      transform: scale(0.9);
    }
    50% {
      opacity: 0.9;
      transform: scale(1);
    }
  }
`;
