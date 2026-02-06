// src/components/GameChatConsole.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

export type ChatApiMessage =
  | string
  | { type: "img"; src: string; alt?: string; caption?: string };

export type ChatConsoleMessage = {
  id: string;
  at: number;
  from: "system" | "player";
  text: ChatApiMessage;
};

export type ChatChoice = { id: string; label: string };

type Props = {
  title?: string;
  subtitle?: string;

  messages: ChatConsoleMessage[];

  choices?: ChatChoice[];

  inputPlaceholder?: string;
  disabled?: boolean;
  sending?: boolean;

  systemTyping?: boolean;

  onSend: (rawText: string, normalizedText: string) => void;

  onResetLocal?: () => void;
  resetLabel?: string;

  clearKey?: string | number;

  // tuning
  prologueDelayMs?: number; // default 650 (primer cadena)
  systemChainDelayMs?: number; // default 650 (cadenas posteriores)
  chainTypingMs?: number; // default 520 (burbuja "..." entre mensajes)
};

function normalizeInput(s: string) {
  return s.trim().toLowerCase();
}

function isAllSystem(messages: ChatConsoleMessage[]) {
  return messages.length > 0 && messages.every((m) => m.from === "system");
}

function keyForMsgs(messages: ChatConsoleMessage[]) {
  return messages.map((m) => m.id).join("|");
}

type Run = { start: number; end: number; from: "system" | "player" };

function lastSystemRun(messages: ChatConsoleMessage[]): { run: Run; key: string; len: number } | null {
  if (!messages.length) return null;

  let i = messages.length - 1;
  if (messages[i].from !== "system") return null;

  const end = i;
  while (i >= 0 && messages[i].from === "system") i--;
  const start = i + 1;

  const len = end - start + 1;
  if (len <= 1) return null;

  const key = messages.slice(start, end + 1).map((m) => m.id).join("|");
  return { run: { start, end, from: "system" }, key, len };
}

function seenKeyForRun(runKey: string) {
  return `cq:chat:syschain_seen:${runKey}`;
}

function hasSeen(runKey: string) {
  try {
    return sessionStorage.getItem(seenKeyForRun(runKey)) === "1";
  } catch {
    return false;
  }
}

function markSeen(runKey: string) {
  try {
    sessionStorage.setItem(seenKeyForRun(runKey), "1");
  } catch {
    // ignore
  }
}

