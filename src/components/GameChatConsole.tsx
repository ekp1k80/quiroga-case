"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

export type ChatConsoleMessage = {
  id: string;
  at: number;
  from: "system" | "player";
  text: string;
};

type Props = {
  title?: string;
  subtitle?: string;

  messages: ChatConsoleMessage[];

  inputPlaceholder?: string;
  disabled?: boolean;
  sending?: boolean;

  systemTyping?: boolean;

  onSend: (rawText: string, normalizedText: string) => void;

  clearKey?: string | number;
};

function normalizeInput(s: string) {
  return s.trim().toLowerCase();
}

export default function GameChatConsole({
  title = "Terminal",
  subtitle,
  messages,
  inputPlaceholder = "Respuesta…",
  disabled,
  sending,
  systemTyping,
  onSend,
  clearKey,
}: Props) {
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => {
    if (disabled) return false;
    if (sending) return false;
    const n = normalizeInput(value);
    return n.length > 0;
  }, [disabled, sending, value]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, systemTyping]);

  useEffect(() => {
    setValue("");
  }, [clearKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages.length, systemTyping]);

  const submit = () => {
    const raw = value;
    const normalized = normalizeInput(raw);
    if (!normalized || !canSend) return;

    onSend(raw, normalized);
    setValue("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <Shell>
      <Header>
        <HeaderLeft>
          <HeaderTitle>{title}</HeaderTitle>
          {subtitle ? <HeaderSub>{subtitle}</HeaderSub> : null}
        </HeaderLeft>

        <HeaderRight>
          {sending ? <StatusPill>Enviando…</StatusPill> : systemTyping ? <StatusPill>…</StatusPill> : null}
          {disabled ? <StatusPill>Bloqueado</StatusPill> : null}
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
            {messages.map((m) => (
              <Line key={m.id} $player={m.from === "player"}>
                <Bubble $player={m.from === "player"}>{m.text}</Bubble>
              </Line>
            ))}

            {systemTyping ? (
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

      <Composer>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={!!disabled || !!sending || !!systemTyping}
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