export default function GameChatConsole({
  title = "Terminal",
  subtitle,
  messages,
  choices = [],
  inputPlaceholder = "Respuesta…",
  disabled,
  sending,
  systemTyping,
  onSend,
  clearKey,
  prologueDelayMs = 1500,
  systemChainDelayMs = 1500,
  chainTypingMs = 520,
  onResetLocal,
  resetLabel = "Reiniciar chat",
}: Props) {
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // ===== Base que ya funcionaba: prologue (todo system) =====
  const prologueActive = useMemo(() => isAllSystem(messages), [messages]);

  // ===== Nuevo: reveal de "cadenas" system al final (post respuesta) =====
  const lastChain = useMemo(() => lastSystemRun(messages), [messages]);

  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };

  // visibleCount controla cuántos mensajes reales se renderizan
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    // init: si es prologue, arranca en 0 (como tu base)
    return prologueActive ? 0 : messages.length;
  });

  // typing "fake" durante reveals (para burbuja "...")
  const [revealTyping, setRevealTyping] = useState(false);

  const composerRef = useRef<HTMLDivElement | null>(null);
  const [keyboardShift, setKeyboardShift] = useState(0);

  const baseComposerBottomRef = useRef<number | null>(null);
  const keyboardOpenRef = useRef(false);
  const rafRef = useRef<number | null>(null);


  const lastPrologueKeyRef = useRef<string>("");
  const lastChainKeyRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const stopRaf = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const update = () => {
      const comp = composerRef.current;
      if (!comp) return;

      const rect = comp.getBoundingClientRect();
      const keyboardTop = vv.offsetTop + vv.height;

      // Si no hay teclado (o volvió a normal), guardamos la base “real” (sin corrección)
      // Nota: no dependemos de innerHeight; usamos el propio viewport visible.
      const isKeyboardOpen = keyboardTop < window.innerHeight - 4;

      if (!isKeyboardOpen) {
        keyboardOpenRef.current = false;
        baseComposerBottomRef.current = rect.bottom;
        setKeyboardShift(0);
        stopRaf();
        return;
      }

      keyboardOpenRef.current = true;

      // BaseBottom: dónde quedaría el composer en condiciones normales (sin shift).
      // Si por algún motivo no la tenemos, la tomamos ahora mismo (mejor que nada).
      const baseBottom = baseComposerBottomRef.current ?? rect.bottom;

      // Shift = cuánto hay que subir para que el bottom quede arriba del teclado.
      // Le sumo un margen mínimo para que no quede “pegado”.
      const margin = 8;
      const shift = Math.max(0, Math.ceil(baseBottom - keyboardTop + margin));

      setKeyboardShift(shift);
    };

    // iOS: al abrir teclado, durante unos frames cambian valores -> hacemos settle loop corto
    const settle = (framesLeft: number) => {
      update();
      if (framesLeft <= 0) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(() => settle(framesLeft - 1));
    };

    const onViewportChange = () => {
      // Cuando detectamos teclado abierto, corremos settle unos frames para evitar “flash”
      const keyboardTop = vv.offsetTop + vv.height;
      const isKeyboardOpen = keyboardTop < window.innerHeight - 4;

      if (isKeyboardOpen) {
        stopRaf();
        settle(25); // ~25 frames ≈ 400ms @60hz
      } else {
        update();
      }
    };

    // Inicial: setear base
    update();

    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);

    return () => {
      stopRaf();
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
    };
  }, []);



  // Ajuste de visibleCount cuando cambia prologueActive (evita quedar clavado en 0)
  useEffect(() => {
    if (!prologueActive) {
      setVisibleCount((v) => Math.max(v, messages.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prologueActive]);

  useEffect(() => {
    // REGLA 1: si es prologue (todos system), usamos EXACTAMENTE el comportamiento base:
    // reveal desde 0 hasta N con delay fijo.
    const prologueKey = `${prologueActive ? "P" : "N"}:${keyForMsgs(messages)}`;

    if (prologueActive) {
      // si cambió (nuevo batch prologue), reiniciamos
      if (lastPrologueKeyRef.current !== prologueKey) {
        clearTimers();
        lastPrologueKeyRef.current = prologueKey;

        setRevealTyping(true);
        setVisibleCount(0);

        const total = messages.length;

        for (let i = 1; i <= total; i++) {
          const t = window.setTimeout(() => {
            setVisibleCount(i);
            // typing entre mensajes
            if (i < total) setRevealTyping(true);
            else setRevealTyping(false);
          }, i * prologueDelayMs);
          timersRef.current.push(t);
        }
      }

      return;
    }

    // REGLA 2: NO prologue → animar SOLO si hay una cadena system al final (len>1),
    // que todavía NO fue mostrada, y SOLO esa parte (no tocar lo anterior ni el player).
    if (!lastChain) {
      clearTimers();
      setRevealTyping(false);
      setVisibleCount(messages.length);
      lastChainKeyRef.current = ""; // no hay chain activa
      return;
    }

    const chainKey = lastChain.key;

    // si ya la vimos en esta sesión (tab switch / remount), no animar
    if (hasSeen(chainKey)) {
      clearTimers();
      setRevealTyping(false);
      setVisibleCount(messages.length);
      lastChainKeyRef.current = chainKey;
      return;
    }

    // si es la misma chainKey que ya estamos/estuvimos animando en este montaje, no reiniciar
    if (lastChainKeyRef.current === chainKey) {
      // aseguramos que el estado final sea correcto
      setVisibleCount((v) => Math.max(v, messages.length));
      return;
    }

    // Nueva chain detectada → animar
    lastChainKeyRef.current = chainKey;
    clearTimers();

    const baseVisible = lastChain.run.start; // todo lo anterior visible
    const runLen = lastChain.len;

    setVisibleCount(baseVisible);
    setRevealTyping(true);

    // Secuencia: typing (chainTypingMs) -> aparece msg -> pausa (systemChainDelayMs) -> typing -> ...
    let acc = 0;

    for (let i = 1; i <= runLen; i++) {
      // mostrar typing antes de cada mensaje
      const tTyping = window.setTimeout(() => {
        setRevealTyping(true);
      }, acc);
      timersRef.current.push(tTyping);

      acc += chainTypingMs;

      const tShow = window.setTimeout(() => {
        setVisibleCount(baseVisible + i);
        if (i === runLen) {
          setRevealTyping(false);
          markSeen(chainKey);
        }
      }, acc);
      timersRef.current.push(tShow);

      // delay después de mostrar (menos en el último)
      if (i < runLen) {
        acc += systemChainDelayMs;
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prologueActive, prologueDelayMs, systemChainDelayMs, chainTypingMs, messages, lastChain]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleMessages = useMemo(() => {
    if (prologueActive) return messages.slice(0, visibleCount);
    return messages.slice(0, Math.min(messages.length, visibleCount));
  }, [messages, prologueActive, visibleCount]);

  const isRevealing = useMemo(() => {
    // si estamos en prologue y aún no terminó
    if (prologueActive) return visibleCount < messages.length;
    // si no prologue, estamos revelando si hay typing fake o si todavía faltan mensajes por mostrar
    return revealTyping || visibleCount < messages.length;
  }, [prologueActive, revealTyping, visibleCount, messages.length]);

  // choices NO deben mostrarse mientras hay reveal (prologue o chain)
  const shouldShowChoices = useMemo(() => {
    if (isRevealing) return false;
    if (!choices?.length) return false;
    // además si el backend está marcando typing, tampoco
    if (systemTyping) return false;
    return true;
  }, [choices?.length, isRevealing, systemTyping]);

  const canSend = useMemo(() => {
    if (disabled) return false;
    if (sending) return false;
    // bloqueá input mientras reveal
    if (isRevealing) return false;
    const n = normalizeInput(value);
    return n.length > 0;
  }, [disabled, sending, isRevealing, value]);

  const canChoose = useMemo(() => {
    if (disabled) return false;
    if (sending) return false;
    if (systemTyping) return false;
    if (isRevealing) return false;
    return true;
  }, [disabled, sending, systemTyping, isRevealing]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleMessages.length, shouldShowChoices, systemTyping, revealTyping]);

  useEffect(() => {
    setValue("");
  }, [clearKey]);

  useEffect(() => {
    if (isRevealing) return;
    // inputRef.current?.focus();
  }, [visibleMessages.length, isRevealing, systemTyping]);

  const submit = () => {
    const raw = value;
    const normalized = normalizeInput(raw);
    if (!normalized || !canSend) return;

    onSend(raw, normalized);
    setValue("");
    // requestAnimationFrame(() => inputRef.current?.focus());
  };

  const choose = (c: ChatChoice) => {
    if (!canChoose) return;
    onSend(c.label, c.id);
    setValue("");
    // requestAnimationFrame(() => inputRef.current?.focus());
  };

  const renderBubble = (m: ChatConsoleMessage) => {
    const isPlayer = m.from === "player";

    if (typeof m.text === "string") {
      return <Bubble $player={isPlayer}>{m.text}</Bubble>;
    }

    if (m.text.type === "img") {
      return (
        <ImageBubble $player={isPlayer}>
          <ChatImage src={m.text.src} alt={m.text.alt ?? ""} />
          {m.text.caption ? <ImageCaption>{m.text.caption}</ImageCaption> : null}
        </ImageBubble>
      );
    }

    return <Bubble $player={isPlayer}>—</Bubble>;
  };

  const showTypingBubble = systemTyping || revealTyping;

  return (
    <Shell>
      <Header>
        <HeaderLeft>
          <HeaderTitle>{title}</HeaderTitle>
          {subtitle ? <HeaderSub>{subtitle}</HeaderSub> : null}
        </HeaderLeft>

        <HeaderRight>
          {sending ? <StatusPill>Enviando…</StatusPill> : null}
          {showTypingBubble ? <StatusPill>…</StatusPill> : null}
          {disabled ? <StatusPill>Bloqueado</StatusPill> : null}
          {onResetLocal ? (
            <ResetBtn
              type="button"
              onClick={() => {
                const ok = window.confirm("¿Reiniciar el chat local? Esto borra el historial guardado en este dispositivo.");
                if (ok) onResetLocal();
              }}
              aria-label="Reiniciar chat local"
            >
              {resetLabel}
            </ResetBtn>
          ) : null}
        </HeaderRight>
      </Header>

      <Messages ref={listRef}>
        {messages.length === 0 ? (
          <Empty>
            <EmptyTitle>Sin mensajes</EmptyTitle>
            <EmptyText>Esperando interacción.</EmptyText>
          </Empty>
        ) : (
          <>
            {visibleMessages.map((m) => (
              <Line key={m.id} $player={m.from === "player"}>
                {renderBubble(m)}
              </Line>
            ))}

            {/* Choices como “mensaje” del jugador, separado del input */}
            {shouldShowChoices ? (
              <Line $player={true}>
                <ChoiceBubble aria-label="Opciones sugeridas">
                  {choices.map((c) => (
                    <ChoiceBtn key={c.id} onClick={() => choose(c)} disabled={!canChoose}>
                      {c.label}
                    </ChoiceBtn>
                  ))}
                </ChoiceBubble>
              </Line>
            ) : null}

            {/* Burbuja de escribiendo durante reveal/typing */}
            {showTypingBubble ? (
              <Line $player={false}>
                <TypingBubble aria-label="Sistema escribiendo">
                  <Dot />
                  <Dot />
                  <Dot />
                </TypingBubble>
              </Line>
            ) : null}
          </>
        )}
      </Messages>

      <Composer
        ref={composerRef}
        style={{
          transform: keyboardShift ? `translateY(-${keyboardShift}px)` : undefined,
          willChange: keyboardShift ? "transform" : undefined,
        }}
      >
        <ComposerRow>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={inputPlaceholder}
            disabled={!!disabled || !!sending || showTypingBubble || isRevealing}
            onFocus={() => {
              requestAnimationFrame(() => {
                inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <SendBtn onClick={submit} disabled={!canSend}>
            Enviar
          </SendBtn>
        </ComposerRow>
      </Composer>
    </Shell>
  );
}

/* ===================== styles ===================== */

const Shell = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  color: #fff;

  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.20);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const HeaderLeft = styled.div`
  min-width: 0;
`;

const HeaderTitle = styled.div`
  font-weight: 900;
  font-size: 14px;
`;

const HeaderSub = styled.div`
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 8px;
`;

const StatusPill = styled.div`
  font-size: 12px;
  opacity: 0.85;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
`;

const Messages = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Line = styled.div<{ $player: boolean }>`
  display: flex;
  justify-content: ${(p) => (p.$player ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div<{ $player: boolean }>`
  max-width: min(720px, 92%);
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: ${(p) => (p.$player ? "rgba(140,255,180,0.14)" : "rgba(255,255,255,0.08)")};
  line-height: 1.35;
  font-size: 13px;
  white-space: pre-wrap;
`;

const ImageBubble = styled.div<{ $player: boolean }>`
  max-width: min(720px, 92%);
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: ${(p) => (p.$player ? "rgba(140,255,180,0.14)" : "rgba(255,255,255,0.08)")};
  display: grid;
  gap: 8px;
`;

const ChatImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 12px;
  display: block;
`;

const ImageCaption = styled.div`
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.25;
`;

const TypingBubble = styled.div`
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 6px;
  align-items: center;
  height: 38px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  animation: blink 1.2s infinite ease-in-out;

  &:nth-child(2) {
    animation-delay: 120ms;
  }
  &:nth-child(3) {
    animation-delay: 240ms;
  }

  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.25;
      transform: translateY(0);
    }
    40% {
      opacity: 1;
      transform: translateY(-2px);
    }
  }
`;

const Composer = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.20);
  padding: 10px;
  display: grid;
  gap: 10px;

  /* ayuda en mobile cuando cambia el viewport */
  position: relative;
  z-index: 5;
`;

const ComposerRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.textarea`
  resize: none;
  height: 44px;
  max-height: 120px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 13px;
  outline: none;

  &:disabled {
    opacity: 0.7;
  }
`;

const SendBtn = styled.button`
  border-radius: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.10);
  color: #fff;
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    width: 100%;
  }
`;

const ChoiceBubble = styled.div`
  max-width: min(720px, 92%);
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(140, 255, 180, 0.14);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const ChoiceBtn = styled.button`
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  font-size: 12px;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Empty = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  opacity: 0.85;
`;

const EmptyTitle = styled.div`
  font-weight: 900;
  font-size: 15px;
`;

const EmptyText = styled.div`
  margin-top: 8px;
  opacity: 0.75;
  font-size: 13px;
  text-align: center;
  max-width: 420px;
`;

const ResetBtn = styled.button`
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 120, 120, 0.22);
  background: rgba(255, 120, 120, 0.10);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  font-weight: 900;

  &:active {
    transform: translateY(1px);
  }
`;